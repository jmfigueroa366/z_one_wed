// CAPA: Aplicación
import { crearSesion, Sesion } from '../models/Sesion.ts';
import type { EntradaSesion, Sesion as SesionEntidad } from '../models/Sesion.ts';
import { sesionRepo } from '../repositories/sesionRepo.ts';
import { colaboradorRepo } from '../repositories/colaboradorRepo.ts';
import { salaRepo } from '../repositories/salaRepo.ts';
import { solicitudRepo } from '../repositories/solicitudRepo.ts';

import { actualizarEstadoSesion, encadenarEscritura, idRemoto, idRemotoRecordado, sincronizarSesiones, hayConexionSupabase } from '../infrastructure/supabaseSync.ts';
import { esFranjaValida, hayConflicto } from '../utils/solicitudes.ts';

// Clave de la cadena de escrituras de una sesión.
function claveSesion(id: number | string | null | undefined): string {
    return `sesion:${String(id)}`;
}

// El id de la sesión en Supabase. Nunca se usa el id local: si no se conoce
// el remoto, la escritura se omite para no tocar otra fila.
function idRemotoDeSesion(sesion: SesionEntidad | null | undefined): number | string | null {
    if (!sesion) {
        return null;
    }
    const recordado = idRemotoRecordado(claveSesion(sesion.id));
    if (recordado != null) {
        return recordado;
    }
    return idRemoto(sesion);
}

// Escribe en Supabase sobre la sesión, encadenado con su alta y solo si se
// conoce el id remoto de la fila.
function escribirSesion(
    sesion: SesionEntidad | null | undefined,
    operacion: (idRemoto: number | string) => Promise<unknown>,
    textoDeError: string
): void {
    if (!hayConexionSupabase() || !sesion) {
        return;
    }
    encadenarEscritura(claveSesion(sesion.id), async () => {
        const remoto = idRemotoDeSesion(sesionRepo.obtenerPorId(sesion.id)) ?? idRemotoDeSesion(sesion);
        if (remoto == null) {
            return;
        }
        await operacion(remoto);
        // Se refresca la lista para que el estado local coincida con el remoto.
        await sincronizarSesiones();
    }).catch((error) => console.warn(textoDeError, error));
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
            escribirSesion(
                sesion,
                (idRemotoSesion) => actualizarEstadoSesion(idRemotoSesion, 'cancelada'),
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
        const actualizada = sesionRepo.actualizar(id, { estado: nuevoEstado });
        if (actualizada) {
            escribirSesion(
                actualizada,
                (idRemotoSesion) => actualizarEstadoSesion(idRemotoSesion, nuevoEstado),
                'No se pudo actualizar el estado de la sesión en Supabase.'
            );
        }
        return actualizada;
    },

    cancelar(id: number | string | null | undefined): SesionEntidad | null {
        const sesion = sesionRepo.obtenerPorId(id);
        const cancelada = sesionRepo.cancelar(id);
        if (sesion && cancelada) {
            escribirSesion(
                cancelada,
                (idRemotoSesion) => actualizarEstadoSesion(idRemotoSesion, 'cancelada'),
                'No se pudo cancelar la sesión en Supabase.'
            );
        }
        return cancelada;
    },

    cancelarSesionesDeSolicitud,
};

export default SesionService;
