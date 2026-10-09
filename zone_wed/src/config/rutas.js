// CAPA: Dominio
import { ROLES } from './roles.js';

export const RUTAS = Object.freeze({
    LOGIN: '/login',
    REGISTRO: '/register',
    MENU_PRINCIPAL: '/menu-principal',
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
        RUTAS.AGENDA,
        RUTAS.ARTISTAS,
        RUTAS.CATALOGO,
        RUTAS.CHATBOT,
        RUTAS.CONFIGURACION,
        RUTAS.ESTADISTICAS,
        RUTAS.PERMISOS,
        RUTAS.PRODUCTORES,
        RUTAS.SESIONES,
        RUTAS.SOLICITUDES,
    ],
    [ROLES.COLABORADOR]: [
        RUTAS.MENU_PRINCIPAL,
        RUTAS.AGENDA,
        RUTAS.ARTISTAS,
        RUTAS.CATALOGO,
        RUTAS.CHATBOT,
        RUTAS.CONFIGURACION,
        RUTAS.SESIONES,
        RUTAS.SOLICITUDES,
    ],
    [ROLES.CLIENTE]: [
        RUTAS.MENU_PRINCIPAL,
        RUTAS.CATALOGO,
        RUTAS.CONFIGURACION,
        RUTAS.PROYECTOS,
        RUTAS.SESIONES,
        RUTAS.SOLICITUDES,
    ],
});

export function rutasPermitidasPorRol(rol) {
    return rutasPorRol[rol] ?? rutasPorRol[ROLES.CLIENTE];
}

export function rutaEsPermitida(rol, ruta) {
    return rutasPermitidasPorRol(rol).includes(ruta);
}
