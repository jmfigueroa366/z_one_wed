// CAPA: Aplicación
import { crearSolicitud, crearInvitacion, Solicitud } from '../models/Solicitud.ts';
import { solicitudRepo } from '../repositories/solicitudRepo.ts';
import { colaboradorRepo } from '../repositories/colaboradorRepo.ts';
import { salaRepo } from '../repositories/salaRepo.ts';
import { sesionRepo } from '../repositories/sesionRepo.ts';
import { usuarioRepo } from '../repositories/usuarioRepo.ts';
import { ordenRepo } from '../repositories/ordenRepo.ts';
import { Orden } from '../models/Orden.ts';
import { esFranjaValida, hayConflicto } from '../utils/solicitudes.ts';
import { ROLES } from '../config/roles.ts';
import { TIPOS_ORDEN } from '../config/facturacion.ts';
import { OrdenService } from './ordenService.ts';
import { cancelarSesionesDeSolicitud } from './sesionService.ts';

import {
    insertarSolicitud,
    actualizarEstadoSolicitud,
    actualizarInvitacionSolicitud,
    sincronizarSolicitudes,
    encadenarEscritura,
    recordarIdRemoto,
    idRemotoRecordado,
    idRemoto,
    hayConexionSupabase,
} from '../infrastructure/supabaseSync.ts';
import type { Solicitud as SolicitudEntidad, EntradaSolicitud } from '../models/Solicitud.ts';
import type { Sesion } from '../models/Sesion.ts';
import type { Usuario } from '../models/Usuario.ts';

// Clave de la cadena de escrituras de una solicitud.
function claveSolicitud(id: number | string | null | undefined): string {
    return `solicitud:${String(id)}`;
}

// El id de la solicitud en Supabase. Nunca se usa el id local: si no se
// conoce el remoto, la escritura se omite para no tocar otra fila.
function idRemotoDeSolicitud(solicitud: SolicitudEntidad | null | undefined): number | string | null {
    if (!solicitud) {
        return null;
    }
    const recordado = idRemotoRecordado(claveSolicitud(solicitud.id));
    if (recordado != null) {
        return recordado;
    }
    return idRemoto(solicitud);
}

// Escribe en Supabase sobre la solicitud, encadenado con su alta para que
// un cambio de estado que llega antes del insert se aplique igual, y solo
// si se conoce el id remoto de la fila.
function escribirSolicitud(
    solicitud: SolicitudEntidad | null | undefined,
    operacion: (idRemoto: number | string) => Promise<unknown>,
    textoDeError: string
): void {
    if (!hayConexionSupabase() || !solicitud) {
        return;
    }
    encadenarEscritura(claveSolicitud(solicitud.id), async () => {
        const remoto = idRemotoDeSolicitud(solicitudRepo.obtenerPorId(solicitud.id)) ?? idRemotoDeSolicitud(solicitud);
        if (remoto == null) {
            // La solicitud todavia no existe en Supabase: no se toca ninguna fila.
            return;
        }
        await operacion(remoto);
        // Se refresca la lista para que el estado local coincida con el remoto.
        await sincronizarSolicitudes();
    }).catch((error) => console.warn(textoDeError, error));
}

function franjaAHoras(franja: string | null | undefined): { hora_inicio: string | null; hora_fin: string | null } {
    const [inicio, fin] = String(franja ?? '').split('-').map((hora) => hora.trim());
    return { hora_inicio: inicio || null, hora_fin: fin || null };
}

function hayConflictoSala({ salaId, fecha, franja }: { salaId: number | string | null; fecha: string | null | undefined; franja: string | null | undefined }): boolean {
    return hayConflicto({
        salaId,
        fecha,
        franja,
        solicitudes: solicitudRepo.listar(),
        sesiones: sesionRepo.listar(),
    });
}

function crearSesionDesdeSolicitud(solicitud: SolicitudEntidad): Sesion | null {
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
        tipo: solicitud.tipo ?? null,
        sala_id: solicitud.sala_id,
        colaborador_id: principal,
        fecha: solicitud.fecha,
        hora_inicio: hora_inicio ?? null,
        hora_fin: hora_fin ?? null,
        estado: 'confirmada',
        cancion_id: solicitud.cancion_id ?? null,
        proyecto_id: solicitud.proyecto_id ?? null,
        partes: solicitud.partes ?? [],
    });
}

// Al autorizar, se emite la factura del anticipo que el cliente debe pagar
// para que la reserva siga avanzando.
function emitirAnticipoDeSolicitud(solicitud: SolicitudEntidad, solicitante: Usuario): Orden | null {
    const yaFacturada = ordenRepo.listar().some((orden) =>
        String(orden.solicitud_id) === String(solicitud.id) &&
        ['facturada', 'parcial', 'pagada'].includes(orden.estado)
    );
    if (yaFacturada) {
        return null;
    }

    const { hora_inicio, hora_fin } = franjaAHoras(solicitud.franja);
    return OrdenService.emitirReserva(
        {
            tipo: solicitud.tipo,
            hora_inicio,
            hora_fin,
            franja: solicitud.franja,
            titulo: solicitud.titulo || 'Reserva de sesión',
            fecha: solicitud.fecha,
            proyecto_id: solicitud.proyecto_id ?? null,
            cancion_id: solicitud.cancion_id ?? null,
        },
        { usuario_id: solicitante.id, solicitud_id: solicitud.id }
    );
}

// El cliente no puede abrir otra solicitud mientras tenga una reserva sin pagar.
function pagoReservaPendiente(usuarioId: number | string | null | undefined): Orden | null {
    if (usuarioId == null) return null;
    return ordenRepo.listar().find((orden) =>
        String(orden.usuario_id) === String(usuarioId) &&
        orden.tipo === TIPOS_ORDEN.RESERVA &&
        ['facturada', 'parcial'].includes(orden.estado)
    ) ?? null;
}

export const SolicitudService = {
    listar(): SolicitudEntidad[] {
        return solicitudRepo.listar();
    },

    obtenerPorId(id: number | string): SolicitudEntidad | null {
        return solicitudRepo.obtenerPorId(id);
    },

    crear(data: EntradaSolicitud): SolicitudEntidad {
        const sala = salaRepo.obtenerPorId(data.sala_id);
        if (!sala) {
            throw new Error('La sala no existe.');
        }

        const pendiente = pagoReservaPendiente(data.usuario_id);
        if (pendiente) {
            throw new Error('Tienes un anticipo de reserva sin pagar. Paga tu factura antes de crear otra solicitud.');
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

        if (!data.fecha) {
            throw new Error('Indica la fecha de la reserva.');
        }
        if (!esFranjaValida(data.franja)) {
            throw new Error('La franja de horas de la reserva no es válida.');
        }
        if (hayConflictoSala({ salaId: sala.id, fecha: data.fecha, franja: data.franja })) {
            throw new Error('La sala ya está reservada en ese rango de hora.');
        }

        const solicitud = crearSolicitud({
            ...data,
            sala_id: sala.id,
            colaboradores,
            estado: 'solicitada',
            fecha_solicitud: new Date().toISOString(),
        });
        const creada = solicitudRepo.crear(solicitud);

        // El alta y los cambios de estado posteriores van encadenados: si el
        // administrador autoriza antes de que termine el insert, el cambio
        // se aplica sobre la fila correcta y no se pierde.
        if (hayConexionSupabase()) {
            encadenarEscritura(claveSolicitud(creada.id), async () => {
                const { id } = await insertarSolicitud(creada);
                recordarIdRemoto(claveSolicitud(creada.id), id);
                await solicitudRepo.registrarIdRemoto(creada.id, id);
                await sincronizarSolicitudes();
            }).catch((error) => console.warn('No se pudo guardar la solicitud en Supabase.', error));
        }

        return creada;
    },

    responderInvitacion(solicitudId: number | string, colaboradorId: number | string, decision: string): SolicitudEntidad | null {
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

        // En Supabase se actualiza la fila por su id remoto, no por el local.
        escribirSolicitud(
            solicitud,
            (idRemotoSolicitud) => actualizarInvitacionSolicitud(idRemotoSolicitud, colaboradorId, decision),
            'No se pudo registrar tu respuesta en Supabase.'
        );

        let actualizada = solicitudRepo.actualizar(solicitud.id, { colaboradores });

        if (Solicitud.todosRespondieron(actualizada)) {
            if (Solicitud.todosAceptaron(actualizada)) {
                // El equipo aceptó: queda en manos del administrador autorizar.
                actualizada = solicitudRepo.actualizar(solicitud.id, { estado: 'por_autorizar' });
                escribirSolicitud(
                    actualizada,
                    (idRemotoSolicitud) => actualizarEstadoSolicitud(idRemotoSolicitud, 'por_autorizar'),
                    'No se pudo actualizar el estado de la solicitud en Supabase.'
                );
            } else {
                actualizada = solicitudRepo.actualizar(solicitud.id, { estado: 'rechazada' });
                escribirSolicitud(
                    actualizada,
                    (idRemotoSolicitud) => actualizarEstadoSolicitud(idRemotoSolicitud, 'rechazada'),
                    'No se pudo actualizar el estado de la solicitud en Supabase.'
                );
            }
        }

        return actualizada;
    },

    // El administrador autoriza la solicitud para que el cliente pueda pagar.
    autorizar(solicitudId: number | string, { rol }: { rol?: string } = {}): SolicitudEntidad | null {
        if (rol !== ROLES.ADMINISTRADOR) {
            throw new Error('Solo un administrador puede autorizar la solicitud.');
        }

        const solicitud = solicitudRepo.obtenerPorId(solicitudId);
        if (!solicitud) {
            throw new Error('La solicitud no existe.');
        }
        if (solicitud.estado !== 'por_autorizar') {
            throw new Error('La solicitud todavía no está lista para autorizar.');
        }

        const solicitante = usuarioRepo.obtenerPorId(solicitud.usuario_id);

        // Si quien solicita no es cliente no hay pago: se confirma directamente.
        if (solicitante?.rol !== ROLES.CLIENTE) {
            const confirmada = solicitudRepo.actualizar(solicitud.id, { estado: 'confirmada' });
            if (confirmada) {
                escribirSolicitud(
                    confirmada,
                    (idRemotoSolicitud) => actualizarEstadoSolicitud(idRemotoSolicitud, 'confirmada'),
                    'No se pudo confirmar la solicitud en Supabase.'
                );
                crearSesionDesdeSolicitud(confirmada);
            }
            return confirmada;
        }

        const autorizada = solicitudRepo.actualizar(solicitud.id, { estado: 'por_pagar' });
        if (autorizada) {
            escribirSolicitud(
                autorizada,
                (idRemotoSolicitud) => actualizarEstadoSolicitud(idRemotoSolicitud, 'por_pagar'),
                'No se pudo autorizar la solicitud en Supabase.'
            );
            emitirAnticipoDeSolicitud(autorizada, solicitante);
        }
        return autorizada;
    },

    rechazar(solicitudId: number | string, { rol }: { rol?: string } = {}): SolicitudEntidad | null {
        if (rol !== ROLES.ADMINISTRADOR) {
            throw new Error('Solo un administrador puede rechazar la solicitud.');
        }

        const solicitud = solicitudRepo.obtenerPorId(solicitudId);
        if (!solicitud) {
            throw new Error('La solicitud no existe.');
        }
        if (!Solicitud.puedeTransicionar(solicitud, 'rechazada')) {
            throw new Error('La solicitud no se puede rechazar en su estado actual.');
        }
        const rechazada = solicitudRepo.actualizar(solicitud.id, { estado: 'rechazada' });
        if (rechazada) {
            escribirSolicitud(
                rechazada,
                (idRemotoSolicitud) => actualizarEstadoSolicitud(idRemotoSolicitud, 'rechazada'),
                'No se pudo rechazar la solicitud en Supabase.'
            );
        }
        return rechazada;
    },

    // La dispara la facturación cuando el cliente paga el anticipo de la reserva.
    confirmarPorPago(solicitudId: number | string): SolicitudEntidad | null {
        const solicitud = solicitudRepo.obtenerPorId(solicitudId);
        if (!solicitud || solicitud.estado !== 'por_pagar') {
            return solicitud;
        }
        const confirmada = solicitudRepo.actualizar(solicitud.id, { estado: 'confirmada' });
        if (confirmada) {
            escribirSolicitud(
                confirmada,
                (idRemotoSolicitud) => actualizarEstadoSolicitud(idRemotoSolicitud, 'confirmada'),
                'No se pudo confirmar la solicitud en Supabase.'
            );
            crearSesionDesdeSolicitud(confirmada);
        }
        return confirmada;
    },

    cancelar(id: number | string, { usuario, rol }: { usuario?: Usuario | null; rol?: string | null } = {}): SolicitudEntidad | null {
        const solicitud = solicitudRepo.obtenerPorId(id);
        if (!solicitud) {
            return null;
        }
        // Solo el dueño o un administrador pueden cancelar la solicitud.
        if (usuario != null && rol !== ROLES.ADMINISTRADOR && String(solicitud.usuario_id) !== String(usuario.id)) {
            throw new Error('No puedes cancelar una solicitud que no es tuya.');
        }
        if (!Solicitud.puedeTransicionar(solicitud, 'cancelada')) {
            throw new Error('La solicitud ya no se puede cancelar.');
        }

        // Cancela el anticipo pendiente para no dejar facturas colgando.
        const pendiente = ordenRepo.listar().find((orden) =>
            String(orden.solicitud_id) === String(solicitud.id) &&
            ['facturada', 'parcial'].includes(orden.estado)
        );
        if (pendiente) {
            if (Orden.puedeTransicionar(pendiente, 'cancelada')) {
                ordenRepo.actualizar(pendiente.id, {
                    estado: 'cancelada',
                    fecha_cancelacion: new Date().toISOString().slice(0, 10),
                });
            }
        }

        // Libera la cabina: cancela las sesiones creadas por esta solicitud.
        if (solicitud.id != null) {
            cancelarSesionesDeSolicitud(solicitud.id);
        }

        escribirSolicitud(
            solicitud,
            (idRemotoSolicitud) => actualizarEstadoSolicitud(idRemotoSolicitud, 'cancelada'),
            'No se pudo cancelar la solicitud en Supabase.'
        );

        return solicitudRepo.actualizar(id, { estado: 'cancelada' });
    },
};

export default SolicitudService;
