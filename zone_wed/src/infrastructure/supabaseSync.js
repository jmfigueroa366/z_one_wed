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
    const { data, error } = await supabase.from('colaboradores').select('*');
    if (error) {
        throw new Error(error.message);
    }
    const mapeados = (data ?? []).map(mapearColaborador);
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

// Recarga los datos que dependen del usuario logueado.
// Se llama después de iniciar sesión para que cada usuario vea lo suyo.
export async function refrescarDatosUsuario() {
    await Promise.allSettled([
        sincronizarProyectos(),
        sincronizarCanciones(),
        sincronizarSolicitudes(),
    ]);
}