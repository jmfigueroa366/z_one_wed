// CAPA: Dominio
import type { Colaborador } from './Colaborador.ts';

export interface Productor extends Colaborador {}

export type EntradaProductor = Partial<Productor>;

export function crearProductor(data: EntradaProductor = {}): Productor {
    return {
        id: data.id ?? null,
        nombre: data.nombre ?? '',
        especialidad: data.especialidad ?? '',
        usuario_id: data.usuario_id ?? null,
        activo: data.activo ?? true,
        ...data,
    };
}

export const Productor = {
    crear: crearProductor,
    esActivo(productor: Productor | null | undefined): boolean {
        return productor != null && productor.activo !== false;
    },
};

export default crearProductor;
