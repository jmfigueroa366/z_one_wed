//Las páginas escriben una sola cosa (import { Auth }) y cada responsabilidad vive en su propio archivo.

import {
    ROLES,
    ETIQUETAS_ROL,
    PERFILES_COLABORADOR,
    etiquetaRol,
    etiquetaPerfil,
    puedeAcceder,
    panelDeRol,
    esRolValido,
    esPerfilValido,
} from './roles.js';
import { Session } from './session.js';
import { RouteGuard } from './route-guard.js';
import { RUTAS } from './rutas.js';

export { ROLES, ETIQUETAS_ROL, PERFILES_COLABORADOR };

export const Auth = {

    //Sesion
    usuarioActual: () => Session.obtener(),
    iniciarSesion: (usuario) => Session.guardar(usuario),
    estaAutenticado: () => Session.obtener() !== null,

    // Cierra la sesión (solo borra la sesión, sin navegar)
    cerrarSesion() {
        Session.cerrar();
    },

    // Cierra sesión y va al login
    cerrarSesionYRedirigir() {
        Session.cerrar();
        window.location.href = RUTAS.LOGIN;
    },

    //Roles y guardia
    tieneRol: (rolesPermitidos) => RouteGuard.tieneRol(rolesPermitidos),
    requiereRol: (rolesPermitidos, destinoNoAutorizado) =>
        RouteGuard.requiereRol(rolesPermitidos, destinoNoAutorizado),
    requierePanel: (nombrePanel) => RouteGuard.requierePanel(nombrePanel),

    //Etiquetas y utilidades
    etiquetaRol,
    etiquetaPerfil,
    puedeAcceder,
    panelDeRol,
    esRolValido,
    esPerfilValido,
};