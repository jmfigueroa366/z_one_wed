// CAPA: Dominio

export interface Cancion {
    id: number | string | null;
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
        id: data.id ?? null,
        proyecto_id: data.proyecto_id ?? null,
        nombre: data.nombre ?? '',
        duracion: data.duracion ?? null,
        partes: data.partes ?? [],
        requiere_ensayo: data.requiere_ensayo ?? false,
        ...data,
    };
}

export const Cancion = {
    crear: crearCancion,
};

export default crearCancion;
