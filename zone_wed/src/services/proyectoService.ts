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

    async crear(data: EntradaProyecto = {}): Promise<Proyecto> {
        const usuarioId = data?.usuario_id ?? null;
        if (usuarioId == null) {
            throw new Error('Asigna el proyecto a un cliente.');
        }
        return await proyectoRepo.crear(crearProyecto({ ...data, usuario_id: usuarioId }));
    },

    async actualizar(id: number | string, data: EntradaProyecto): Promise<Proyecto | null> {
        return await proyectoRepo.actualizar(id, data);
    },

    async eliminar(id: number | string): Promise<Proyecto[]> {
        cancionRepo.eliminarPorProyecto(id);
        return await proyectoRepo.eliminar(id);
    },
};

export default ProyectoService;