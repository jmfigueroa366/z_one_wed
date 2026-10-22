// CAPA: Dominio

export interface Sala {
    id: number | string | null;
    // Id que la fila tiene en Supabase (null si la sala solo existe en local).
    id_remoto: number | string | null;
    nombre: string;
    precio_hora: number;
    activo: boolean;
    // 'seed' para los datos de ejemplo, 'usuario' para los reales.
    origen?: 'seed' | 'usuario';
    [key: string]: unknown;
}

export type EntradaSala = Partial<Sala>;

export function crearSala(data: EntradaSala = {}): Sala {
    return {
        ...data,
        id: data.id ?? null,
        id_remoto: data.id_remoto ?? null,
        nombre: data.nombre ?? '',
        precio_hora: data.precio_hora ?? 0,
        activo: data.activo ?? true,
        origen: data.origen ?? 'usuario',
    };
}

export const Sala = {
    crear: crearSala,
    esActivo(sala: Sala | null | undefined): boolean {
        return sala != null && sala.activo !== false;
    },
};

export default crearSala;
