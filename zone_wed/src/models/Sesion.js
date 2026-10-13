// CAPA: Dominio
import { ESTADOS } from "../config/estados.js";

const ESTADOS_SESION = ESTADOS.sesion;
export function crearSesion(data = {}) {
    const estado = data.estado ?? 'solicitada';
    if (!ESTADOS_SESION.estados.includes(estado)) {
        throw new Error(`Estado inválido para sesión: "${estado}".`);
    }
    return {
        id: data.id ?? null,
        solicitud_id: data.solicitud_id ?? null,
        titulo: data.titulo ?? '',
        sala_id: data.sala_id ?? null,
        colaborador_id: data.colaborador_id ?? null,
        fecha: data.fecha ?? null,
        hora_inicio: data.hora_inicio ?? null,
        hora_fin: data.hora_fin ?? null,
        estado,
        ...data,
    };
}

export const Sesion = {
    crear: crearSesion,
    estaActiva(sesion) {
        return Boolean(sesion) && ['solicitada', 'confirmada'].includes(sesion.estado);
    },
    puedeTransicionar(sesion, nuevoEstado) {
        return Boolean(sesion) &&
            ESTADOS_SESION.transiciones[sesion.estado]?.includes(nuevoEstado) === true;
    },
};

export default crearSesion;
