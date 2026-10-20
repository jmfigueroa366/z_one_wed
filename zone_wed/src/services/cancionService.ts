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

    obtenerPorId(id: number | string): Cancion | null {
        return cancionRepo.obtenerPorId(id);
    },

    crear(data: EntradaCancion): Cancion {
        return cancionRepo.crear(crearCancion(data));
    },

    actualizar(id: number | string, data: EntradaCancion): Cancion | null {
        return cancionRepo.actualizar(id, data);
    },

    eliminar(id: number | string): Cancion[] {
        return cancionRepo.eliminar(id);
    },
};

export default CancionService;