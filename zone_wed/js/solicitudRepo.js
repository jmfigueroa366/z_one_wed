import { Storage } from './storage.js';

const COLECCION = 'solicitudes';

function normalizar(solicitud) {
    if (Array.isArray(solicitud.invitaciones)) return solicitud;

    const [hora_inicio = '09:00', hora_fin = '10:00'] = String(solicitud.franja || '').split('-');
    const invitaciones = solicitud.colaborador_id
        ? [{
            id: `${solicitud.id}-i1`,
            colaborador_id: Number(solicitud.colaborador_id),
            estado: solicitud.estado === 'confirmada' ? 'aceptada' : 'pendiente',
            tarifa_ofrecida: 0,
            mensaje: 'Solicitud de producción existente.',
            vence_en: null,
        }]
        : [];

    return {
        ...solicitud,
        titulo: solicitud.titulo || 'Solicitud de producción',
        creado_por_usuario_id: solicitud.creado_por_usuario_id ?? solicitud.cliente_id ?? 3,
        creado_por_rol: solicitud.creado_por_rol || 'cliente',
        hora_inicio: solicitud.hora_inicio || hora_inicio,
        hora_fin: solicitud.hora_fin || hora_fin,
        invitaciones,
    };
}

export const SolicitudRepo = {
    todas() {
        return Storage.obtenerTodos(COLECCION).map(normalizar);
    },

    porId(id) {
        const solicitud = Storage.obtenerPorId(COLECCION, Number(id));
        return solicitud ? normalizar(solicitud) : null;
    },

    crear(datos) {
        return Storage.crear(COLECCION, datos);
    },

    actualizar(id, cambios) {
        const solicitud = this.porId(id);
        if (!solicitud) return null;
        return Storage.actualizar(COLECCION, solicitud.id, cambios);
    },
};