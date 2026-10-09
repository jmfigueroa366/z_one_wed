// CAPA: Dominio
import { ROLES } from './roles.js';

export const PERMISOS = Object.freeze({
    VER_DASHBOARD: 'ver_dashboard',
    VER_AGENDA: 'ver_agenda',
    VER_SOLICITUDES: 'ver_solicitudes',
    GESTIONAR_PERMISOS: 'gestionar_permisos',
    GESTIONAR_SESIONES: 'gestionar_sesiones',
    VER_CATALOGO: 'ver_catalogo',
    VER_ESTADISTICAS: 'ver_estadisticas',
    GESTIONAR_USUARIOS: 'gestionar_usuarios',
});

export const permisosPorRol = Object.freeze({
    [ROLES.ADMINISTRADOR]: [
        PERMISOS.VER_DASHBOARD,
        PERMISOS.VER_AGENDA,
        PERMISOS.VER_SOLICITUDES,
        PERMISOS.GESTIONAR_PERMISOS,
        PERMISOS.GESTIONAR_SESIONES,
        PERMISOS.VER_CATALOGO,
        PERMISOS.VER_ESTADISTICAS,
        PERMISOS.GESTIONAR_USUARIOS,
    ],
    [ROLES.COLABORADOR]: [
        PERMISOS.VER_DASHBOARD,
        PERMISOS.VER_AGENDA,
        PERMISOS.VER_SOLICITUDES,
        PERMISOS.GESTIONAR_SESIONES,
        PERMISOS.VER_CATALOGO,
    ],
    [ROLES.CLIENTE]: [
        PERMISOS.VER_DASHBOARD,
        PERMISOS.VER_AGENDA,
        PERMISOS.VER_CATALOGO,
    ],
});

export function permisosDelRol(rol) {
    return permisosPorRol[rol] ?? [];
}

export function puede(rol, permiso) {
    return permisosDelRol(rol).includes(permiso);
}
