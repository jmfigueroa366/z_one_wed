import { ROLES } from './roles.js';

const INICIO = 'menu_principal.html';

export const NAVEGACION_POR_ROL = {
    [ROLES.ADMINISTRADOR]: [
        {
            grupo: 'Gestión de usuarios',
            items: [
                { etiqueta: 'Inicio', ruta: INICIO },
                { etiqueta: 'Artistas', ruta: 'artistas.html' },
                { etiqueta: 'Productores', ruta: 'productores.html' },
            ],
        },
        {
            grupo: 'Proyectos y producción',
            items: [
                { etiqueta: 'Catálogo musical', ruta: 'catalogo.html' },
                { etiqueta: 'Sesiones', ruta: 'sesiones.html' },
                { etiqueta: 'Agenda', ruta: 'agenda.html' },
            ],
        },
        {
            grupo: 'Control y soporte',
            items: [
                { etiqueta: 'Estadísticas', ruta: 'estadisticas.html' },
                { etiqueta: 'Asistente', ruta: 'chatbot.html' },
                { etiqueta: 'Configuración', ruta: 'configuracion.html' },
            ],
        },
    ],
    [ROLES.CLIENTE]: [
        {
            grupo: 'Mis proyectos',
            items: [
                { etiqueta: 'Resumen', ruta: INICIO },
                { etiqueta: 'Catálogo musical', ruta: 'catalogo.html' },
            ],
        },
        {
            grupo: 'Producción',
            items: [
                { etiqueta: 'Sesiones', ruta: 'sesiones.html' },
                { etiqueta: 'Agenda', ruta: 'agenda.html' },
            ],
        },
        {
            grupo: 'Comunicación',
            items: [
                { etiqueta: 'Asistente', ruta: 'chatbot.html' },
                { etiqueta: 'Configuración', ruta: 'configuracion.html' },
            ],
        },
    ],
    [ROLES.COLABORADOR]: [
        {
            grupo: 'Mi trabajo',
            items: [
                { etiqueta: 'Resumen', ruta: INICIO },
                { etiqueta: 'Artistas', ruta: 'artistas.html' },
                { etiqueta: 'Equipo de producción', ruta: 'productores.html' },
            ],
        },
        {
            grupo: 'Estudio y recursos',
            items: [
                { etiqueta: 'Reserva de salas', ruta: 'sesiones.html' },
                { etiqueta: 'Catálogo musical', ruta: 'catalogo.html' },
                { etiqueta: 'Agenda', ruta: 'agenda.html' },
            ],
        },
        {
            grupo: 'Seguimiento',
            items: [
                { etiqueta: 'Estadísticas', ruta: 'estadisticas.html' },
                { etiqueta: 'Asistente', ruta: 'chatbot.html' },
                { etiqueta: 'Configuración', ruta: 'configuracion.html' },
            ],
        },
    ],
};

export const RUTA_INICIO_POR_ROL = {
    [ROLES.ADMINISTRADOR]: INICIO,
    [ROLES.CLIENTE]: INICIO,
    [ROLES.COLABORADOR]: INICIO,
};