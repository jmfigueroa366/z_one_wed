// CAPA: Dominio

export interface Colaborador {
    id: number | null;
    nombre: string;
    especialidad: string;
    usuario_id: number | null;
    activo: boolean;
    perfil?: string;
    imagen?: string;
    [key: string]: unknown;
}

export type EntradaColaborador = Partial<Colaborador>;

export function crearColaborador(data: EntradaColaborador = {}): Colaborador {
    return {
        id: data.id ?? null,
        nombre: data.nombre ?? '',
        especialidad: data.especialidad ?? '',
        usuario_id: data.usuario_id ?? null,
        activo: data.activo ?? true,
        ...data,
    };
}

export const Colaborador = {
    crear: crearColaborador,
    esActivo(colaborador: Colaborador | null | undefined): boolean {
        return colaborador != null && colaborador.activo !== false;
    },
};

export default crearColaborador;
