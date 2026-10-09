// CAPA: Aplicación
import { grabacionRepo } from '../repositories/grabacionRepo.js';

export const GrabacionService = {
    listar() {
        return grabacionRepo.listar();
    },

    listarPorCancion(cancionId) {
        return grabacionRepo.listarPorCancion(cancionId);
    },

    obtener(cancionId, parte = '') {
        return grabacionRepo.obtener(cancionId, parte);
    },

    guardar(data) {
        return grabacionRepo.guardar(data);
    },

    eliminar(cancionId, parte = '') {
        return grabacionRepo.eliminar(cancionId, parte);
    },

    eliminarPorCancion(cancionId) {
        return grabacionRepo.eliminarPorCancion(cancionId);
    },
};

export default GrabacionService;