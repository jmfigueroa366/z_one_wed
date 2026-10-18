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
