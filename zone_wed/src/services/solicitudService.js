// CAPA: Aplicación
import { crearSolicitud, Solicitud } from '../models/Solicitud.js';
import { solicitudRepo } from '../repositories/solicitudRepo.js';
import { colaboradorRepo } from '../repositories/colaboradorRepo.js';
import { salaRepo } from '../repositories/salaRepo.js';

function franjaNoDisponible(franjaA, franjaB) {
    if (!franjaA || !franjaB) return false;
    const [inicioA, finA] = franjaA.split('-').map((hora) => hora.trim());
    const [inicioB, finB] = franjaB.split('-').map((hora) => hora.trim());

    if (!inicioA || !finA || !inicioB || !finB) return false;
    return inicioA < finB && inicioB < finA;
}

export const SolicitudService = {
    listar() {
        return solicitudRepo.listar();
    },

    obtenerPorId(id) {
        return solicitudRepo.obtenerPorId(id);
    },

    crear(data) {
        const colaborador = colaboradorRepo.obtenerPorId(data.colaborador_id);
        if (!colaborador) {
            throw new Error('El colaborador no existe.');
        }
        const sala = salaRepo.obtenerPorId(data.sala_id);
        if (!sala) {
            throw new Error('La sala no existe.');
        }

        const conflictos = solicitudRepo.listar().filter((solicitud) => 
            solicitud.sala_id === sala.id &&
            Solicitud.estaAbierta(solicitud) && 
            solicitud.fecha === data.fecha &&
            franjaNoDisponible(solicitud.franja, data.franja)
        );

        if (conflictos.length > 0) {
            throw new Error('La sala ya está reservada en ese rango de hora');
        }

        const solicitud = crearSolicitud({
            ...data,
            estado: data.estado ?? 'solicitud',
            colaborador_id: colaborador.id,
            sala_id: sala.id,
        });
        return solicitudRepo.crear(solicitud);
    },

    actualizarEstado(id, nuevoEstado) {
        const solicitud = solicitudRepo.obtenerPorId(id);
        if (!solicitud) {
            return null;
        }

        if (!Solicitud.puedeTransicionar(solicitud, nuevoEstado)) {
            throw new Error('La solicitud ya no admite ese cambio de estado.');
        }
        return solicitudRepo.actualizar(id, { estado: nuevoEstado });
    },

    rechazar(id) {
        return solicitudRepo.rechazar(id);
    },
};

export default SolicitudService;
