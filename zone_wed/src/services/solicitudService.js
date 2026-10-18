// CAPA: Aplicación
import { crearSolicitud, crearInvitacion, Solicitud } from '../models/Solicitud.js';
import { solicitudRepo } from '../repositories/solicitudRepo.js';
import { colaboradorRepo } from '../repositories/colaboradorRepo.js';
import { salaRepo } from '../repositories/salaRepo.js';
import { sesionRepo } from '../repositories/sesionRepo.js';
import { seSolapan } from '../utils/solicitudes.js';
import { haySupabase } from '../lib/supabaseClient.js';
import {
    insertarSolicitud,
    actualizarEstadoSolicitud,
    actualizarInvitacionSolicitud,
    sincronizarSolicitudes,
} from '../infrastructure/supabaseSync.js';

function franjaDe(sesion) {
    if (!sesion?.hora_inicio || !sesion?.hora_fin) return null;
    return `${sesion.hora_inicio}-${sesion.hora_fin}`;
}

function hayConflicto({ salaId, fecha, franja }) {
    const chocaConSolicitud = solicitudRepo.listar().some((solicitud) =>
        solicitud.estado === 'solicitada' &&
        String(solicitud.sala_id) === String(salaId) &&
        solicitud.fecha === fecha &&
        seSolapan(solicitud.franja, franja)
    );
    if (chocaConSolicitud) {
        return true;
    }

    return sesionRepo.listar().some((sesion) =>
        sesion.estado !== 'cancelada' &&
        String(sesion.sala_id) === String(salaId) &&
        sesion.fecha === fecha &&
        seSolapan(franjaDe(sesion), franja)
    );
}

function crearSesionDesdeSolicitud(solicitud) {
    const yaExiste = sesionRepo.listar().some((sesion) => String(sesion.solicitud_id) === String(solicitud.id));
    if (yaExiste) {
        return null;
    }

    const [hora_inicio, hora_fin] = String(solicitud.franja ?? '').split('-').map((hora) => hora.trim());
    const aceptados = Solicitud.colaboradoresDe(solicitud).filter((invitacion) => invitacion.estado === 'aceptada');
    const principal = aceptados[0]?.colaborador_id ?? null;

    return sesionRepo.crear({
        titulo: solicitud.titulo || 'Sesión de estudio',
        solicitud_id: solicitud.id,
        sala_id: solicitud.sala_id,
        colaborador_id: principal,
        fecha: solicitud.fecha,
        hora_inicio: hora_inicio ?? null,
        hora_fin: hora_fin ?? null,
        estado: 'confirmada',
        cancion_id: solicitud.cancion_id ?? null,
        partes: solicitud.partes ?? [],
    });
}

// Ejecuta una escritura en Supabase sin romper la app si falla.
// Se usa en actualizaciones; al crear sí se propaga el error al usuario.
async function escribirEnSupabase(operacion, textoDeError) {
    if (!haySupabase) {
        return;
    }
    try {
        await operacion();
    } catch (error) {
        console.warn(textoDeError, error);
    }
}

export const SolicitudService = {
    listar() {
        return solicitudRepo.listar();
    },

    obtenerPorId(id) {
        return solicitudRepo.obtenerPorId(id);
    },

    async crear(data) {
        const sala = salaRepo.obtenerPorId(data.sala_id);
        if (!sala) {
            throw new Error('La sala no existe.');
        }

        const invitados = Array.isArray(data.colaboradores) ? data.colaboradores : [];
        if (invitados.length === 0) {
            throw new Error('Selecciona al menos un artista o productor.');
        }

        const colaboradores = invitados.map((invitacion) => {
            const colaborador = colaboradorRepo.obtenerPorId(invitacion.colaborador_id);
            if (!colaborador) {
                throw new Error('Uno de los colaboradores seleccionados no existe.');
            }
            return crearInvitacion({
                colaborador_id: colaborador.id,
                rol: invitacion.rol ?? null,
                estado: 'pendiente',
            });
        });

        if (hayConflicto({ salaId: sala.id, fecha: data.fecha, franja: data.franja })) {
            throw new Error('La sala ya está reservada en ese rango de hora.');
        }

        const solicitud = crearSolicitud({
            ...data,
            sala_id: sala.id,
            colaboradores,
            estado: 'solicitada',
            fecha_solicitud: new Date().toISOString(),
        });

        if (haySupabase) {
            const { id } = await insertarSolicitud(solicitud);
            try {
                await sincronizarSolicitudes();
                const creada = solicitudRepo.obtenerPorId(id);
                if (creada) {
                    return creada;
                }
            } catch (errorSincronizar) {
                console.warn('No se pudo refrescar la lista de solicitudes.', errorSincronizar);
            }
        }

        return solicitudRepo.crear(solicitud);
    },

    async responderInvitacion(solicitudId, colaboradorId, decision) {
        if (!['aceptada', 'rechazada'].includes(decision)) {
            throw new Error('Respuesta inválida.');
        }

        const solicitud = solicitudRepo.obtenerPorId(solicitudId);
        if (!solicitud) {
            throw new Error('La solicitud no existe.');
        }
        if (solicitud.estado !== 'solicitada') {
            throw new Error('La solicitud ya no está pendiente.');
        }

        const invitacion = Solicitud.invitacionDe(solicitud, colaboradorId);
        if (!invitacion) {
            throw new Error('No fuiste invitado a esta solicitud.');
        }
        if (invitacion.estado !== 'pendiente') {
            throw new Error('Ya respondiste esta solicitud.');
        }

        const colaboradores = Solicitud.colaboradoresDe(solicitud).map((item) =>
            String(item.colaborador_id) === String(colaboradorId)
                ? { ...item, estado: decision }
                : item
        );

        await escribirEnSupabase(
            () => actualizarInvitacionSolicitud(solicitud.id, colaboradorId, decision),
            'No se pudo registrar tu respuesta en Supabase.'
        );

        let actualizada = solicitudRepo.actualizar(solicitud.id, { colaboradores });

        if (Solicitud.todosRespondieron(actualizada)) {
            const nuevoEstado = Solicitud.todosAceptaron(actualizada) ? 'confirmada' : 'rechazada';
            await escribirEnSupabase(
                () => actualizarEstadoSolicitud(solicitud.id, nuevoEstado),
                'No se pudo actualizar el estado de la solicitud en Supabase.'
            );
            actualizada = solicitudRepo.actualizar(solicitud.id, { estado: nuevoEstado });
            if (nuevoEstado === 'confirmada') {
                crearSesionDesdeSolicitud(actualizada);
            }
        }

        return actualizada;
    },

    async cancelar(id) {
        const solicitud = solicitudRepo.obtenerPorId(id);
        if (!solicitud) {
            return null;
        }
        if (!Solicitud.puedeTransicionar(solicitud, 'cancelada')) {
            throw new Error('La solicitud ya no se puede cancelar.');
        }
        await escribirEnSupabase(
            () => actualizarEstadoSolicitud(id, 'cancelada'),
            'No se pudo cancelar la solicitud en Supabase.'
        );
        return solicitudRepo.actualizar(id, { estado: 'cancelada' });
    },
};

export default SolicitudService;
