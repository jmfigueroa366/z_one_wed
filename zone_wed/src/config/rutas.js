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
        RUTAS.CONFIGURACION,
    ],
});

export function rutasPermitidasPorRol(rol) {
    return rutasPorRol[rol] ?? rutasPorRol[ROLES.CLIENTE];
}

export function rutaEsPermitida(rol, ruta) {
    return rutasPermitidasPorRol(rol).includes(ruta);
}
