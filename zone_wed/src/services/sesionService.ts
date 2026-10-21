// CAPA: Aplicación
import { crearSesion, Sesion } from '../models/Sesion.ts';
import type { EntradaSesion, Sesion as SesionEntidad } from '../models/Sesion.ts';
import { sesionRepo } from '../repositories/sesionRepo.ts';
import { colaboradorRepo } from '../repositories/colaboradorRepo.ts';
import { salaRepo } from '../repositories/salaRepo.ts';
import { solicitudRepo } from '../repositories/solicitudRepo.ts';
import { haySupabase } from '../lib/supabaseClient.ts';
import { actualizarEstadoSesion } from '../infrastructure/supabaseSync.ts';
import { esFranjaValida, hayConflicto } from '../utils/solicitudes.ts';

function escribirEnSupabase(operacion: () => Promise<unknown>, textoDeError: string): void {
    if (!haySupabase) {
        return;
    }
    operacion().catch((error) => console.warn(textoDeError, error));
}

export function cancelarSesionesDeSolicitud(solicitudId: number | string): void {
    sesionRepo.listar()
        .filter((sesion) =>
            String(sesion.solicitud_id) === String(solicitudId)
            && sesion.estado !== 'cancelada'
            && Sesion.puedeTransicionar(sesion, 'cancelada')
        )
        .forEach((sesion) => {
            sesionRepo.cancelar(sesion.id);
            escribirEnSupabase(
                () => actualizarEstadoSesion(sesion.id, 'cancelada'),
                'No se pudo cancelar la sesión en Supabase.'
            );
        });
}

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
        if (!data.fecha) {
            throw new Error('Indica la fecha de la sesión.');
        }
        const franja = `${data.hora_inicio ?? ''}-${data.hora_fin ?? ''}`;
        if (!esFranjaValida(franja)) {
            throw new Error('La franja de horas de la sesión no es válida.');
        }
        if (hayConflicto({
            salaId: sala.id,
            fecha: data.fecha,
            franja,
            solicitudes: solicitudRepo.listar(),
            sesiones: sesionRepo.listar(),
        })) {
            throw new Error('La sala ya está reservada en ese rango de hora.');
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

    cancelarSesionesDeSolicitud,
};

export default SesionService;
