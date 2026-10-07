import { Auth } from './auth.js';
import { MATRIZ_PERMISOS, ROLES, ETIQUETAS_ROL } from './roles.js';
import { SolicitudService } from './solicitudService.js';
import { Storage } from './storage.js';

const actor = Auth.requierePanel('operaciones');
const roles = Object.values(ROLES);
const head = document.getElementById('permissionHead');
const body = document.getElementById('permissionBody');
const activity_body = document.getElementById('activityBody');

const eventos_notificacion = [
    ['Solicitud creada', 'Cada colaborador invitado y quien la creó', 'invitacion_nueva'],
    ['Invitación aceptada o rechazada', 'Quien creó la solicitud', 'invitacion_aceptada / invitacion_rechazada'],
    ['Contraoferta enviada', 'Quien creó la solicitud', 'contraoferta_nueva'],
    ['Contraoferta aceptada', 'Colaborador que la envió', 'contraoferta_aceptada'],
    ['Solicitud confirmada', 'Quien creó la solicitud', 'solicitud_confirmada'],
    ['Solicitud cancelada', 'Colaboradores invitados', 'solicitud_cancelada'],
];

function createCell(tag, text, class_name = '') {
    const cell = document.createElement(tag);
    cell.textContent = text;
    if (class_name) cell.className = class_name;
    return cell;
}

function renderPermissionMatrix() {
    const header_row = document.createElement('tr');
    header_row.appendChild(createCell('th', 'Capacidad'));

    roles.forEach((role) => {
        const heading = createCell('th', ETIQUETAS_ROL[role], role === actor.rol ? 'is-current-role' : '');
        heading.scope = 'col';
        header_row.appendChild(heading);
    });

    const table_head = document.createElement('thead');
    table_head.appendChild(header_row);
    head.replaceWith(table_head);
    table_head.id = 'permissionHead';

    MATRIZ_PERMISOS.forEach((permission) => {
        const row = document.createElement('tr');
        row.appendChild(createCell('th', permission.etiqueta, 'permission-label'));

        roles.forEach((role) => {
            const granted = permission.roles.includes(role);
            const cell = createCell('td', granted ? 'Permitido' : 'Sin acceso', [
                granted ? 'permission-allowed' : 'permission-denied',
                role === actor.rol ? 'is-current-role' : '',
            ].filter(Boolean).join(' '));
            cell.setAttribute('aria-label', `${ETIQUETAS_ROL[role]}: ${granted ? 'permitido' : 'sin acceso'}`);
            row.appendChild(cell);
        });

        body.appendChild(row);
    });
}

function renderNotificationRules() {
    const table = document.createElement('table');
    table.className = 'permission-table notification-table';
    const header = document.createElement('thead');
    const header_row = document.createElement('tr');
    ['Disparador', 'Destinatario', 'Evento'].forEach((label) => header_row.appendChild(createCell('th', label)));
    header.appendChild(header_row);
    table.appendChild(header);

    const table_body = document.createElement('tbody');
    eventos_notificacion.forEach(([trigger, recipient, event_name]) => {
        const row = document.createElement('tr');
        [trigger, recipient, event_name].forEach((value) => row.appendChild(createCell('td', value)));
        table_body.appendChild(row);
    });
    table.appendChild(table_body);

    const container = document.createElement('section');
    container.className = 'panel-card notification-rules-panel';
    const section_header = document.createElement('div');
    section_header.className = 'section-heading';
    const eyebrow = createCell('p', 'AVISOS DEL SISTEMA', 'eyebrow small');
    const title = createCell('h2', 'Reglas de notificación');
    section_header.append(eyebrow, title);
    const scroll = document.createElement('div');
    scroll.className = 'table-scroll';
    scroll.appendChild(table);
    container.append(section_header, scroll);
    document.querySelector('.audit-preview-panel').before(container);
}

function renderActivity() {
    const user_notifications = SolicitudService.notificaciones(actor);
    const activity = actor.rol === ROLES.ADMINISTRADOR
        ? Storage.obtenerTodos('auditoria').sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 12)
        : user_notifications.slice(0, 12).map((item) => ({
            fecha: item.fecha,
            accion: item.tipo,
            rol: 'notificación',
            detalle: item.mensaje,
        }));

    if (!activity.length) {
        const row = document.createElement('tr');
        const cell = createCell('td', 'Todavía no hay actividad registrada.', 'empty-state');
        cell.colSpan = 4;
        row.appendChild(cell);
        activity_body.appendChild(row);
        return;
    }

    activity.forEach((entry) => {
        const row = document.createElement('tr');
        const date = new Date(entry.fecha);
        const formatted_date = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
        row.appendChild(createCell('td', formatted_date));
        row.appendChild(createCell('td', entry.accion || entry.tipo || 'Actividad'));
        row.appendChild(createCell('td', entry.rol ? ETIQUETAS_ROL[entry.rol] || entry.rol : 'Notificación'));
        row.appendChild(createCell('td', entry.detalle || ''));
        activity_body.appendChild(row);
    });
}

if (actor) {
    document.getElementById('permissionsTitle').textContent = actor.rol === ROLES.ADMINISTRADOR
        ? 'Matriz de permisos'
        : 'Mis permisos';
    document.getElementById('sidebarRole').textContent = ETIQUETAS_ROL[actor.rol];
    renderPermissionMatrix();
    renderNotificationRules();
    renderActivity();
}