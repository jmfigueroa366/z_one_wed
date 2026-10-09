// CAPA: Aplicación
import { sesionRepo } from '../repositories/sesionRepo.js';
import { solicitudRepo } from '../repositories/solicitudRepo.js';

export const EstadisticasService = {
    obtenerResumen() {
        const sesiones = sesionRepo.listar();
        const solicitudes = solicitudRepo.listar();

        return {
            totalSesiones: sesiones.length,
            totalSolicitudes: solicitudes.length,
            sesionesCompletadas: sesiones.filter((sesion) => sesion.estado === 'completada').length,
            solicitudesAbiertas: solicitudes.filter((solicitud) => ['solicitud', 'en_negociacion'].includes(solicitud.estado)).length,
        };
    },
};

export default EstadisticasService;
