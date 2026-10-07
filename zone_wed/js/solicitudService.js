import { ROLES, tienePermiso } from './roles.js';
import { SolicitudRepo } from './solicitudRepo.js';
import { ColaboradorRepo } from './colaboradorRepo.js';
import { SalaRepo } from './salaRepo.js';
import { UsuarioRepo } from './usuarioRepo.js';
import { Storage } from './storage.js';

function exigirPermiso(actor, permiso) {
    if (!actor || !tienePermiso(actor.rol, permiso)) {
        throw new Error('Tu perfil no tiene permiso para realizar esta acción.');
    }
}

function usuarioColaborador(colaboradorId) {
    const colaborador = ColaboradorRepo.porId(Number(colaboradorId));
    if (!colaborador || colaborador.activo === false) {
        throw new Error('El colaborador seleccionado no está disponible.');
    }

    const usuario = UsuarioRepo.porId(colaborador.usuario_id);
    if (!usuario || usuario.activo === false || usuario.rol !== ROLES.COLABORADOR) {
        throw new Error('El colaborador no tiene una cuenta activa vinculada.');
    }

    return { colaborador, usuario };
}

function notificar(usuarioId, solicitud, tipo, mensaje) {
    if (!usuarioId) return;

    Storage.crear('notificaciones', {
        usuario_id: Number(usuarioId),
        solicitud_id: solicitud.id,
        tipo,
        mensaje,
        fecha: new Date().toISOString(),
        leida: false,
    });
}

function auditar(actor, accion, solicitudId, detalle = '') {
    Storage.crear('auditoria', {
        usuario_id: actor.id,
        usuario: actor.nombre,
        rol: actor.rol,
        accion,
        entidad: 'solicitud',
        entidad_id: solicitudId,
        detalle,
        fecha: new Date().toISOString(),
    });
}

function obtenerSolicitud(id) {
    const solicitud = SolicitudRepo.porId(id);
    if (!solicitud) throw new Error('La solicitud ya no existe.');
    return solicitud;
}

function buscarInvitacion(solicitud, invitacionId) {
    const invitacion = solicitud.invitaciones.find((item) => String(item.id) === String(invitacionId));
    if (!invitacion) throw new Error('La invitación ya no existe.');
    return invitacion;
}

function exigirPropietario(actor, solicitud) {
    if (Number(solicitud.creado_por_usuario_id) !== Number(actor.id)) {
        throw new Error('Solo quien creó la solicitud puede realizar esta acción.');
    }
}

function todasAceptadas(invitaciones) {
    return invitaciones.length > 0 && invitaciones.every((item) =>
        item.estado === 'aceptada' || item.estado === 'aceptada_por_admin'
    );
}

function registrarConfirmacion(solicitud, actor, detalle) {
    const actualizada = SolicitudRepo.actualizar(solicitud.id, {
        estado: 'confirmada',
        confirmada_en: new Date().toISOString(),
        confirmada_por: actor.id,
    });

    notificar(solicitud.creado_por_usuario_id, actualizada, 'solicitud_confirmada',
        `La solicitud «${solicitud.titulo}» fue confirmada.`);
    auditar(actor, 'solicitud_confirmada', solicitud.id, detalle);
    return actualizada;
}

function confirmarSiTodasAceptaron(solicitud, actor) {
    if (todasAceptadas(solicitud.invitaciones)) {
        return registrarConfirmacion(solicitud, actor, 'Confirmación automática: todas las invitaciones fueron aceptadas.');
    }
    return SolicitudRepo.actualizar(solicitud.id, { estado: 'en_negociacion' });
}

function fechaHoraLocal(fecha, hora) {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const [horas, minutos] = hora.split(':').map(Number);
    return new Date(anio, mes - 1, dia, horas, minutos);
}

function validarFechaYHorario(fecha, horaInicio, horaFin) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error('Indica una fecha válida.');
    if (!/^\d{2}:\d{2}$/.test(horaInicio) || !/^\d{2}:\d{2}$/.test(horaFin)) {
        throw new Error('Indica un horario válido.');
    }

    const inicio = fechaHoraLocal(fecha, horaInicio);
    const fin = fechaHoraLocal(fecha, horaFin);
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const [horas_fin, minutos_fin] = horaFin.split(':').map(Number);
    if (Number.isNaN(inicio.getTime()) || inicio.getFullYear() !== anio ||
        inicio.getMonth() !== mes - 1 || inicio.getDate() !== dia ||
        horas > 23 || minutos > 59 || horas_fin > 23 || minutos_fin > 59) {
        throw new Error('La fecha indicada no es válida.');
    }
    if (inicio < new Date()) throw new Error('La fecha y hora deben ser futuras.');
    if (fin <= inicio) throw new Error('La hora final debe ser posterior a la inicial.');
}

function validarDisponibilidad(salaId, fecha, horaInicio, horaFin, excluirSolicitudId = null) {
    const seCruza = (inicioExistente, finExistente) =>
        horaInicio < finExistente && horaFin > inicioExistente;

    const solicitudOcupada = SolicitudRepo.todas().some((solicitud) =>
        solicitud.id !== Number(excluirSolicitudId) &&
        solicitud.estado === 'confirmada' &&
        Number(solicitud.sala_id) === salaId &&
        solicitud.fecha === fecha &&
        seCruza(solicitud.hora_inicio, solicitud.hora_fin)
    );

    const sesionOcupada = Storage.buscar('sesiones', (sesion) =>
        sesion.estado !== 'cancelada' &&
        Number(sesion.sala_id) === salaId &&
        sesion.fecha === fecha &&
        seCruza(sesion.hora_inicio, sesion.hora_fin)
    ).length > 0;

    if (solicitudOcupada || sesionOcupada) {
        throw new Error('La sala ya tiene una reserva que se cruza con ese horario.');
    }
}

export const SolicitudService = {
    listar(actor) {
        if (!actor) return [];
        const solicitudes = SolicitudRepo.todas();

        if (tienePermiso(actor.rol, 'solicitudes.leer_global')) return solicitudes;
        return solicitudes.filter((solicitud) =>
            Number(solicitud.creado_por_usuario_id) === Number(actor.id) ||
            solicitud.invitaciones.some((item) => Number(item.usuario_id) === Number(actor.id))
        );
    },

    invitacionesPropias(actor) {
        exigirPermiso(actor, 'invitaciones.responder');
        return SolicitudRepo.todas().flatMap((solicitud) =>
            solicitud.invitaciones
                .filter((item) => Number(item.usuario_id) === Number(actor.id))
                .map((invitacion) => ({ ...invitacion, solicitud }))
        );
    },

    colaboradoresDisponibles() {
        return ColaboradorRepo.todas().flatMap((colaborador) => {
            const usuario = UsuarioRepo.porId(colaborador.usuario_id);
            if (!usuario || usuario.activo === false || usuario.rol !== ROLES.COLABORADOR) return [];
            return [{ id: colaborador.id, nombre: colaborador.nombre, especialidad: colaborador.especialidad }];
        });
    },

    salasDisponibles() {
        return SalaRepo.todas();
    },

    crear(datos, actor) {
        exigirPermiso(actor, 'solicitudes.crear');
        exigirPermiso(actor, 'invitaciones.enviar');

        const titulo = String(datos?.titulo || '').trim();
        const fecha = String(datos?.fecha || '');
        const hora_inicio = String(datos?.hora_inicio || '');
        const hora_fin = String(datos?.hora_fin || '');
        const sala_id = Number(datos?.sala_id);
        const tarifa = Number(datos?.tarifa_ofrecida);
        const ids_colaboradores = [...new Set((datos?.colaborador_ids || []).map(Number))];

        if (titulo.length < 3) throw new Error('El nombre del proyecto debe tener al menos 3 caracteres.');
        if (!SalaRepo.porId(sala_id) || SalaRepo.porId(sala_id).activo === false) {
            throw new Error('Selecciona una sala activa.');
        }
        if (!(tarifa > 0)) throw new Error('La tarifa ofrecida debe ser mayor que cero.');
        if (ids_colaboradores.length === 0) throw new Error('Invita al menos a un colaborador.');

        validarFechaYHorario(fecha, hora_inicio, hora_fin);
        validarDisponibilidad(sala_id, fecha, hora_inicio, hora_fin);

        const colaboradores = ids_colaboradores.map(usuarioColaborador);
        const vence_en = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
        const solicitud = SolicitudRepo.crear({
            titulo,
            fecha,
            hora_inicio,
            hora_fin,
            sala_id,
            sala_nombre: SalaRepo.porId(sala_id).nombre,
            creado_por_usuario_id: Number(actor.id),
            creado_por: actor.nombre,
            creado_por_rol: actor.rol,
            estado: 'solicitud',
            creada_en: new Date().toISOString(),
            invitaciones: colaboradores.map(({ colaborador, usuario }) => ({
                id: `${Date.now()}-${colaborador.id}`,
                colaborador_id: colaborador.id,
                usuario_id: usuario.id,
                colaborador: colaborador.nombre,
                especialidad: colaborador.especialidad,
                tarifa_ofrecida: tarifa,
                mensaje: String(datos?.mensaje || '').trim(),
                vence_en,
                estado: 'pendiente',
                contraoferta: null,
            })),
        });

        solicitud.invitaciones.forEach((invitacion) => {
            notificar(invitacion.usuario_id, solicitud, 'invitacion_nueva',
                `${actor.nombre} te invitó al proyecto «${titulo}».`);
        });
        auditar(actor, 'solicitud_creada', solicitud.id, `Invitaciones enviadas: ${colaboradores.length}.`);
        return solicitud;
    },

    responderInvitacion(solicitudId, invitacionId, decision, actor) {
        exigirPermiso(actor, 'invitaciones.responder');
        if (!['aceptada', 'rechazada'].includes(decision)) throw new Error('La respuesta no es válida.');

        const solicitud = obtenerSolicitud(solicitudId);
        const invitacion = buscarInvitacion(solicitud, invitacionId);
        if (Number(invitacion.usuario_id) !== Number(actor.id)) throw new Error('Esta invitación no pertenece a tu perfil.');
        if (invitacion.estado !== 'pendiente') throw new Error('Esta invitación ya fue respondida.');
        if (invitacion.vence_en && new Date(invitacion.vence_en) < new Date()) {
            throw new Error('El plazo de esta invitación venció.');
        }

        const invitaciones = solicitud.invitaciones.map((item) =>
            String(item.id) === String(invitacionId)
                ? { ...item, estado: decision, respondida_en: new Date().toISOString() }
                : item
        );
        const actualizada = SolicitudRepo.actualizar(solicitud.id, {
            invitaciones,
            estado: decision === 'rechazada' ? 'en_negociacion' : solicitud.estado,
        });

        notificar(solicitud.creado_por_usuario_id, actualizada, `invitacion_${decision}`,
            `${actor.nombre} ${decision === 'aceptada' ? 'aceptó' : 'rechazó'} la invitación a «${solicitud.titulo}».`);
        auditar(actor, `invitacion_${decision}`, solicitud.id, `Colaborador: ${actor.nombre}.`);

        if (decision === 'aceptada') return confirmarSiTodasAceptaron(actualizada, actor);
        if (invitaciones.every((item) => item.estado === 'rechazada')) {
            return SolicitudRepo.actualizar(solicitud.id, { estado: 'rechazada' });
        }
        return actualizada;
    },

    contraofertar(solicitudId, invitacionId, tarifa, mensaje, actor) {
        exigirPermiso(actor, 'invitaciones.contraofertar');
        const monto = Number(tarifa);
        if (!(monto > 0)) throw new Error('La contraoferta debe ser mayor que cero.');

        const solicitud = obtenerSolicitud(solicitudId);
        const invitacion = buscarInvitacion(solicitud, invitacionId);
        if (Number(invitacion.usuario_id) !== Number(actor.id)) throw new Error('Esta invitación no pertenece a tu perfil.');
        if (invitacion.estado !== 'pendiente') throw new Error('Solo puedes contraofertar una invitación pendiente.');
        if (invitacion.vence_en && new Date(invitacion.vence_en) < new Date()) {
            throw new Error('El plazo de esta invitación venció.');
        }

        const invitaciones = solicitud.invitaciones.map((item) =>
            String(item.id) === String(invitacionId)
                ? { ...item, estado: 'contraoferta', contraoferta: { tarifa: monto, mensaje: String(mensaje || '').trim(), creada_en: new Date().toISOString() } }
                : item
        );
        const actualizada = SolicitudRepo.actualizar(solicitud.id, { invitaciones, estado: 'en_negociacion' });
        notificar(solicitud.creado_por_usuario_id, actualizada, 'contraoferta_nueva',
            `${actor.nombre} envió una contraoferta para «${solicitud.titulo}».`);
        auditar(actor, 'contraoferta_enviada', solicitud.id, `Tarifa propuesta: ${monto}.`);
        return actualizada;
    },

    aceptarContraoferta(solicitudId, invitacionId, actor) {
        exigirPermiso(actor, 'contraofertas.aceptar');
        const solicitud = obtenerSolicitud(solicitudId);
        exigirPropietario(actor, solicitud);
        const invitacion = buscarInvitacion(solicitud, invitacionId);
        if (invitacion.estado !== 'contraoferta' || !invitacion.contraoferta) {
            throw new Error('No hay una contraoferta pendiente para aceptar.');
        }

        const invitaciones = solicitud.invitaciones.map((item) =>
            String(item.id) === String(invitacionId)
                ? { ...item, estado: 'aceptada', tarifa_aceptada: item.contraoferta.tarifa, respondida_en: new Date().toISOString() }
                : item
        );
        const actualizada = SolicitudRepo.actualizar(solicitud.id, { invitaciones });
        const usuario = UsuarioRepo.porId(invitacion.usuario_id);
        notificar(usuario?.id, actualizada, 'contraoferta_aceptada',
            `Aceptaron tu tarifa para «${solicitud.titulo}».`);
        auditar(actor, 'contraoferta_aceptada', solicitud.id, `Invitación: ${invitacionId}.`);
        return confirmarSiTodasAceptaron(actualizada, actor);
    },

    confirmar(solicitudId, actor) {
        exigirPermiso(actor, 'solicitudes.confirmar');
        const solicitud = obtenerSolicitud(solicitudId);
        if (['cancelada', 'rechazada'].includes(solicitud.estado)) {
            throw new Error('No se puede confirmar una solicitud cerrada.');
        }
        validarDisponibilidad(
            Number(solicitud.sala_id),
            solicitud.fecha,
            solicitud.hora_inicio,
            solicitud.hora_fin,
            solicitud.id
        );
        return registrarConfirmacion(solicitud, actor, 'Confirmación manual por coordinación o administración.');
    },

    forzarAceptacion(solicitudId, invitacionId, actor, motivo) {
        exigirPermiso(actor, 'invitaciones.forzar');
        const solicitud = obtenerSolicitud(solicitudId);
        const invitacion = buscarInvitacion(solicitud, invitacionId);
        if (invitacion.estado !== 'pendiente') throw new Error('Solo se puede forzar una invitación pendiente.');
        if (String(motivo || '').trim().length < 8) throw new Error('Registra un motivo de al menos 8 caracteres.');

        const invitaciones = solicitud.invitaciones.map((item) =>
            String(item.id) === String(invitacionId)
                ? { ...item, estado: 'aceptada_por_admin', forzada_por: actor.id, motivo_forzado: motivo.trim() }
                : item
        );
        const actualizada = SolicitudRepo.actualizar(solicitud.id, { invitaciones });
        const solicitudConfirmada = confirmarSiTodasAceptaron(actualizada, actor);
        auditar(actor, 'invitacion_forzada', solicitud.id, motivo.trim());
        return solicitudConfirmada;
    },

    cancelar(solicitudId, actor) {
        exigirPermiso(actor, 'solicitudes.cancelar');
        const solicitud = obtenerSolicitud(solicitudId);
        exigirPropietario(actor, solicitud);
        if (['cancelada', 'rechazada'].includes(solicitud.estado)) throw new Error('La solicitud ya está cerrada.');

        const horasRestantes = (fechaHoraLocal(solicitud.fecha, solicitud.hora_inicio) - Date.now()) / 3600000;
        if (horasRestantes < 24) throw new Error('La política de cancelación requiere al menos 24 horas de anticipación.');

        const actualizada = SolicitudRepo.actualizar(solicitud.id, {
            estado: 'cancelada',
            cancelada_en: new Date().toISOString(),
            cancelada_por: actor.id,
        });
        solicitud.invitaciones.forEach((invitacion) =>
            notificar(invitacion.usuario_id, actualizada, 'solicitud_cancelada',
                `La solicitud «${solicitud.titulo}» fue cancelada.`)
        );
        auditar(actor, 'solicitud_cancelada', solicitud.id, 'Cancelación con más de 24 horas de anticipación.');
        return actualizada;
    },

    notificaciones(actor) {
        if (!actor) return [];
        return Storage.buscar('notificaciones', (item) =>
            Number(item.usuario_id) === Number(actor.id)
        ).sort((a, b) => b.fecha.localeCompare(a.fecha));
    },
};