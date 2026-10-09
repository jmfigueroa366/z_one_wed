// CAPA: Aplicación
import { cancionRepo } from '../repositories/cancionRepo.js';
import { crearCancion } from '../models/Cancion.js';

export const CancionService = {
    listar() {
        return cancionRepo.listar();
    },

    listarPorProyecto(proyectoId) {
        return cancionRepo.listarPorProyecto(proyectoId);
    },

    obtenerPorId(id) {
        return cancionRepo.obtenerPorId(id);
    },

    crear(data) {
        return cancionRepo.crear(crearCancion(data));
    },

    actualizar(id, data) {
        return cancionRepo.actualizar(id, data);
    },

    eliminar(id) {
        return cancionRepo.eliminar(id);
    },
};

export default CancionService;