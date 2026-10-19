// CAPA: Aplicación
import { crearSesion, Sesion } from '../models/Sesion.ts';
import type { EntradaSesion, Sesion as SesionEntidad } from '../models/Sesion.ts';
import { sesionRepo } from '../repositories/sesionRepo.ts';
import { colaboradorRepo } from '../repositories/colaboradorRepo.ts';
import { salaRepo } from '../repositories/salaRepo.ts';

export const SesionService = {
    listar(): SesionEntidad[] {
        return sesionRepo.listar();
    },

    obtenerPorId(id: number | string | null | undefined): SesionEntidad | null {
        return sesionRepo.obtenerPorId(id);
    },

    crear(data: EntradaSesion): SesionEntidad {
        const colaborador = colaboradorRepo.obtenerPorId(data.colaborador_id);
        if (!colaborador) {
            throw new Error('El colaborador no existe.');
        }
        const sala = salaRepo.obtenerPorId(data.sala_id);
        if (!sala) {
            throw new Error('La sala no existe.');
        }
        const sesion = crearSesion({
            ...data,
            estado: data.estado ?? 'solicitada',
            colaborador_id: colaborador.id,
            sala_id: sala.id,
        });
        return sesionRepo.crear(sesion);
    },

    actualizarEstado(id: number | string | null | undefined, nuevoEstado: string): SesionEntidad | null {
        const sesion = sesionRepo.obtenerPorId(id);
        if (!sesion) {
            return null;
        }
        if (!Sesion.puedeTransicionar(sesion, nuevoEstado)) {
            throw new Error('La sesión ya no admite ese cambio de estado.');
        }
        return sesionRepo.actualizar(id, { estado: nuevoEstado });
    },

    cancelar(id: number | string | null | undefined): SesionEntidad | null {
        return sesionRepo.cancelar(id);
    },
};

export default SesionService;
