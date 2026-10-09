// CAPA: Dominio

export function crearSolicitud(data = {}) {
    return {
        id: data.id ?? null,
        colaborador_id: data.colaborador_id ?? null,
        sala_id: data.sala_id ?? null,
        fecha: data.fecha ?? null,
        franja: data.franja ?? '',
        estado: data.estado ?? 'solicitud',
        ...data,
    };
}

export const Solicitud = {
    crear: crearSolicitud,
    estaAbierta(solicitud) {
        return Boolean(solicitud) && ['solicitud', 'en_negociacion'].includes(solicitud.estado);
    },
};

export default crearSolicitud;
