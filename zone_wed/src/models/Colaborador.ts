// CAPA: Dominio

export interface Colaborador {
    id: number | string | null;
    // Id que la fila tiene en Supabase (null si el colaborador solo existe en local).
    id_remoto: number | string | null;
    nombre: string;
    especialidad: string;
    usuario_id: number | string | null;
    activo: boolean;
    perfil?: string;
    imagen?: string;
    [key: string]: unknown;
}

export type EntradaColaborador = Partial<Colaborador>;

export function crearColaborador(data: EntradaColaborador = {}): Colaborador {
    return {
        ...data,
        id: data.id ?? null,
        id_remoto: data.id_remoto ?? null,
        nombre: data.nombre ?? '',
        especialidad: data.especialidad ?? '',
        usuario_id: data.usuario_id ?? null,
        activo: data.activo ?? true,
    };
}

export const Colaborador = {
    crear: crearColaborador,
    esActivo(colaborador: Colaborador | null | undefined): boolean {
        return colaborador != null && colaborador.activo !== false;
    },
};

export default crearColaborador;
