// CAPA: Infraestructura
import { supabase } from '../lib/supabaseClient.js';
import { Storage } from './storage.js';

// Trae una tabla de Supabase y la deja en el almacenamiento local
// que la app ya usa (así los hooks y componentes no cambian).
export async function sincronizarTabla(tabla, clave) {
    const { data, error } = await supabase.from(tabla).select('*');

    if (error) {
        throw new Error(error.message);
    }

    Storage.guardarValor(clave, data ?? []);
    return data ?? [];
}

// Mapea un colaborador de Supabase al formato que espera la app (seed/modelo).
export function mapearColaborador(row) {
    if (!row || typeof row !== 'object') {
        return row;
    }
    const nombre = row.nombre_artistico || row.nombre_real || row.nombre || '';
    const activo = row.vinculacion !== 'desvinculado' && row.activo !== false;
    return {
        ...row,
        nombre,
        activo,
        especialidad: row.especialidad ?? row.perfil ?? '',
        perfil: row.perfil ?? '',
        rol: 'colaborador',
    };
}

export async function sincronizarColaboradores() {
    // La vista pública la pueden leer todos (clientes e invitados).
    const [privados, publicos] = await Promise.all([
        supabase.from('colaboradores').select('*'),
        supabase.from('colaboradores_publicos').select('*'),
    ]);
    if (privados.error) {
        throw new Error(privados.error.message);
    }
    if (publicos.error) {
        throw new Error(publicos.error.message);
    }

    const filas = new Map();
    for (const fila of publicos.data ?? []) {
        filas.set(String(fila.id), fila);
    }
    for (const fila of privados.data ?? []) {
        filas.set(String(fila.id), { ...filas.get(String(fila.id)), ...fila });
    }

    const mapeados = [...filas.values()].map(mapearColaborador);
    Storage.guardarValor('colaboradores', mapeados);
    return mapeados;
}
// Mapea un proyecto de Supabase al formato que espera la app.
export function mapearProyecto(row) {
    if (!row || typeof row !== 'object') {
        return row;
    }
    return {
        ...row,
        usuario_id: row.usuario_id ?? row.cliente_id ?? null,
        cliente_id: row.cliente_id ?? row.usuario_id ?? null,
    };
}

export async function sincronizarProyectos() {
    const { data, error } = await supabase.from('proyectos').select('*');
    if (error) {
        throw new Error(error.message);
    }
    const mapeados = (data ?? []).map(mapearProyecto);
    Storage.guardarValor('proyectos', mapeados);
    return mapeados;
}

// Mapea una canción de Supabase al formato que espera la app.
export function mapearCancion(row) {
    if (!row || typeof row !== 'object') {
        return row;
    }
    return {
        ...row,
        duracion: row.duracion ?? row.duracion_seg ?? null,
        duracion_seg: row.duracion_seg ?? row.duracion ?? null,
    };
}

export async function sincronizarCanciones() {
    const { data, error } = await supabase.from('canciones').select('*');
    if (error) {
        throw new Error(error.message);
    }
    const mapeados = (data ?? []).map(mapearCancion);
    Storage.guardarValor('canciones', mapeados);
    return mapeados;
}
// Mapea una solicitud de Supabase al formato que espera la app.
export function mapearSolicitud(row) {
    if (!row || typeof row !== 'object') {
        return row;
    }
    const cliente = row.clientes ?? null;
    return {
        id: row.id,
        usuario_id: cliente?.usuario_id ?? null,
        solicitante_nombre: cliente?.nombre ?? null,
        titulo: row.titulo ?? '',
        descripcion: row.descripcion ?? '',
        tipo: row.tipo ?? 'grabacion',
        sala_id: row.sala_id ?? null,
        cancion_id: row.cancion_id ?? null,
        proyecto_id: row.proyecto_id ?? null,
        partes: row.partes ?? [],
        fecha: row.fecha ?? row.fecha_deseada ?? null,
        franja: row.franja ?? '',
        fecha_solicitud: row.fecha_solicitud ?? row.creado_en ?? null,
        colaboradores: (row.solicitud_colaboradores ?? []).map((inv) => ({
            colaborador_id: inv.colaborador_id ?? null,
            rol: inv.rol ?? null,
            estado: inv.estado ?? 'pendiente',
        })),
        estado: row.estado ?? 'solicitada',
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

// Devuelve el id de la fila "clientes" del usuario que tiene la sesión.
export async function obtenerMiClienteId() {
    const { data, error } = await supabase.rpc('mi_cliente_id');
    if (error) {
        throw new Error(error.message);
    }
    return data ?? null;
}

export async function insertarSolicitud(solicitud) {
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

    const invitaciones = (solicitud.colaboradores ?? []).map((invitacion) => ({
        solicitud_id: data.id,
        colaborador_id: invitacion.colaborador_id,
        rol: invitacion.rol ?? null,
        estado: invitacion.estado ?? 'pendiente',
    }));

    if (invitaciones.length > 0) {
        const { error: errorInvitaciones } = await supabase
            .from('solicitud_colaboradores')
            .insert(invitaciones);
        if (errorInvitaciones) {
            throw new Error(errorInvitaciones.message);
        }
    }

    return { id: data.id };
}

export async function actualizarEstadoSolicitud(id, estado) {
    const { error } = await supabase.from('solicitudes').update({ estado }).eq('id', id);
    if (error) {
        throw new Error(error.message);
    }
}

export async function actualizarInvitacionSolicitud(solicitudId, colaboradorId, estado) {
    const { error } = await supabase
        .from('solicitud_colaboradores')
        .update({ estado })
        .eq('solicitud_id', solicitudId)
        .eq('colaborador_id', colaboradorId);
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
    ]);
}