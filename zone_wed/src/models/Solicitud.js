// CAPA: Dominio
import { ESTADOS } from "../config/estados.js";

const ESTADOS_SOLICITUD = ESTADOS.solicitud;
const ESTADOS_INVITACION = ESTADOS.invitacion;

export function crearInvitacion(data = {}) {
    const estado = data.estado ?? 'pendiente';
    if (!ESTADOS_INVITACION.estados.includes(estado)) {
        throw new Error(`Estado inválido para invitación: "${estado}".`);
    }
    return {
        colaborador_id: data.colaborador_id ?? null,
        rol: data.rol ?? null,
        estado,
    };
}

export function crearSolicitud(data = {}) {
    const estado = data.estado ?? 'solicitada';
    if (!ESTADOS_SOLICITUD.estados.includes(estado)) {
        throw new Error(`Estado inválido para solicitud: "${estado}".`);
    }
    return {
        ...data,
        id: data.id ?? null,
        usuario_id: data.usuario_id ?? null,
        solicitante_nombre: data.solicitante_nombre ?? null,
        titulo: data.titulo ?? '',
        descripcion: data.descripcion ?? '',
        tipo: data.tipo ?? 'grabacion',
        sala_id: data.sala_id ?? null,
        cancion_id: data.cancion_id ?? null,
        proyecto_id: data.proyecto_id ?? null,
        partes: data.partes ?? [],
        fecha: data.fecha ?? null,
        franja: data.franja ?? '',
        fecha_solicitud: data.fecha_solicitud ?? null,
        colaboradores: (Array.isArray(data.colaboradores) ? data.colaboradores : []).map(crearInvitacion),
        estado,
    };
}

export const TIPOS_SOLICITUD = Object.freeze({
    GRABACION: 'grabacion',
    MEZCLA: 'mezcla',
    MASTERIZACION: 'masterizacion',
    ENSAYO: 'ensayo',
    PRODUCCION: 'produccion',
});

export const Solicitud = {
    crear: crearSolicitud,
    colaboradoresDe(solicitud) {
        return Array.isArray(solicitud?.colaboradores) ? solicitud.colaboradores : [];
    },
    invitacionDe(solicitud, colaboradorId) {
        return this.colaboradoresDe(solicitud)
            .find((invitacion) => String(invitacion.colaborador_id) === String(colaboradorId)) ?? null;
    },
    todosRespondieron(solicitud) {
        const invitaciones = this.colaboradoresDe(solicitud);
        return invitaciones.length > 0 && invitaciones.every((invitacion) => invitacion.estado !== 'pendiente');
    },
    todosAceptaron(solicitud) {
        const invitaciones = this.colaboradoresDe(solicitud);
        return invitaciones.length > 0 && invitaciones.every((invitacion) => invitacion.estado === 'aceptada');
    },
    estaPendiente(solicitud) {
        return Boolean(solicitud) && solicitud.estado === 'solicitada';
    },
    puedeTransicionar(solicitud, nuevoEstado) {
        return Boolean(solicitud) &&
            ESTADOS_SOLICITUD.transiciones[solicitud.estado]?.includes(nuevoEstado) === true;
    },
};

export default crearSolicitud;