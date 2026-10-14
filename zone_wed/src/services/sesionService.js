// CAPA: Aplicación
import { crearSesion, Sesion } from '../models/Sesion.js';
import { sesionRepo } from '../repositories/sesionRepo.js';
import { colaboradorRepo } from '../repositories/colaboradorRepo.js';
import { salaRepo } from '../repositories/salaRepo.js';

export const SesionService = {
    listar() {
        return sesionRepo.listar();
    },

    obtenerPorId(id) {
        return sesionRepo.obtenerPorId(id);
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
        const sesion = crearSesion({
            ...data,
            estado: data.estado ?? 'solicitada',
            colaborador_id: colaborador.id,
            sala_id: sala.id,
        });
        return sesionRepo.crear(sesion);
    },

    actualizarEstado(id, nuevoEstado) {
        const sesion = sesionRepo.obtenerPorId(id);
        if (!sesion) {
            return null;
        }
        if (!Sesion.puedeTransicionar(sesion, nuevoEstado)) {
            throw new Error('La sesión ya no admite ese cambio de estado.');
        }
        return sesionRepo.actualizar(id, { estado: nuevoEstado });
    },

    cancelar(id) {
        return sesionRepo.cancelar(id);
    },
};

export default SesionService;
