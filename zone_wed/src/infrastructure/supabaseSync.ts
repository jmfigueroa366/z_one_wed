// CAPA: Infraestructura
import { supabase, haySupabase } from '../lib/supabaseClient.ts';
import { Storage } from './storage.ts';

type FilaSupabase = Record<string, unknown>;

const clientePorDefecto = supabase;

// Cliente con el que se habla con Supabase. Se puede sustituir (por ejemplo
// en las pruebas) para comprobar que se escriben las filas correctas.
let cliente: typeof supabase = clientePorDefecto;

export function configurarClienteSupabase(nuevo: unknown): void {
    cliente = nuevo as typeof supabase;
}

// ¿Se puede escribir en Supabase? Si hay credenciales reales o se ha
// configurado un cliente, la respuesta es si.
export function hayConexionSupabase(): boolean {
    return haySupabase || cliente !== clientePorDefecto;
}

// Trae una tabla de Supabase y la deja en el almacenamiento local
// que la app ya usa (as� los hooks y componentes no cambian).
export async function sincronizarTabla(tabla: string, clave: string) {
    const { data, error } = await cliente.from(tabla).select('*');

    if (error) {
        throw new Error(error.message);
    }

    Storage.guardarValor(clave, data ?? []);
    return data ?? [];
}

// El id que una entidad tiene en Supabase. El id local puede ser un numero
// generado en el navegador, asi que solo el id remoto sirve para escribir
// o borrar la fila. Si la entidad nunca se subio, no hay id remoto.
export function idRemoto(entidad: { id_remoto?: unknown } | null | undefined): number | string | null {
    if (!entidad) {
        return null;
    }
    const remoto = entidad.id_remoto;
    if (remoto == null) {
        return null;
    }
    return typeof remoto === 'number' || typeof remoto === 'string' ? remoto : null;
}

// Igual que idRemoto, pero acepta el id local como alternativa para las
// entidades que se leen directamente de Supabase (su id ya es el remoto).
export function idRemotoOPropio(entidad: { id_remoto?: unknown; id?: unknown } | null | undefined): number | string | null {
    const remoto = idRemoto(entidad);
    if (remoto != null) {
        return remoto;
    }
    const propio = entidad?.id;
    if (typeof propio === 'number' || typeof propio === 'string') {
        return propio;
    }
    return null;
}

// --- Escrituras encadenadas por entidad -------------------------------------
// El alta en Supabase y los cambios de estado posteriores se ejecutan en orden
// para cada entidad. Asi un "autorizar" que llega antes de que termine el
// insert no se pierde ni se aplica sobre la fila equivocada.
const cadenas = new Map<string, Promise<unknown>>();
const idsRemotos = new Map<string, number | string>();

// Guarda en memoria el id que Supabase asigno a una entidad, para poder
// usarlo aunque la lista local ya se haya reemplazado por la de Supabase.
export function recordarIdRemoto(clave: string, id: unknown): void {
    if (id == null) {
        return;
    }
    if (typeof id === 'number' || typeof id === 'string') {
        idsRemotos.set(clave, id);
    }
}

// El id remoto recordado para la entidad, o null si todavia no se conoce.
export function idRemotoRecordado(clave: string): number | string | null {
    return idsRemotos.get(clave) ?? null;
}

// Encola una escritura. Las escrituras de la misma clave se ejecutan una
// detras de otra; un fallo no impide que siga la siguiente.
export function encadenarEscritura(clave: string, operacion: () => Promise<unknown>): Promise<unknown> {
    const anterior = cadenas.get(clave) ?? Promise.resolve();
    const siguiente = anterior.then(operacion, operacion);
    cadenas.set(clave, siguiente);
    void siguiente
        .catch(() => undefined)
        .then(() => {
            if (cadenas.get(clave) === siguiente) {
                cadenas.delete(clave);
            }
        });
    return siguiente;
}

// Mapea un colaborador de Supabase al formato que espera la app (seed/modelo).
export function mapearColaborador(row: unknown): FilaSupabase {
    if (!row || typeof row !== 'object') {
        return row as FilaSupabase;
    }
    const fila = row as FilaSupabase;
    const nombre = fila.nombre_artistico || fila.nombre_real || fila.nombre || '';
    const activo = fila.vinculacion !== 'desvinculado' && fila.activo !== false;
    return {
        ...fila,
        nombre,
        activo,
        especialidad: fila.especialidad ?? fila.perfil ?? '',
        perfil: fila.perfil ?? '',
        rol: 'colaborador',
        id_remoto: fila.id ?? null,
    };
}

export async function sincronizarColaboradores() {
    // La vista p�blica la pueden leer todos (clientes e invitados).
    const [privados, publicos] = await Promise.all([
        cliente.from('colaboradores').select('*'),
        cliente.from('colaboradores_publicos').select('*'),
    ]);
    if (privados.error) {
        throw new Error(privados.error.message);
    }
    if (publicos.error) {
        throw new Error(publicos.error.message);
    }

    const filas = new Map<string, FilaSupabase>();
    for (const fila of publicos.data ?? []) {
        const f = fila as FilaSupabase;
        filas.set(String(f.id), f);
    }
    for (const fila of privados.data ?? []) {
        const f = fila as FilaSupabase;
        filas.set(String(f.id), { ...filas.get(String(f.id)), ...f });
    }

    const mapeados = [...filas.values()].map(mapearColaborador);
    Storage.guardarValor('colaboradores', mapeados);
    return mapeados;
}
// Mapea un proyecto de Supabase al formato que espera la app.
export function mapearProyecto(row: unknown): FilaSupabase {
    if (!row || typeof row !== 'object') {
        return row as FilaSupabase;
    }
    const fila = row as FilaSupabase;
    return {
        ...fila,
        usuario_id: fila.usuario_id ?? fila.cliente_id ?? null,
        cliente_id: fila.cliente_id ?? fila.usuario_id ?? null,
        id_remoto: fila.id ?? null,
    };
}

export async function sincronizarProyectos() {
    const { data, error } = await cliente.from('proyectos').select('*');
    if (error) {
        throw new Error(error.message);
    }
    const mapeados = (data ?? []).map(mapearProyecto);
    Storage.guardarValor('proyectos', mapeados);
    return mapeados;
}

// Mapea una canción de Supabase al formato que espera la app.
export function mapearCancion(row: unknown): FilaSupabase {
    if (!row || typeof row !== 'object') {
        return row as FilaSupabase;
    }
    const fila = row as FilaSupabase;
    return {
        ...fila,
        duracion: fila.duracion ?? fila.duracion_seg ?? null,
        duracion_seg: fila.duracion_seg ?? fila.duracion ?? null,
        id_remoto: fila.id ?? null,
    };
}

export async function sincronizarCanciones() {
    const { data, error } = await cliente.from('canciones').select('*');
    if (error) {
        throw new Error(error.message);
    }
    const mapeados = (data ?? []).map(mapearCancion);
    Storage.guardarValor('canciones', mapeados);
    return mapeados;
}
// Mapea una solicitud de Supabase al formato que espera la app.
export function mapearSolicitud(row: unknown): FilaSupabase {
    if (!row || typeof row !== 'object') {
        return row as FilaSupabase;
    }
    const fila = row as FilaSupabase;
    const cliente = (fila.clientes ?? null) as FilaSupabase | null;
    const invitaciones = Array.isArray(fila.solicitud_colaboradores) ? fila.solicitud_colaboradores : [];
    return {
        id: fila.id,
        id_remoto: fila.id ?? null,
        usuario_id: cliente?.usuario_id ?? null,
        solicitante_nombre: cliente?.nombre ?? null,
        titulo: fila.titulo ?? '',
        descripcion: fila.descripcion ?? '',
        tipo: fila.tipo ?? 'grabacion',
        sala_id: fila.sala_id ?? null,
        cancion_id: fila.cancion_id ?? null,
        proyecto_id: fila.proyecto_id ?? null,
        partes: fila.partes ?? [],
        fecha: fila.fecha ?? fila.fecha_deseada ?? null,
        franja: fila.franja ?? '',
        fecha_solicitud: fila.fecha_solicitud ?? fila.creado_en ?? null,
        colaboradores: invitaciones.map((inv) => {
            const item = inv as FilaSupabase;
            return {
                colaborador_id: item.colaborador_id ?? null,
                rol: item.rol ?? null,
                estado: item.estado ?? 'pendiente',
            };
        }),
        estado: fila.estado ?? 'solicitada',
    };
}

export async function sincronizarSolicitudes() {
    const { data, error } = await supabase
        .from('solicitudes')
        .select('*, solicitud_colaboradores(*), clientes(usuario_id, nombre)')
        .order('id');
    if (error) {
        throw new Error(error.message);
    }
    const mapeadas = (data ?? []).map(mapearSolicitud);
    Storage.guardarValor('solicitudes', mapeadas);
    return mapeadas;
}

// Devuelve el id de la fila "clientes" del usuario que tiene la sesi�n.
export async function obtenerMiClienteId() {
    const { data, error } = await cliente.rpc('mi_cliente_id');
    if (error) {
        throw new Error(error.message);
    }
    return data ?? null;
}

export async function insertarSolicitud(solicitud: FilaSupabase): Promise<{ id: unknown }> {
    const clienteId = await obtenerMiClienteId();
    if (!clienteId) {
        throw new Error('Tu cuenta no tiene un cliente asociado en el estudio.');
    }

    const { data, error } = await supabase
        .from('solicitudes')
        .insert({
            cliente_id: clienteId,
            sala_id: solicitud.sala_id ?? null,
            estado: solicitud.estado ?? 'solicitada',
            descripcion: solicitud.descripcion ?? '',
            fecha_deseada: solicitud.fecha ?? null,
            titulo: solicitud.titulo ?? '',
            tipo: solicitud.tipo ?? 'grabacion',
            franja: solicitud.franja ?? '',
            partes: solicitud.partes ?? [],
            cancion_id: solicitud.cancion_id ?? null,
            proyecto_id: solicitud.proyecto_id ?? null,
        })
        .select('id')
        .single();

    if (error) {
        throw new Error(error.message);
    }

    const colaboradores = Array.isArray(solicitud.colaboradores) ? solicitud.colaboradores : [];
    const invitaciones = colaboradores.map((invitacion) => {
        const item = invitacion as FilaSupabase;
        return {
            solicitud_id: (data as FilaSupabase | null)?.id ?? null,
            colaborador_id: item.colaborador_id ?? null,
            rol: item.rol ?? null,
            estado: item.estado ?? 'pendiente',
        };
    });

    if (invitaciones.length > 0) {
        const { error: errorInvitaciones } = await supabase
            .from('solicitud_colaboradores')
            .insert(invitaciones);
        if (errorInvitaciones) {
            throw new Error(errorInvitaciones.message);
        }
    }

    return { id: (data as FilaSupabase | null)?.id ?? null };
}

export async function actualizarEstadoSolicitud(id: unknown, estado: unknown): Promise<void> {
    const { error } = await cliente.from('solicitudes').update({ estado }).eq('id', id);
    if (error) {
        throw new Error(error.message);
    }
}

export async function actualizarInvitacionSolicitud(solicitudId: unknown, colaboradorId: unknown, estado: unknown): Promise<void> {
    const { error } = await supabase
        .from('solicitud_colaboradores')
        .update({ estado })
        .eq('solicitud_id', solicitudId)
        .eq('colaborador_id', colaboradorId);
    if (error) {
        throw new Error(error.message);
    }
}

// Mapea una sesión de Supabase al formato que espera la app.
export function mapearSesion(row: unknown): FilaSupabase {
    if (!row || typeof row !== 'object') {
        return row as FilaSupabase;
    }
    const fila = row as FilaSupabase;
    const estadosValidos = ['solicitada', 'confirmada', 'completada', 'cancelada'];
    return {
        id: fila.id,
        id_remoto: fila.id ?? null,
        solicitud_id: fila.solicitud_id ?? null,
        titulo: fila.titulo ?? '',
        sala_id: fila.sala_id ?? null,
        colaborador_id: fila.colaborador_id ?? null,
        fecha: fila.fecha ?? null,
        hora_inicio: fila.hora_inicio ?? null,
        hora_fin: fila.hora_fin ?? null,
        // 'programada' (default de la BD) no es un estado válido en la app.
        estado: estadosValidos.includes(String(fila.estado)) ? fila.estado : 'confirmada',
        cancion_id: fila.cancion_id ?? null,
        partes: Array.isArray(fila.partes) ? fila.partes : [],
    };
}

export async function sincronizarSesiones() {
    const { data, error } = await cliente.from('sesiones').select('*').order('id');
    if (error) {
        throw new Error(error.message);
    }
    const mapeadas = (data ?? []).map(mapearSesion);
    Storage.guardarValor('sesiones', mapeadas);
    return mapeadas;
}

export async function insertarSesion(sesion: FilaSupabase): Promise<{ id: unknown }> {
    // El cliente de la sesión: si viene del flujo de una solicitud, lo sacamos
    // de la solicitud; si no, del que tiene la sesión iniciada.
    let clienteId = sesion.cliente_id ?? null;

    if (!clienteId && sesion.solicitud_id != null) {
        const { data: solicitud, error: errorSolicitud } = await supabase
            .from('solicitudes')
            .select('cliente_id')
            .eq('id', sesion.solicitud_id)
            .maybeSingle();
        if (errorSolicitud) {
            throw new Error(errorSolicitud.message);
        }
        clienteId = (solicitud as FilaSupabase | null)?.cliente_id ?? null;
    }

    if (!clienteId) {
        clienteId = await obtenerMiClienteId();
    }

    const { data, error } = await supabase
        .from('sesiones')
        .insert({
            solicitud_id: sesion.solicitud_id ?? null,
            cliente_id: clienteId,
            sala_id: sesion.sala_id ?? null,
            colaborador_id: sesion.colaborador_id ?? null,
            cancion_id: sesion.cancion_id ?? null,
            estado: sesion.estado ?? 'confirmada',
            titulo: sesion.titulo ?? '',
            fecha: sesion.fecha ?? null,
            hora_inicio: sesion.hora_inicio ?? null,
            hora_fin: sesion.hora_fin ?? null,
            partes: sesion.partes ?? [],
        })
        .select('id')
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return { id: (data as FilaSupabase | null)?.id ?? null };
}

export async function actualizarEstadoSesion(id: unknown, estado: unknown): Promise<void> {
    const { error } = await cliente.from('sesiones').update({ estado }).eq('id', id);
    if (error) {
        throw new Error(error.message);
    }
}

// Borra una fila remota para que una eliminación local no la resucite en la
// siguiente sincronización. Best-effort: los errores se avisan, no rompen.
export async function eliminarFilaRemota(tabla: string, id: unknown): Promise<void> {
    if (id == null) {
        return;
    }
    const { error } = await cliente.from(tabla).delete().eq('id', id);
    if (error) {
        throw new Error(error.message);
    }
}

// Actualiza los campos editables de una solicitud remota.
export async function actualizarSolicitud(id: unknown, cambios: FilaSupabase): Promise<void> {
    if (id == null) {
        return;
    }
    const { error } = await cliente.from('solicitudes').update(cambios).eq('id', id);
    if (error) {
        throw new Error(error.message);
    }
}

// Actualiza los campos editables de una sesión remota.
export async function actualizarSesion(id: unknown, cambios: FilaSupabase): Promise<void> {
    if (id == null) {
        return;
    }
    const { error } = await cliente.from('sesiones').update(cambios).eq('id', id);
    if (error) {
        throw new Error(error.message);
    }
}

// Recarga los datos que dependen del usuario logueado.
export async function refrescarDatosUsuario() {
    await Promise.allSettled([
        sincronizarColaboradores(),
        sincronizarProyectos(),
        sincronizarCanciones(),
        sincronizarSolicitudes(),
        sincronizarSesiones(),
    ]);
}