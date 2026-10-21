// CAPA: Dominio

export interface Cancion {
    id: number | string | null;
    // Id que la fila tiene en Supabase (null si la cancion solo existe en local).
    id_remoto: number | string | null;
    proyecto_id: number | string | null;
    nombre: string;
    duracion: number | null;
    partes: string[];
    requiere_ensayo: boolean;
    [key: string]: unknown;
}

export type EntradaCancion = Partial<Cancion>;

export function crearCancion(data: EntradaCancion = {}): Cancion {
    return {
        ...data,
        id: data.id ?? null,
        id_remoto: data.id_remoto ?? null,
        proyecto_id: data.proyecto_id ?? null,
        nombre: data.nombre ?? '',
        duracion: data.duracion ?? null,
        partes: data.partes ?? [],
        requiere_ensayo: data.requiere_ensayo ?? false,
    };
}

export const Cancion = {
    crear: crearCancion,
};

export default crearCancion;
