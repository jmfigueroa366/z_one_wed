// CAPA: Dominio
import { ESTADOS } from "../config/estados.js";

const ESTADOS_ORDEN = ESTADOS.orden;

export function crearOrden(data = {}) {
    const estado = data.estado ?? 'borrador';
    if (!ESTADOS_ORDEN.estados.includes(estado)) {
        throw new Error(`Estado inválido para orden: "${estado}".`);
    }
    return {
        id: data.id ?? null,
        sesion_id: data.sesion_id ?? null,
        descripcion: data.descripcion ?? '',
        total: data.total ?? 0,
        estado,
        fecha_emision: data.fecha_emision ?? null,
        ...data,
    };
}

export const Orden = {
    crear: crearOrden,
    estaPagada(orden) {
        return Boolean(orden) && orden.estado === 'pagada';
    },
    puedeTransicionar(orden, nuevoEstado) {
        return Boolean(orden) &&
            ESTADOS_ORDEN.transiciones[orden.estado]?.includes(nuevoEstado) === true;
    },
};

export default crearOrden;
