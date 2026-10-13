// CAPA: Dominio
import { ESTADOS } from "../config/estados.js";

const ESTADOS_SOLICITUD = ESTADOS.solicitud;

export function crearSolicitud(data = {}) {
    const estado = data.estado ?? 'solicitud';
    if (!ESTADOS_SOLICITUD.estados.includes(estado)) {
        throw new Error(`Estado inválido para solicitud: "${estado}".`);
    }
    return {
        id: data.id ?? null,
        colaborador_id: data.colaborador_id ?? null,
        sala_id: data.sala_id ?? null,
        fecha: data.fecha ?? null,
        franja: data.franja ?? '',
        estado,
        ...data,
    };
}

export const Solicitud = {
    crear: crearSolicitud,
    estaAbierta(solicitud) {
        return Boolean(solicitud) && ['solicitud', 'en_negociacion'].includes(solicitud.estado);
    },
    puedeTransicionar(solicitud, nuevoEstado) {
        return Boolean(solicitud) && 
            ESTADOS_SOLICITUD.transiciones[solicitud.estado]?.includes(nuevoEstado) === true;    
    },
};

export default crearSolicitud;
