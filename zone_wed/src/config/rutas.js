// CAPA: Dominio
import { ROLES } from './roles.js';

export const RUTAS = Object.freeze({
    LOGIN: '/login',
    REGISTRO: '/register',
    MENU_PRINCIPAL: '/menu-principal',
    ESTUDIO: '/estudio',
    AGENDA: '/agenda',
    ARTISTAS: '/artistas',
    CATALOGO: '/catalogo',
    CHATBOT: '/chatbot',
    CONFIGURACION: '/configuracion',
    ESTADISTICAS: '/estadisticas',
    PERMISOS: '/permisos',
    PRODUCTORES: '/productores',
    PROYECTOS: '/proyectos',
    SESIONES: '/sesiones',
    SOLICITUDES: '/solicitudes',
});

export const rutasPorRol = Object.freeze({
    [ROLES.ADMINISTRADOR]: [
        RUTAS.MENU_PRINCIPAL,
        RUTAS.ESTUDIO,
        RUTAS.AGENDA,
        RUTAS.SOLICITUDES,
        RUTAS.SESIONES,
        RUTAS.PROYECTOS,
        RUTAS.ARTISTAS,
        RUTAS.PRODUCTORES,
        RUTAS.CATALOGO,
        RUTAS.ESTADISTICAS,
        RUTAS.PERMISOS,
        RUTAS.CHATBOT,
        RUTAS.CONFIGURACION,
    ],
    [ROLES.COLABORADOR]: [
        RUTAS.MENU_PRINCIPAL,
        RUTAS.ESTUDIO,
        RUTAS.AGENDA,
        RUTAS.SOLICITUDES,
        RUTAS.SESIONES,
        RUTAS.PROYECTOS,
        RUTAS.CATALOGO,
        RUTAS.CHATBOT,
        RUTAS.CONFIGURACION,
    ],
    [ROLES.COORDINADOR]: [
        RUTAS.MENU_PRINCIPAL,
        RUTAS.ESTUDIO,
        RUTAS.AGENDA,
        RUTAS.SOLICITUDES,
        RUTAS.SESIONES,
        RUTAS.PROYECTOS,
        RUTAS.CATALOGO,
        RUTAS.CHATBOT,
        RUTAS.CONFIGURACION,
    ],
    [ROLES.CLIENTE]: [
        RUTAS.MENU_PRINCIPAL,
        RUTAS.ESTUDIO,
        RUTAS.AGENDA,
        RUTAS.SOLICITUDES,
        RUTAS.SESIONES,
        RUTAS.PROYECTOS,
        RUTAS.CATALOGO,
        RUTAS.CHATBOT,
        RUTAS.CONFIGURACION,
    ],
});

export const NAVEGACION = Object.freeze([
    {
        titulo: 'Principal',
        items: [
            { ruta: RUTAS.MENU_PRINCIPAL, etiqueta: 'Inicio', icono: 'Home' },
            { ruta: RUTAS.ESTUDIO, etiqueta: 'Escuchar artistas', icono: 'Music2' },
            { ruta: RUTAS.AGENDA, etiqueta: 'Agenda', icono: 'CalendarDays' },
        ],
    },
    {
        titulo: 'Operación',
        items: [
            { ruta: RUTAS.SOLICITUDES, etiqueta: 'Solicitudes', icono: 'Inbox', badge: 'pendientes' },
            { ruta: RUTAS.SESIONES, etiqueta: 'Sesiones', icono: 'Radio' },
            { ruta: RUTAS.PROYECTOS, etiqueta: 'Mis proyectos', icono: 'FolderKanban' },
        ],
    },
    {
        titulo: 'Estudio',
        items: [
            { ruta: RUTAS.ARTISTAS, etiqueta: 'Artistas', icono: 'Mic2' },
            { ruta: RUTAS.PRODUCTORES, etiqueta: 'Productores', icono: 'SlidersHorizontal' },
            { ruta: RUTAS.CATALOGO, etiqueta: 'Catálogo', icono: 'LayoutGrid' },
        ],
    },
    {
        titulo: 'Administración',
        items: [
            { ruta: RUTAS.ESTADISTICAS, etiqueta: 'Estadísticas', icono: 'BarChart3' },
            { ruta: RUTAS.PERMISOS, etiqueta: 'Permisos', icono: 'ShieldCheck' },
        ],
    },
    {
        titulo: 'Sistema',
        items: [
            { ruta: RUTAS.CHATBOT, etiqueta: 'Chatbot', icono: 'Bot' },
            { ruta: RUTAS.CONFIGURACION, etiqueta: 'Configuración', icono: 'Settings' },
        ],
    },
]);

export function rutasPermitidasPorRol(rol) {
    return rutasPorRol[rol] ?? rutasPorRol[ROLES.CLIENTE];
}

export function rutaEsPermitida(rol, ruta) {
    return rutasPermitidasPorRol(rol).includes(ruta);
}
