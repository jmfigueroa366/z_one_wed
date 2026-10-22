// CAPA: Aplicación
import { cancionRepo } from '../repositories/cancionRepo.ts';
import { crearCancion } from '../models/Cancion.ts';
import type { Cancion, EntradaCancion } from '../models/Cancion.ts';

export const CancionService = {
    listar(): Cancion[] {
        return cancionRepo.listar();
    },

    listarPorProyecto(proyectoId: number | string | null | undefined): Cancion[] {
        return cancionRepo.listarPorProyecto(proyectoId);
    },

    listarPorUsuario(usuarioId: number | string | null | undefined): Cancion[] {
        return cancionRepo.listarPorUsuario(usuarioId);
    },

    obtenerPorId(id: number | string): Cancion | null {
        return cancionRepo.obtenerPorId(id);
    },

    async crear(data: EntradaCancion): Promise<Cancion> {
        return await cancionRepo.crear(crearCancion(data));
    },

    async actualizar(id: number | string, data: EntradaCancion): Promise<Cancion | null> {
        return await cancionRepo.actualizar(id, data);
    },

    async eliminar(id: number | string): Promise<Cancion[]> {
        return await cancionRepo.eliminar(id);
    },
};

export default CancionService;