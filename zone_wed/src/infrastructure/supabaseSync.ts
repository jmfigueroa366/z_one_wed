// CAPA: Infraestructura
import { supabase, haySupabase } from '../lib/supabaseClient.ts';
import { Storage, generarIdUnico } from './storage.ts';
import { usuarioRepo } from '../repositories/usuarioRepo.ts';
import { TIPOS_PROYECTO } from '../config/facturacion.ts';
import {
    idLocalDe,
    idRemotoDe,
    registrarIdRemoto,
    traducirALocal,
} from './identificadores.ts';
import type { TipoEntidad } from './identificadores.ts';

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

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// Espera a que termine la escritura encadenada de otra clave. Lo usa la
// cancion para subir despues de que su proyecto ya tenga id en Supabase.
export function esperarEscritura(clave: string): Promise<unknown> {
    return cadenas.get(clave) ?? Promise.resolve();
}

export function claveProyecto(id: number | string | null | undefined): string {
    return `proyecto:${String(id)}`;
}

export function claveCancion(id: number | string | null | undefined): string {
    return `cancion:${String(id)}`;
}

export function claveColaborador(id: number | string | null | undefined): string {
    return `colaborador:${String(id)}`;
}

export function claveSala(id: number | string | null | undefined): string {
    return `sala:${String(id)}`;
}

// --- Perfiles ----------------------------------------------------------------
// La base de datos usa el enum perfil_colaborador (artista, productor,
// ingeniero_sonido...) y la app usa sus propios nombres (artista, produccion,
// ingeniero). Se traducen en los dos sentidos para no romper los filtros.
const PERFIL_A_BD: Record<string, string> = {
    artista: 'artista',
    produccion: 'productor',
    productor: 'productor',
    ingeniero: 'ingeniero_sonido',
    ingeniero_sonido: 'ingeniero_sonido',
    ingeniero_mezcla: 'ingeniero_mezcla',
    ingeniero_master: 'ingeniero_master',
    otro: 'otro',
};

const PERFIL_A_APP: Record<string, string> = {
    artista: 'artista',
    productor: 'produccion',
    ingeniero_sonido: 'ingeniero',
    ingeniero_mezcla: 'ingeniero',
    ingeniero_master: 'ingeniero',
    otro: 'otro',
};

const ESPECIALIDAD_POR_PERFIL: Record<string, string> = {
    artista: 'Canto',
    productor: 'Producción musical',
    ingeniero_sonido: 'Ingeniero de sonido',
    ingeniero_mezcla: 'Ingeniero de mezcla',
    ingeniero_master: 'Masterización',
    otro: 'Otro',
};

// El perfil que trae la base de datos, traducido al que usa la app.
export function perfilEnApp(perfil: unknown): string {
    const clave = String(perfil ?? '').trim();
    return PERFIL_A_APP[clave] ?? clave;
}

// El perfil que se escribe en la base de datos. Si la app no trae perfil, se
// deduce de la especialidad para que la fila sea valida.
export function perfilEnBd(perfil: unknown, especialidad?: unknown): string {
    const clave = String(perfil ?? '').trim();
    if (PERFIL_A_BD[clave]) {
        return PERFIL_A_BD[clave];
    }
    const texto = String(especialidad ?? '').toLowerCase();
    if (/ingenier/.test(texto)) return 'ingeniero_sonido';
    if (/mezcla|masteriz|grabaci|producci/.test(texto)) return 'productor';
    if (/canto|cantante|voz|artista|composici|instrumental/.test(texto)) return 'artista';
    return 'otro';
}

// --- Lectura del esquema real ------------------------------------------------
// Un valor de la base de datos. Si la columna todavia no existe, la clave no
// viene en la fila y el valor es undefined: la app conserva lo que tenia en
// local en vez de inventarse un dato vacio.
function valorDe(fila: FilaSupabase, columna: string): unknown {
    return columna in fila ? fila[columna] : undefined;
}

// Copia los campos que la base de datos si trae (los undefined se descartan).
function sinIndefinidos(fila: FilaSupabase): FilaSupabase {
    const copia: FilaSupabase = {};
    for (const clave of Object.keys(fila)) {
        if (fila[clave] !== undefined) {
            copia[clave] = fila[clave];
        }
    }
    return copia;
}

function fechaDeHoy(): string {
    return new Date().toISOString().slice(0, 10);
}

// Mapea un colaborador de Supabase al formato que espera la app (seed/modelo).
export function mapearColaborador(row: unknown): FilaSupabase {
    if (!row || typeof row !== 'object') {
        return row as FilaSupabase;
    }
    const fila = row as FilaSupabase;
    const nombre = String(fila.nombre_artistico || fila.nombre_real || fila.nombre || '');
    const vinculacion = String(fila.vinculacion ?? 'activo');
    const perfil = perfilEnApp(fila.perfil);
    return {
        ...fila,
        nombre,
        perfil,
        vinculacion,
        // La especialidad solo existe si la columna ya esta en la base de datos.
        especialidad: 'especialidad' in fila ? String(fila.especialidad ?? '') : undefined,
        // La vista publica no expone el usuario: se conserva el que hay en local.
        usuario_id: 'usuario_id' in fila ? (fila.usuario_id ?? null) : undefined,
        imagen: 'foto' in fila ? (fila.foto ?? null) : undefined,
        activo: vinculacion !== 'desvinculado' && fila.activo !== false,
        rol: 'colaborador',
        id_remoto: fila.id ?? null,
    };
}

// Mapea un proyecto de Supabase al formato que espera la app.
export function mapearProyecto(row: unknown): FilaSupabase {
    if (!row || typeof row !== 'object') {
        return row as FilaSupabase;
    }
    const fila = row as FilaSupabase;
    const cliente = (fila.clientes ?? null) as FilaSupabase | null;
    const tipo = String(fila.tipo ?? '');
    const tipoValido = (Object.values(TIPOS_PROYECTO) as string[]).includes(tipo);
    return {
        ...fila,
        nombre: String(fila.nombre ?? ''),
        // El tipo solo se conoce si la columna existe: si no, se conserva el local.
        tipo: 'tipo' in fila ? (tipoValido ? tipo : TIPOS_PROYECTO.SENCILLO) : undefined,
        estado: fila.estado ?? 'activo',
        cliente_id: valorDe(fila, 'cliente_id') ?? null,
        // El proyecto pertenece a un cliente: su usuario se saca del cliente.
        usuario_id: valorDe(fila, 'usuario_id') ?? cliente?.usuario_id ?? null,
        id_remoto: fila.id ?? null,
    };
}

// Mapea una canción de Supabase al formato que espera la app.
export function mapearCancion(row: unknown): FilaSupabase {
    if (!row || typeof row !== 'object') {
        return row as FilaSupabase;
    }
    const fila = row as FilaSupabase;
    const duracionSeg = valorDe(fila, 'duracion_seg');
    const partes = valorDe(fila, 'partes');
    const requiereEnsayo = valorDe(fila, 'requiere_ensayo');
    const titulo = String(fila.titulo ?? fila.nombre ?? '');
    return {
        ...fila,
        nombre: titulo,
        titulo,
        // La base de datos guarda segundos y la app trabaja con minutos.
        duracion: duracionSeg === undefined
            ? undefined
            : (duracionSeg == null ? null : Number(duracionSeg) / 60),
        duracion_seg: duracionSeg,
        partes: Array.isArray(partes) ? partes : undefined,
        requiere_ensayo: typeof requiereEnsayo === 'boolean' ? requiereEnsayo : undefined,
        proyecto_id: valorDe(fila, 'proyecto_id') ?? null,
        id_remoto: fila.id ?? null,
    };
}

// Mapea una sala de Supabase al formato que espera la app.
export function mapearSala(row: unknown): FilaSupabase {
    if (!row || typeof row !== 'object') {
        return row as FilaSupabase;
    }
    const fila = row as FilaSupabase;
    return {
        ...fila,
        nombre: String(fila.nombre ?? ''),
        precio_hora: Number(fila.precio_hora ?? 0),
        activo: fila.activo !== false,
        id_remoto: fila.id ?? null,
    };
}

// --- Fusion de la lista local con la de Supabase -----------------------------
// La lista local nunca se reemplaza: las filas que ya existen conservan su id
// (las referencias del resto de la app apuntan a el) y solo se les actualizan
// los datos que trae Supabase. Las filas que solo existen en Supabase se
// agregan con un id local nuevo. Las del seed se retiran cuando el catalogo
// real ya tiene datos: si no, se perderian datos reales del usuario.
interface OpcionesFusion {
    clave: string;
    remotos: FilaSupabase[];
    emparejar?: (local: FilaSupabase, remoto: FilaSupabase) => boolean;
    aplicar: (local: FilaSupabase, remoto: FilaSupabase) => FilaSupabase;
    crear: (remoto: FilaSupabase, idLocal: number) => FilaSupabase;
}

function fusionarLista(opciones: OpcionesFusion): FilaSupabase[] {
    const locales = Storage.obtenerValor<FilaSupabase[]>(opciones.clave, []) ?? [];
    const resultado: FilaSupabase[] = [...locales];
    const emparejados = new Set<number>();

    for (const remoto of opciones.remotos) {
        const idRemotoFila = remoto.id_remoto ?? null;
        let indice = -1;

        if (idRemotoFila != null) {
            indice = resultado.findIndex((local, i) =>
                !emparejados.has(i)
                && local.id_remoto != null
                && String(local.id_remoto) === String(idRemotoFila)
            );
        }

        if (indice === -1 && opciones.emparejar) {
            indice = resultado.findIndex((local, i) =>
                !emparejados.has(i) && opciones.emparejar!(local, remoto)
            );
        }

        if (indice === -1) {
            const idLocal = generarIdUnico(resultado);
            resultado.push(opciones.crear(remoto, idLocal));
            emparejados.add(resultado.length - 1);
            continue;
        }

        emparejados.add(indice);
        const local = resultado[indice];
        resultado[indice] = {
            ...local,
            ...opciones.aplicar(local, remoto),
            id: local.id,
            id_remoto: idRemotoFila ?? local.id_remoto,
        };
    }

    const finales = resultado.filter((local, indice) => {
        if (emparejados.has(indice)) return true;
        if (opciones.remotos.length === 0) return true;
        if (local.id_remoto != null) return true;
        return local.origen !== 'seed';
    });

    Storage.guardarValor(opciones.clave, finales);
    return finales;
}

// Vuelve a apuntar las referencias locales de las canciones a los ids
// locales de los proyectos (los ids de Supabase no son los de la app).
function retraducirCanciones(): void {
    const canciones = Storage.obtenerValor<FilaSupabase[]>('canciones', []) ?? [];
    if (canciones.length === 0) return;
    const traducidas = canciones.map((cancion) =>
        traducirALocal(cancion, [{ campo: 'proyecto_id', tipo: 'proyectos' }])
    );
    Storage.guardarValor('canciones', traducidas);
}

// Lo mismo para las solicitudes y las sesiones, que apuntan a sala, cancion
// y proyecto.
function retraducirReferencias(clave: string): void {
    const filas = Storage.obtenerValor<FilaSupabase[]>(clave, []) ?? [];
    if (filas.length === 0) return;
    const traducidas = filas.map((fila) => traducirALocal(fila, [
        { campo: 'sala_id', tipo: 'salas' },
        { campo: 'cancion_id', tipo: 'canciones' },
        { campo: 'proyecto_id', tipo: 'proyectos' },
        { campo: 'colaborador_id', tipo: 'colaboradores' },
    ]));
    Storage.guardarValor(clave, traducidas);
}

// --- Sincronizaciones --------------------------------------------------------
export async function sincronizarColaboradores() {
    // La vista publica la pueden leer todos (clientes e invitados).
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

    const remotos = [...filas.values()].map(mapearColaborador);
    const uuids = await resolverUuidsDeUsuarios();

    return fusionarLista({
        clave: 'colaboradores',
        remotos,
        // El colaborador del seed se empareja con su cuenta real: el id local
        // se resuelve a su uuid en Supabase.
        emparejar: (local, remoto) => {
            const uuidLocal = uuids.get(String(local.usuario_id ?? ''));
            return uuidLocal != null
                && remoto.usuario_id != null
                && String(remoto.usuario_id) === uuidLocal;
        },
        aplicar: (local, remoto) => {
            const copia = sinIndefinidos(remoto);
            const localEspecialidad = String(local.especialidad ?? '').trim();
            const remotaEspecialidad = String(copia.especialidad ?? '').trim();
            copia.especialidad = remotaEspecialidad
                || localEspecialidad
                || (ESPECIALIDAD_POR_PERFIL[perfilEnApp(remoto.perfil)] ?? '');
            return copia;
        },
        crear: (remoto, idLocal) => ({ ...remoto, id: idLocal, origen: 'usuario' }),
    });
}

export async function sincronizarProyectos() {
    // El proyecto pertenece a un cliente: se trae su usuario para que la app
    // pueda filtrar por propietario.
    const { data, error } = await cliente.from('proyectos').select('*, clientes(usuario_id)');
    if (error) {
        throw new Error(error.message);
    }
    const remotos = (data ?? []).map(mapearProyecto);
    const lista = fusionarLista({
        clave: 'proyectos',
        remotos,
        aplicar: (_local, remoto) => sinIndefinidos(remoto),
        crear: (remoto, idLocal) => ({ ...remoto, id: idLocal, origen: 'usuario' }),
    });
    // Las canciones apuntan al proyecto: hay que volver a traduciolas.
    retraducirCanciones();
    return lista;
}

export async function sincronizarCanciones() {
    const { data, error } = await cliente.from('canciones').select('*');
    if (error) {
        throw new Error(error.message);
    }
    const remotos = (data ?? []).map(mapearCancion);
    const lista = fusionarLista({
        clave: 'canciones',
        remotos,
        aplicar: (_local, remoto) => sinIndefinidos(remoto),
        crear: (remoto, idLocal) => ({ ...remoto, id: idLocal, origen: 'usuario' }),
    });
    const traducidas = lista.map((cancion) =>
        traducirALocal(cancion, [{ campo: 'proyecto_id', tipo: 'proyectos' }])
    );
    Storage.guardarValor('canciones', traducidas);
    return traducidas;
}

export async function sincronizarSalas() {
    const { data, error } = await cliente.from('salas').select('*');
    if (error) {
        throw new Error(error.message);
    }
    const remotos = (data ?? []).map(mapearSala);
    const lista = fusionarLista({
        clave: 'salas',
        remotos,
        aplicar: (_local, remoto) => sinIndefinidos(remoto),
        crear: (remoto, idLocal) => ({ ...remoto, id: idLocal, origen: 'usuario' }),
    });
    retraducirReferencias('solicitudes');
    retraducirReferencias('sesiones');
    return lista;
}

// Trae los clientes de Supabase (la cuenta de estudio de cada usuario) junto
// con su correo. Se guardan aparte de "usuarios" porque un cliente puede tener
// mas de una cuenta y es lo que permite asignar un proyecto a su titular.
export async function sincronizarClientes() {
    const [clientes, usuarios] = await Promise.all([
        cliente.from('clientes').select('id, usuario_id, nombre, email_contacto'),
        cliente.from('usuarios').select('id, email'),
    ]);
    if (clientes.error) {
        throw new Error(clientes.error.message);
    }
    if (usuarios.error) {
        throw new Error(usuarios.error.message);
    }

    const correos = new Map<string, FilaSupabase>();
    for (const fila of (usuarios.data ?? []) as FilaSupabase[]) {
        correos.set(String(fila.id), fila);
    }

    const lista = (clientes.data ?? []).map((fila) => {
        const clienteFila = fila as FilaSupabase;
        const usuario = correos.get(String(clienteFila.usuario_id)) ?? null;
        return {
            id: clienteFila.id ?? null,
            usuario_id: clienteFila.usuario_id ?? null,
            nombre: String(clienteFila.nombre ?? ''),
            email: String(usuario?.email ?? clienteFila.email_contacto ?? ''),
        };
    });

    Storage.guardarValor('clientes', lista);
    return lista;
}

// Trae una tabla de Supabase y la deja en el almacenamiento local
// que la app ya usa (asi los hooks y componentes no cambian).
export async function sincronizarTabla(tabla: string, clave: string) {
    const { data, error } = await cliente.from(tabla).select('*');

    if (error) {
        throw new Error(error.message);
    }

    Storage.guardarValor(clave, data ?? []);
    return data ?? [];
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
    const { data, error } = await cliente
        .from('solicitudes')
        .select('*, solicitud_colaboradores(*), clientes(usuario_id, nombre)')
        .order('id');
    if (error) {
        throw new Error(error.message);
    }
    const mapeadas = (data ?? []).map(mapearSolicitud).map((solicitud) => ({
        ...traducirALocal(solicitud, [
            { campo: 'sala_id', tipo: 'salas' },
            { campo: 'cancion_id', tipo: 'canciones' },
            { campo: 'proyecto_id', tipo: 'proyectos' },
        ]),
        colaboradores: (solicitud.colaboradores as FilaSupabase[]).map((invitacion) => ({
            ...invitacion,
            colaborador_id: idLocalDe('colaboradores', invitacion.colaborador_id as number | string | null)
                ?? invitacion.colaborador_id,
        })),
    }));
    Storage.guardarValor('solicitudes', mapeadas);
    return mapeadas;
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
    const mapeadas = (data ?? []).map(mapearSesion).map((sesion) =>
        traducirALocal(sesion, [
            { campo: 'sala_id', tipo: 'salas' },
            { campo: 'cancion_id', tipo: 'canciones' },
            // El colaborador se guarda con su uuid: se pasa al id local.
            { campo: 'colaborador_id', tipo: 'colaboradores' },
        ])
    );
    Storage.guardarValor('sesiones', mapeadas);
    return mapeadas;
}

// --- Escrituras --------------------------------------------------------------
// La base de datos puede quedarse sin una columna nueva (si la migracion de
// la fase 2 todavia no se ejecuto). PostgREST responde PGRST204 diciendo que
// columna falta: se quita del envio y se reintenta, de modo que el resto de
// los datos si se guardan.
const columnasAusentes = new Map<string, Set<string>>();

function columnaInexistente(error: { code?: string; message?: string } | null): string | null {
    const mensaje = String(error?.message ?? '');
    if (!/Could not find the/.test(mensaje)) {
        return null;
    }
    const coincidencia = /Could not find the '([^']+)' column/.exec(mensaje);
    return coincidencia ? coincidencia[1] : null;
}

function marcarColumnaAusente(tabla: string, columna: string): void {
    const ausentes = columnasAusentes.get(tabla) ?? new Set<string>();
    ausentes.add(columna);
    columnasAusentes.set(tabla, ausentes);
}

async function ejecutarConColumnas(
    tabla: string,
    payload: FilaSupabase,
    ejecutar: (datos: FilaSupabase) => PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>
): Promise<unknown> {
    let datos: FilaSupabase = { ...payload };
    const ausentes = columnasAusentes.get(tabla);
    if (ausentes) {
        for (const columna of ausentes) {
            delete datos[columna];
        }
    }

    for (let intento = 0; intento < 8; intento += 1) {
        const { data, error } = await ejecutar(datos);
        if (!error) {
            return data;
        }
        const columna = columnaInexistente(error);
        if (columna == null || !(columna in datos)) {
            throw new Error(error.message ?? 'No se pudo guardar en Supabase.');
        }
        marcarColumnaAusente(tabla, columna);
        delete datos[columna];
    }

    throw new Error('No se pudo guardar en Supabase.');
}

// Devuelve la id de la fila "clientes" del usuario que tiene la sesión.
export async function obtenerMiClienteId(): Promise<string | null> {
    const { data, error } = await cliente.rpc('mi_cliente_id');
    if (error) {
        throw new Error(error.message);
    }
    return (data ?? null) as string | null;
}

// El id de "usuarios" (uuid) de un usuario de la app. Si la app tiene un id
// local (el del seed) se busca por correo; si ya es un uuid, se usa tal cual.
export async function resolverUsuarioUuid(usuarioId: unknown): Promise<string | null> {
    if (usuarioId == null) return null;
    const clave = String(usuarioId);
    if (ES_UUID.test(clave)) {
        return clave;
    }
    const email = correoDeUsuario(clave);
    if (!email) {
        return null;
    }
    const { data, error } = await cliente.from('usuarios').select('id').eq('email', email).maybeSingle();
    if (error) {
        return null;
    }
    return ((data as FilaSupabase | null)?.id ?? null) as string | null;
}

// El id de la fila "clientes" del usuario indicado.
export async function resolverClienteId(usuarioId: unknown): Promise<string | null> {
    const uuid = await resolverUsuarioUuid(usuarioId);
    if (!uuid) {
        return null;
    }
    const { data, error } = await cliente.from('clientes').select('id').eq('usuario_id', uuid).maybeSingle();
    if (error) {
        return null;
    }
    return ((data as FilaSupabase | null)?.id ?? null) as string | null;
}

function correoDeUsuario(usuarioId: string): string | null {
    const usuario = usuarioRepo.listar().find((item) => String(item.id) === String(usuarioId));
    return usuario?.email ? String(usuario.email) : null;
}

// Resuelve a uuid los usuarios locales de los colaboradores para poder
// emparejarlos con su cuenta real de Supabase.
async function resolverUuidsDeUsuarios(): Promise<Map<string, string>> {
    const resultado = new Map<string, string>();
    const correos = new Map<string, string>();

    for (const colaborador of listarLocales('colaboradores')) {
        const usuarioId = colaborador.usuario_id;
        if (usuarioId == null) continue;
        const clave = String(usuarioId);
        if (ES_UUID.test(clave)) {
            resultado.set(clave, clave);
            continue;
        }
        const email = correoDeUsuario(clave);
        if (email) {
            correos.set(clave, email);
        }
    }

    if (correos.size === 0) {
        return resultado;
    }

    const { data } = await cliente
        .from('usuarios')
        .select('id, email')
        .in('email', [...new Set(correos.values())]);

    for (const fila of (data ?? []) as FilaSupabase[]) {
        const email = String(fila.email ?? '').toLowerCase();
        for (const [clave, correo] of correos) {
            if (correo.toLowerCase() === email) {
                resultado.set(clave, String(fila.id));
            }
        }
    }

    return resultado;
}

// Lee la lista local de una entidad sin depender de los repositorios.
function listarLocales(tipo: TipoEntidad): FilaSupabase[] {
    const valor = Storage.obtenerValor<unknown>(tipo, []);
    return Array.isArray(valor) ? (valor as FilaSupabase[]) : [];
}

// Los campos de cada entidad en el formato de la base de datos. Se usan
// igual en el alta y en la actualizacion para que no se desincronicen.
export function cambiosDeProyecto(proyecto: FilaSupabase): FilaSupabase {
    return {
        nombre: String(proyecto.nombre ?? ''),
        tipo: proyecto.tipo ?? null,
    };
}

export function cambiosDeCancion(cancion: FilaSupabase): FilaSupabase {
    const duracion = Number(cancion.duracion);
    return {
        titulo: String(cancion.nombre ?? cancion.titulo ?? ''),
        duracion_seg: Number.isFinite(duracion) && duracion > 0 ? Math.round(duracion * 60) : null,
        partes: Array.isArray(cancion.partes) ? cancion.partes : [],
        requiere_ensayo: cancion.requiere_ensayo === true,
    };
}

export function cambiosDeColaborador(colaborador: FilaSupabase): FilaSupabase {
    return {
        perfil: perfilEnBd(colaborador.perfil, colaborador.especialidad),
        nombre_artistico: String(colaborador.nombre ?? ''),
        vinculacion: colaborador.activo === false ? 'desvinculado' : 'activo',
        especialidad: String(colaborador.especialidad ?? ''),
    };
}

export function cambiosDeSala(sala: FilaSupabase): FilaSupabase {
    return {
        nombre: String(sala.nombre ?? ''),
        precio_hora: Number(sala.precio_hora ?? 0),
        activo: sala.activo !== false,
    };
}

export async function insertarProyecto(proyecto: FilaSupabase, clienteId: string): Promise<{ id: unknown }> {
    const payload: FilaSupabase = {
        cliente_id: clienteId,
        ...cambiosDeProyecto(proyecto),
        estado: 'activo',
    };
    const data = await ejecutarConColumnas('proyectos', payload, (datos) =>
        cliente.from('proyectos').insert(datos).select('id').single()
    );
    return { id: (data as FilaSupabase | null)?.id ?? null };
}

export async function actualizarProyecto(idRemoto: number | string, cambios: FilaSupabase): Promise<void> {
    await ejecutarConColumnas('proyectos', cambios, (datos) =>
        cliente.from('proyectos').update(datos).eq('id', idRemoto)
    );
}

export async function insertarCancion(cancion: FilaSupabase, proyectoIdRemoto: number | string): Promise<{ id: unknown }> {
    const payload: FilaSupabase = {
        proyecto_id: proyectoIdRemoto,
        ...cambiosDeCancion(cancion),
    };
    const data = await ejecutarConColumnas('canciones', payload, (datos) =>
        cliente.from('canciones').insert(datos).select('id').single()
    );
    return { id: (data as FilaSupabase | null)?.id ?? null };
}

export async function actualizarCancion(idRemoto: number | string, cambios: FilaSupabase): Promise<void> {
    await ejecutarConColumnas('canciones', cambios, (datos) =>
        cliente.from('canciones').update(datos).eq('id', idRemoto)
    );
}

export async function insertarColaborador(colaborador: FilaSupabase): Promise<{ id: unknown }> {
    const usuarioId = await resolverUsuarioUuid(colaborador.usuario_id);
    const payload: FilaSupabase = {
        ...cambiosDeColaborador(colaborador),
        visible_publico: true,
        usuario_id: usuarioId,
        fecha_ingreso: fechaDeHoy(),
    };
    const data = await ejecutarConColumnas('colaboradores', payload, (datos) =>
        cliente.from('colaboradores').insert(datos).select('id').single()
    );
    return { id: (data as FilaSupabase | null)?.id ?? null };
}

export async function actualizarColaborador(idRemoto: number | string, cambios: FilaSupabase): Promise<void> {
    await ejecutarConColumnas('colaboradores', cambios, (datos) =>
        cliente.from('colaboradores').update(datos).eq('id', idRemoto)
    );
}

export async function insertarSala(sala: FilaSupabase): Promise<{ id: unknown }> {
    const data = await ejecutarConColumnas('salas', cambiosDeSala(sala), (datos) =>
        cliente.from('salas').insert(datos).select('id').single()
    );
    return { id: (data as FilaSupabase | null)?.id ?? null };
}

export async function actualizarSala(idRemoto: number | string, cambios: FilaSupabase): Promise<void> {
    await ejecutarConColumnas('salas', cambios, (datos) =>
        cliente.from('salas').update(datos).eq('id', idRemoto)
    );
}

export async function insertarSolicitud(solicitud: FilaSupabase): Promise<{ id: unknown }> {
    const clienteId = await obtenerMiClienteId();
    if (!clienteId) {
        throw new Error('Tu cuenta no tiene un cliente asociado en el estudio.');
    }

    // Las claves foraneas apuntan a filas de Supabase: se traducen los ids
    // locales a los remotos. Si la fila local todavia no existe alli, la
    // referencia se deja nula en vez de apuntar a otra fila.
    const payload: FilaSupabase = {
        cliente_id: clienteId,
        sala_id: idRemotoDe('salas', solicitud.sala_id as number | string | null),
        estado: solicitud.estado ?? 'solicitada',
        descripcion: solicitud.descripcion ?? '',
        fecha_deseada: solicitud.fecha ?? null,
        titulo: solicitud.titulo ?? '',
        tipo: solicitud.tipo ?? 'grabacion',
        franja: solicitud.franja ?? '',
        partes: solicitud.partes ?? [],
        cancion_id: idRemotoDe('canciones', solicitud.cancion_id as number | string | null),
        proyecto_id: idRemotoDe('proyectos', solicitud.proyecto_id as number | string | null),
    };

    const data = await ejecutarConColumnas('solicitudes', payload, (datos) =>
        cliente.from('solicitudes').insert(datos).select('id').single()
    );
    const idSolicitud = (data as FilaSupabase | null)?.id ?? null;

    const colaboradores = Array.isArray(solicitud.colaboradores) ? solicitud.colaboradores : [];
    const invitaciones = colaboradores
        .map((invitacion) => {
            const item = invitacion as FilaSupabase;
            return {
                solicitud_id: idSolicitud,
                colaborador_id: idRemotoDe('colaboradores', item.colaborador_id as number | string | null),
                rol: item.rol ?? null,
                estado: item.estado ?? 'pendiente',
            };
        })
        .filter((invitacion) => invitacion.colaborador_id != null);

    if (invitaciones.length > 0) {
        const { error } = await cliente.from('solicitud_colaboradores').insert(invitaciones);
        if (error) {
            throw new Error(error.message);
        }
    }

    return { id: idSolicitud };
}

export async function actualizarEstadoSolicitud(id: unknown, estado: unknown): Promise<void> {
    const { error } = await cliente.from('solicitudes').update({ estado }).eq('id', id);
    if (error) {
        throw new Error(error.message);
    }
}

export async function actualizarInvitacionSolicitud(solicitudId: unknown, colaboradorId: unknown, estado: unknown): Promise<void> {
    const { error } = await cliente
        .from('solicitud_colaboradores')
        .update({ estado })
        .eq('solicitud_id', solicitudId)
        .eq('colaborador_id', colaboradorId);
    if (error) {
        throw new Error(error.message);
    }
}

export async function insertarSesion(sesion: FilaSupabase): Promise<{ id: unknown }> {
    // El cliente de la sesión: si viene del flujo de una solicitud, lo sacamos
    // de la solicitud; si no, del que tiene la sesión iniciada.
    let clienteId = sesion.cliente_id ?? null;

    if (!clienteId && sesion.solicitud_id != null) {
        const { data: solicitud, error: errorSolicitud } = await cliente
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

    const payload: FilaSupabase = {
        solicitud_id: idRemotoDe('solicitudes', sesion.solicitud_id as number | string | null),
        cliente_id: clienteId,
        sala_id: idRemotoDe('salas', sesion.sala_id as number | string | null),
        colaborador_id: idRemotoDe('colaboradores', sesion.colaborador_id as number | string | null),
        cancion_id: idRemotoDe('canciones', sesion.cancion_id as number | string | null),
        estado: sesion.estado ?? 'confirmada',
        titulo: sesion.titulo ?? '',
        fecha: sesion.fecha ?? null,
        hora_inicio: sesion.hora_inicio ?? null,
        hora_fin: sesion.hora_fin ?? null,
        partes: sesion.partes ?? [],
    };

    const data = await ejecutarConColumnas('sesiones', payload, (datos) =>
        cliente.from('sesiones').insert(datos).select('id').single()
    );

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

// Recarga los datos que dependen del usuario logueado. El orden importa: las
// canciones, solicitudes y sesiones apuntan a proyectos y salas, asi que se
// sincronizan despues.
export async function refrescarDatosUsuario() {
    await Promise.allSettled([
        sincronizarColaboradores(),
        sincronizarSalas(),
    ]);
    await Promise.allSettled([
        sincronizarProyectos(),
    ]);
    await Promise.allSettled([
        sincronizarCanciones(),
    ]);
    await Promise.allSettled([
        sincronizarSolicitudes(),
        sincronizarSesiones(),
    ]);
}

// Reexportado para que los repositorios no tengan que importar dos modulos.
export { registrarIdRemoto };
