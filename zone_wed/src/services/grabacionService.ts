// CAPA: Aplicación
import { grabacionRepo } from '../repositories/grabacionRepo.ts';
import type { Grabacion } from '../repositories/grabacionRepo.ts';

export const GrabacionService = {
    listar(): Grabacion[] {
        return grabacionRepo.listar();
    },

    listarPorCancion(cancionId: number | string): Grabacion[] {
        return grabacionRepo.listarPorCancion(cancionId);
    },

    obtener(cancionId: number | string, parte = ''): Grabacion | null {
        return grabacionRepo.obtener(cancionId, parte);
    },

    guardar(data: { cancion_id: number | string; parte?: string; dataUrl: string; duracion?: number | null }): Grabacion {
        return grabacionRepo.guardar(data);
    },

    eliminar(cancionId: number | string, parte = ''): Grabacion[] {
        return grabacionRepo.eliminar(cancionId, parte);
    },

    eliminarPorCancion(cancionId: number | string): Grabacion[] {
        return grabacionRepo.eliminarPorCancion(cancionId);
    },
};

export default GrabacionService;
