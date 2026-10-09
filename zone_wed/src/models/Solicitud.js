// CAPA: Dominio

export function crearSolicitud(data = {}) {
    return {
        id: data.id ?? null,
        colaborador_id: data.colaborador_id ?? null,
        usuario_id: data.usuario_id ?? null,
        solicitante_nombre: data.solicitante_nombre ?? null,
        sala_id: data.sala_id ?? null,
        tipo: data.tipo ?? 'grabacion',
        fecha: data.fecha ?? null,
        franja: data.franja ?? '',
        estado: data.estado ?? 'solicitud',
        ...data,
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
    estaAbierta(solicitud) {
        return Boolean(solicitud) && ['solicitud', 'en_negociacion'].includes(solicitud.estado);
    },
};

export default crearSolicitud;
