// CAPA: Aplicación
import { proyectoRepo } from '../repositories/proyectoRepo.js';
import { cancionRepo } from '../repositories/cancionRepo.js';
import { crearProyecto } from '../models/Proyecto.js';

export const ProyectoService = {
    listar() {
        return proyectoRepo.listar();
    },

    listarPorUsuario(usuarioId) {
        return proyectoRepo.listarPorUsuario(usuarioId);
    },

    obtenerPorId(id) {
        return proyectoRepo.obtenerPorId(id);
    },

    crear(data) {
        return proyectoRepo.crear(crearProyecto(data));
    },

    actualizar(id, data) {
        return proyectoRepo.actualizar(id, data);
    },

    eliminar(id) {
        cancionRepo.eliminarPorProyecto(id);
        return proyectoRepo.eliminar(id);
    },
};

export default ProyectoService;