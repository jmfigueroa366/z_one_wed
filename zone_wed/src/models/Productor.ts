// CAPA: Dominio
import type { Colaborador } from './Colaborador.ts';

export interface Productor extends Colaborador {}

export type EntradaProductor = Partial<Productor>;

export function crearProductor(data: EntradaProductor = {}): Productor {
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

export const Productor = {
    crear: crearProductor,
    esActivo(productor: Productor | null | undefined): boolean {
        return productor != null && productor.activo !== false;
    },
};

export default crearProductor;
