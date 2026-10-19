// CAPA: Aplicación
import { proyectoRepo } from '../repositories/proyectoRepo.ts';
import { cancionRepo } from '../repositories/cancionRepo.ts';
import { usuarioRepo } from '../repositories/usuarioRepo.ts';
import { crearProyecto } from '../models/Proyecto.ts';
import type { EntradaProyecto, Proyecto } from '../models/Proyecto.ts';
import type { Usuario } from '../models/Usuario.ts';

export const ProyectoService = {
    listar(): Proyecto[] {
        return proyectoRepo.listar();
    },

    listarPorUsuario(usuarioId: number | string | null | undefined): Proyecto[] {
        if (usuarioId == null) return proyectoRepo.listar();
        return proyectoRepo.listarPorUsuario(usuarioId);
    },

    obtenerPorId(id: number | string): Proyecto | null {
        return proyectoRepo.obtenerPorId(id);
    },

    propietarioDe(proyecto: Proyecto | null | undefined): Usuario | null {
        if (!proyecto?.usuario_id) return null;
        return usuarioRepo.obtenerPorId(proyecto.usuario_id);
    },

    crear(data: EntradaProyecto = {}): Proyecto {
        const usuarioId = data?.usuario_id ?? null;
        if (usuarioId == null) {
            throw new Error('Asigna el proyecto a un cliente.');
        }
        return proyectoRepo.crear(crearProyecto({ ...data, usuario_id: usuarioId }));
    },

    actualizar(id: number | string, data: EntradaProyecto): Proyecto | null {
        return proyectoRepo.actualizar(id, data);
    },

    eliminar(id: number | string): Proyecto[] {
        cancionRepo.eliminarPorProyecto(id);
        return proyectoRepo.eliminar(id);
    },
};

export default ProyectoService;