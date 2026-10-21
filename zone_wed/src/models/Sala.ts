// CAPA: Dominio

export interface Sala {
    id: number | string | null;
    nombre: string;
    precio_hora: number;
    activo: boolean;
    [key: string]: unknown;
}

export type EntradaSala = Partial<Sala>;

export function crearSala(data: EntradaSala = {}): Sala {
    return {
        id: data.id ?? null,
        nombre: data.nombre ?? '',
        precio_hora: data.precio_hora ?? 0,
        activo: data.activo ?? true,
        ...data,
    };
}

export const Sala = {
    crear: crearSala,
    esActivo(sala: Sala | null | undefined): boolean {
        return sala != null && sala.activo !== false;
    },
};

export default crearSala;
