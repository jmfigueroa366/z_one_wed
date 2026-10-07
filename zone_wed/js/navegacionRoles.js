import { ROLES } from './roles.js';

const INICIO = 'menu_principal.html';

export const NAVEGACION_POR_ROL = {
    [ROLES.ADMINISTRADOR]: [
        {
            grupo: 'Operación',
            items: [
                { etiqueta: 'Inicio', ruta: INICIO },
                { etiqueta: 'Solicitudes', ruta: 'solicitudes.html', permiso: 'solicitudes.leer_global' },
                { etiqueta: 'Matriz de permisos', ruta: 'permisos.html' },
            ],
        },
        {
            grupo: 'Personas y producción',
            items: [
                { etiqueta: 'Colaboradores', ruta: 'productores.html', permiso: 'colaboradores.aprobar' },
                { etiqueta: 'Canciones y etapas', ruta: 'catalogo.html', permiso: 'proyectos.leer_global' },
                { etiqueta: 'Agenda global', ruta: 'agenda.html', permiso: 'agenda.global' },
            ],
        },
        {
            grupo: 'Control',
            items: [
                { etiqueta: 'Estadísticas', ruta: 'estadisticas.html', permiso: 'proyectos.leer_global' },
                { etiqueta: 'Auditoría', ruta: 'configuracion.html', permiso: 'auditoria.leer' },
            ],
        },
    ],
    [ROLES.COORDINADOR]: [
        {
            grupo: 'Operación',
            items: [
                { etiqueta: 'Inicio', ruta: INICIO },
                { etiqueta: 'Solicitudes', ruta: 'solicitudes.html', permiso: 'solicitudes.leer_global' },
                { etiqueta: 'Agenda global', ruta: 'agenda.html', permiso: 'agenda.global' },
            ],
        },
        {
            grupo: 'Producción',
            items: [
                { etiqueta: 'Proyectos', ruta: 'catalogo.html', permiso: 'proyectos.leer_global' },
                { etiqueta: 'Estadísticas parciales', ruta: 'estadisticas.html', permiso: 'proyectos.leer_global' },
                { etiqueta: 'Matriz de permisos', ruta: 'permisos.html' },
            ],
        },
    ],
    [ROLES.CLIENTE]: [
        {
            grupo: 'Mis proyectos',
            items: [
                { etiqueta: 'Resumen', ruta: INICIO },
                { etiqueta: 'Nueva solicitud', ruta: 'solicitudes.html', permiso: 'solicitudes.crear' },
                { etiqueta: 'Mis solicitudes', ruta: 'solicitudes.html', permiso: 'solicitudes.leer_propias' },
            ],
        },
        {
            grupo: 'Producción',
            items: [
                { etiqueta: 'Catálogo musical', ruta: 'catalogo.html', permiso: 'entregables.revisar' },
                { etiqueta: 'Mi agenda', ruta: 'agenda.html', permiso: 'agenda.propia' },
            ],
        },
        {
            grupo: 'Cuenta',
            items: [
                { etiqueta: 'Mis permisos', ruta: 'permisos.html' },
            ],
        },
    ],
    [ROLES.COLABORADOR]: [
        {
            grupo: 'Mi trabajo',
            items: [
                { etiqueta: 'Resumen', ruta: INICIO },
                { etiqueta: 'Mis invitaciones', ruta: 'solicitudes.html', permiso: 'invitaciones.responder' },
                { etiqueta: 'Nueva solicitud', ruta: 'solicitudes.html', permiso: 'solicitudes.crear' },
            ],
        },
        {
            grupo: 'Producción',
            items: [
                { etiqueta: 'Mis etapas y tareas', ruta: 'catalogo.html', permiso: 'entregables.subir' },
                { etiqueta: 'Mi agenda', ruta: 'agenda.html', permiso: 'agenda.propia' },
            ],
        },
        {
            grupo: 'Cuenta',
            items: [
                { etiqueta: 'Mis permisos', ruta: 'permisos.html' },
            ],
        },
    ],
};

export const RUTA_INICIO_POR_ROL = {
    [ROLES.ADMINISTRADOR]: INICIO,
    [ROLES.COORDINADOR]: INICIO,
    [ROLES.CLIENTE]: INICIO,
    [ROLES.COLABORADOR]: INICIO,
};