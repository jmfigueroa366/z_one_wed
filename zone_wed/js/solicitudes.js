import { Auth } from './auth.js';
import { ROLES, etiquetaRol, tienePermiso } from './roles.js';
import { SolicitudService } from './solicitudService.js';

const actor = Auth.requierePanel('operaciones');
const form_panel = document.getElementById('requestFormPanel');
const form = document.getElementById('requestForm');
const list = document.getElementById('requestList');
const filter = document.getElementById('requestFilter');
const message = document.getElementById('operationMessage');
const notification_list = document.getElementById('notificationList');
const own_invitations = actor?.rol === ROLES.COLABORADOR
    ? SolicitudService.invitacionesPropias(actor)
    : [];

function appendText(parent, tag, text, class_name = '') {
    const element = document.createElement(tag);
    element.textContent = text;
    if (class_name) element.className = class_name;
    parent.appendChild(element);
    return element;
}

function formatDate(date) {
    const value = new Date(`${date}T12:00:00`);
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(value);
}

function showMessage(text, is_error = false) {
    message.textContent = text;
    message.classList.toggle('is-error', is_error);
    message.classList.toggle('is-success', !is_error);
}

function stateLabel(state) {
    return ({
        solicitud: 'Por revisar',
        en_negociacion: 'En negociación',
        confirmada: 'Confirmada',
        rechazada: 'Rechazada',
        cancelada: 'Cancelada',
        expirada: 'Expirada',
    })[state] || state;
}

function setUpForm() {
    const puede_crear = tienePermiso(actor.rol, 'solicitudes.crear');
    form_panel.hidden = !puede_crear;
    if (!puede_crear) return;

    const date_input = document.getElementById('requestDate');
    date_input.min = new Date().toLocaleDateString('en-CA');

    const room_select = document.getElementById('requestRoom');
    SolicitudService.salasDisponibles().forEach((room) => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `${room.nombre} · ${new Intl.NumberFormat('es-CO').format(room.precio_hora)} / hora`;
        room_select.appendChild(option);
    });

    const collaborator_select = document.getElementById('requestCollaborators');
    SolicitudService.colaboradoresDisponibles().forEach((collaborator) => {
        const option = document.createElement('option');
        option.value = collaborator.id;
        option.textContent = `${collaborator.nombre} · ${collaborator.especialidad}`;
        collaborator_select.appendChild(option);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const selected = [...collaborator_select.selectedOptions].map((option) => option.value);

        try {
            SolicitudService.crear({
                titulo: document.getElementById('requestTitle').value,
                fecha: date_input.value,
                hora_inicio: document.getElementById('requestStart').value,
                hora_fin: document.getElementById('requestEnd').value,
                sala_id: room_select.value,
                colaborador_ids: selected,
                tarifa_ofrecida: document.getElementById('requestRate').value,
                mensaje: document.getElementById('requestMessage').value,
            }, actor);
            form.reset();
            showMessage('Solicitud creada. El equipo invitado ya puede responder.', false);
            render();
        } catch (error) {
            showMessage(error.message, true);
        }
    });
}

function invitationCard(solicitud, invitacion, card) {
    const invitation = appendText(card, 'div', '', 'invitation-row');
    const description = invitacion.especialidad
        ? `${invitacion.colaborador} · ${invitacion.especialidad}`
        : invitacion.colaborador;
    appendText(invitation, 'strong', description || 'Colaborador invitado');

    const state = invitacion.estado === 'contraoferta'
        ? `Contraoferta · ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(invitacion.contraoferta?.tarifa || 0)}`
        : stateLabel(invitacion.estado);
    appendText(invitation, 'span', state, `status-pill status-${invitacion.estado}`);

    if (invitacion.mensaje) appendText(invitation, 'p', invitacion.mensaje, 'invitation-message');
    if (invitacion.vence_en && invitacion.estado === 'pendiente') {
        appendText(invitation, 'small', `Responde antes del ${formatDate(invitacion.vence_en.slice(0, 10))}.`, 'field-hint');
    }

    const es_invitado = Number(invitacion.usuario_id) === Number(actor.id);
    const es_propietario = Number(solicitud.creado_por_usuario_id) === Number(actor.id);

    if (es_invitado && invitacion.estado === 'pendiente' && tienePermiso(actor.rol, 'invitaciones.responder')) {
        const actions = appendText(invitation, 'div', '', 'inline-actions');
        actionButton(actions, 'Aceptar', () => runAction(() =>
            SolicitudService.responderInvitacion(solicitud.id, invitacion.id, 'aceptada', actor)));
        actionButton(actions, 'Rechazar', () => runAction(() =>
            SolicitudService.responderInvitacion(solicitud.id, invitacion.id, 'rechazada', actor), true), 'button-secondary');
        actionButton(actions, 'Contraofertar', () => showCounterOffer(invitation, solicitud, invitacion), 'button-secondary');
    }

    if (es_propietario && invitacion.estado === 'contraoferta' && tienePermiso(actor.rol, 'contraofertas.aceptar')) {
        actionButton(invitation, 'Aceptar contraoferta', () => runAction(() =>
            SolicitudService.aceptarContraoferta(solicitud.id, invitacion.id, actor)));
    }

    if (actor.rol === ROLES.ADMINISTRADOR && invitacion.estado === 'pendiente') {
        actionButton(invitation, 'Forzar aceptación', () => {
            const reason = window.prompt('Motivo de la excepción administrativa:');
            if (reason !== null) runAction(() =>
                SolicitudService.forzarAceptacion(solicitud.id, invitacion.id, actor, reason));
        }, 'button-secondary');
    }
}

function showCounterOffer(parent, solicitud, invitacion) {
    const form_element = document.createElement('form');
    form_element.className = 'counteroffer-form';

    const rate = document.createElement('input');
    rate.type = 'number';
    rate.min = '1';
    rate.step = '1';
    rate.placeholder = 'Nueva tarifa (COP)';
    rate.required = true;
    rate.setAttribute('aria-label', 'Nueva tarifa propuesta');

    const note = document.createElement('input');
    note.type = 'text';
    note.maxLength = 240;
    note.placeholder = 'Mensaje para el cliente';
    note.setAttribute('aria-label', 'Mensaje de la contraoferta');

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'button-secondary';
    submit.textContent = 'Enviar contraoferta';

    form_element.append(rate, note, submit);
    form_element.addEventListener('submit', (event) => {
        event.preventDefault();
        runAction(() => SolicitudService.contraofertar(
            solicitud.id, invitacion.id, rate.value, note.value, actor
        ));
    });
    parent.appendChild(form_element);
}

function actionButton(parent, label, action, class_name = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `request-action ${class_name}`.trim();
    button.textContent = label;
    button.addEventListener('click', action);
    parent.appendChild(button);
    return button;
}

function runAction(action, neutral = false) {
    try {
        action();
        showMessage(neutral ? 'La invitación fue actualizada.' : 'Cambios guardados correctamente.', false);
        render();
    } catch (error) {
        showMessage(error.message, true);
    }
}

function renderCard(solicitud) {
    const card = document.createElement('article');
    card.className = 'request-card';

    const header = appendText(card, 'div', '', 'request-card-header');
    const title_group = appendText(header, 'div', '', 'request-card-title');
    appendText(title_group, 'p', solicitud.sala_nombre || 'Producción musical', 'eyebrow small');
    appendText(title_group, 'h3', solicitud.titulo);
    appendText(header, 'span', stateLabel(solicitud.estado), `status-pill status-${solicitud.estado}`);

    const details = appendText(card, 'div', '', 'request-details');
    appendText(details, 'span', `${formatDate(solicitud.fecha)} · ${solicitud.hora_inicio}–${solicitud.hora_fin}`);
    appendText(details, 'span', `Solicitó ${solicitud.creado_por || 'un usuario'}`);

    if (solicitud.invitaciones.length) {
        const invitations = appendText(card, 'div', '', 'invitation-list');
        solicitud.invitaciones.forEach((invitation) => invitationCard(solicitud, invitation, invitations));
    }

    if (tienePermiso(actor.rol, 'solicitudes.confirmar') && !['confirmada', 'cancelada', 'rechazada'].includes(solicitud.estado)) {
        actionButton(card, 'Confirmar solicitud', () => runAction(() =>
            SolicitudService.confirmar(solicitud.id, actor)));
    }

    if (Number(solicitud.creado_por_usuario_id) === Number(actor.id) &&
        tienePermiso(actor.rol, 'solicitudes.cancelar') &&
        !['cancelada', 'rechazada'].includes(solicitud.estado)) {
        actionButton(card, 'Cancelar', () => runAction(() =>
            SolicitudService.cancelar(solicitud.id, actor), true), 'button-secondary');
    }

    return card;
}

function renderNotifications() {
    notification_list.replaceChildren();
    const notifications = SolicitudService.notificaciones(actor).slice(0, 8);

    if (!notifications.length) {
        appendText(notification_list, 'li', 'No tienes novedades todavía.', 'empty-state');
        return;
    }

    notifications.forEach((notification) => {
        const item = appendText(notification_list, 'li', '', 'notification-item');
        appendText(item, 'strong', notification.mensaje);
        appendText(item, 'time', new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notification.fecha)));
    });
}

function render() {
    const all = SolicitudService.listar(actor);
    const selected_filter = filter.value;
    const own = actor.rol === ROLES.COLABORADOR
        ? own_invitations.map((item) => item.solicitud.id)
        : [];
    const visible = all
        .filter((solicitud) => selected_filter === 'todas' || solicitud.estado === selected_filter)
        .filter((solicitud) => actor.rol !== ROLES.COLABORADOR ||
            own.includes(solicitud.id) || Number(solicitud.creado_por_usuario_id) === Number(actor.id));

    list.replaceChildren();
    document.getElementById('requestCount').textContent = String(visible.length);

    if (!visible.length) {
        appendText(list, 'p', 'No hay solicitudes para este filtro.', 'empty-state');
    } else {
        visible.forEach((solicitud) => list.appendChild(renderCard(solicitud)));
    }

    renderNotifications();
}

function configureRoleView() {
    const title = document.getElementById('pageTitle');
    const description = document.getElementById('pageDescription');
    const heading = document.getElementById('listHeading');
    const role_label = document.getElementById('workspaceEyebrow');

    if (actor.rol === ROLES.COLABORADOR) {
        title.textContent = 'Invitaciones y mi trabajo';
        description.textContent = 'Responde a proyectos, acuerda tu tarifa y consulta tus solicitudes.';
        heading.textContent = 'Mis invitaciones y solicitudes';
        role_label.textContent = 'MI ACTIVIDAD';
    } else if (actor.rol === ROLES.CLIENTE) {
        title.textContent = 'Mis proyectos';
        description.textContent = 'Crea solicitudes y sigue las respuestas de tu equipo de producción.';
        heading.textContent = 'Mis solicitudes';
        role_label.textContent = 'PROYECTOS';
    } else {
        title.textContent = actor.rol === ROLES.ADMINISTRADOR ? 'Operación global' : 'Solicitudes operativas';
        description.textContent = 'Revisa el estado de cada invitación y confirma la agenda cuando sea necesario.';
        heading.textContent = 'Solicitudes del estudio';
        role_label.textContent = 'OPERACIÓN';
    }

    document.getElementById('sidebarRole').textContent = etiquetaRol(actor.rol);
}

if (actor) {
    configureRoleView();
    setUpForm();
    filter.addEventListener('change', render);
    render();
}