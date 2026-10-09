// CAPA: Aplicación
import { crearSolicitud } from '../models/Solicitud.js';
import { solicitudRepo } from '../repositories/solicitudRepo.js';

export const SolicitudService = {
    listar() {
        return solicitudRepo.listar();
    },

    obtenerPorId(id) {
        return solicitudRepo.obtenerPorId(id);
    },

    crear(data) {
        return solicitudRepo.crear(crearSolicitud(data));
    },

    actualizarEstado(id, estado) {
        const estadosPermitidos = {
            solicitud: ['en_negociacion', 'confirmada', 'rechazada'],
            en_negociacion: ['confirmada', 'rechazada'],
        };
        const solicitud = solicitudRepo.obtenerPorId(id);

        if (!solicitud) {
            return null;
        }

        if (!estadosPermitidos[solicitud.estado]?.includes(estado)) {
            throw new Error('La solicitud ya no admite ese cambio de estado.');
        }

        return solicitudRepo.actualizar(id, { estado });
    },
};

export default SolicitudService;
