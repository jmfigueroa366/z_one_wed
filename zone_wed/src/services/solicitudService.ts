// CAPA: Aplicación
import { crearSolicitud, crearInvitacion, Solicitud } from '../models/Solicitud.ts';
import { solicitudRepo } from '../repositories/solicitudRepo.ts';
import { colaboradorRepo } from '../repositories/colaboradorRepo.ts';
import { salaRepo } from '../repositories/salaRepo.ts';
import { sesionRepo } from '../repositories/sesionRepo.ts';
import { usuarioRepo } from '../repositories/usuarioRepo.ts';
import { ordenRepo } from '../repositories/ordenRepo.ts';
import { seSolapan } from '../utils/solicitudes.ts';
import { ESTADOS_SOLICITUD_ACTIVOS } from '../config/estados.ts';
import { ROLES } from '../config/roles.ts';
import { TIPOS_ORDEN } from '../config/facturacion.ts';
import { OrdenService } from './ordenService.ts';
import type { Solicitud as SolicitudEntidad, EntradaSolicitud } from '../models/Solicitud.ts';
import type { Sesion } from '../models/Sesion.ts';
import type { Orden } from '../models/Orden.ts';
import type { Usuario } from '../models/Usuario.ts';

function franjaDe(sesion: Sesion): string | null {
    if (!sesion?.hora_inicio || !sesion?.hora_fin) return null;
    return `${sesion.hora_inicio}-${sesion.hora_fin}`;
}

function franjaAHoras(franja: string | null | undefined): { hora_inicio: string | null; hora_fin: string | null } {
    const [inicio, fin] = String(franja ?? '').split('-').map((hora) => hora.trim());
    return { hora_inicio: inicio || null, hora_fin: fin || null };
}

function hayConflicto({ salaId, fecha, franja }: { salaId: number | string | null; fecha: string | null | undefined; franja: string | null | undefined }): boolean {
    const chocaConSolicitud = solicitudRepo.listar().some((solicitud) =>
        ESTADOS_SOLICITUD_ACTIVOS.includes(solicitud.estado) &&
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
        return solicitudRepo.crear(solicitud);
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

        let actualizada = solicitudRepo.actualizar(solicitud.id, { colaboradores });

        if (Solicitud.todosRespondieron(actualizada)) {
            if (Solicitud.todosAceptaron(actualizada)) {
                // El equipo aceptó: queda en manos del administrador autorizar.
                actualizada = solicitudRepo.actualizar(solicitud.id, { estado: 'por_autorizar' });
            } else {
                actualizada = solicitudRepo.actualizar(solicitud.id, { estado: 'rechazada' });
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
                crearSesionDesdeSolicitud(confirmada);
            }
            return confirmada;
        }

        const autorizada = solicitudRepo.actualizar(solicitud.id, { estado: 'por_pagar' });
        if (autorizada) {
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
        return solicitudRepo.actualizar(solicitud.id, { estado: 'rechazada' });
    },

    // La dispara la facturación cuando el cliente paga el anticipo de la reserva.
    confirmarPorPago(solicitudId: number | string): SolicitudEntidad | null {
        const solicitud = solicitudRepo.obtenerPorId(solicitudId);
        if (!solicitud || solicitud.estado !== 'por_pagar') {
            return solicitud;
        }
        const confirmada = solicitudRepo.actualizar(solicitud.id, { estado: 'confirmada' });
        if (confirmada) {
            crearSesionDesdeSolicitud(confirmada);
        }
        return confirmada;
    },

    cancelar(id: number | string): SolicitudEntidad | null {
        const solicitud = solicitudRepo.obtenerPorId(id);
        if (!solicitud) {
            return null;
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
            ordenRepo.actualizar(pendiente.id, {
                estado: 'cancelada',
                fecha_cancelacion: new Date().toISOString().slice(0, 10),
            });
        }

        return solicitudRepo.actualizar(id, { estado: 'cancelada' });
    },
};

export default SolicitudService;
