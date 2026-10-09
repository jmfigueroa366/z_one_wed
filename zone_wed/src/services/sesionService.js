// CAPA: Aplicación
import { crearSesion } from '../models/Sesion.js';
import { sesionRepo } from '../repositories/sesionRepo.js';

export const SesionService = {
    listar() {
        return sesionRepo.listar();
    },

    obtenerPorId(id) {
        return sesionRepo.obtenerPorId(id);
    },

    crear(data) {
        return sesionRepo.crear(crearSesion(data));
    },

    actualizarEstado(id, estado) {
        return sesionRepo.actualizar(id, { estado });
    },
};

export default SesionService;
