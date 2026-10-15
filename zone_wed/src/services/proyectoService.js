// CAPA: Aplicación
import { proyectoRepo } from '../repositories/proyectoRepo.js';
import { cancionRepo } from '../repositories/cancionRepo.js';
import { usuarioRepo } from '../repositories/usuarioRepo.js';
import { crearProyecto } from '../models/Proyecto.js';

export const ProyectoService = {
    listar() {
        return proyectoRepo.listar();
    },

    listarPorUsuario(usuarioId) {
        if (usuarioId == null) return proyectoRepo.listar();
        return proyectoRepo.listarPorUsuario(usuarioId);
    },

    obtenerPorId(id) {
        return proyectoRepo.obtenerPorId(id);
    },

    propietarioDe(proyecto) {
        if (!proyecto?.usuario_id) return null;
        return usuarioRepo.obtenerPorId(proyecto.usuario_id);
    },

    crear(data) {
        const usuarioId = data?.usuario_id ?? null;
        if (usuarioId == null) {
            throw new Error('Asigna el proyecto a un cliente.');
        }
        return proyectoRepo.crear(crearProyecto({ ...data, usuario_id: usuarioId }));
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