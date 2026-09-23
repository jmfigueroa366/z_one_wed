//Permisos por rol
import { ROLES, panelDeRol, ACCESOS_PANEL } from './roles.js';
import { RUTAS } from './rutas.js';
import { Session } from './session.js';

export const RouteGuard = {

    //Verifica si el usuario actual tiene uno de los roles permitidos
    tieneRol(rolesPermitidos = []) {
        return Session.rol() !== null && rolesPermitidos.includes(Session.rol());
    },

    //Exige uno de los roles.
    //Ocurre:Sin sesión → redirige al login, Rol incorrecto → lo manda a su propio panel 
    requiereRol(rolesPermitidos = [ROLES.ADMINISTRADOR], destinoNoAutorizado) {
        const usuario = Session.obtener();
        if (!usuario) {
            window.location.href = RUTAS.LOGIN;
            return null;
        }
        if (!rolesPermitidos.includes(usuario.rol)) {
            window.location.href = destinoNoAutorizado || panelDeRol(usuario.rol);
            return null;
        }
        return usuario;
    },

    //Exige acceso a un panel concreto y RouteGuard.requierePanel('admin')
    requierePanel(nombrePanel) {
        const panel = ACCESOS_PANEL[nombrePanel];
        if (!panel) {
            window.location.href = RUTAS.LOGIN;
            return null;
        }

        const usuario = Session.obtener();
        if (!usuario) {
            window.location.href = RUTAS.LOGIN;
            return null;
        }

        if (!panel.roles.includes(usuario.rol)) {
            window.location.href = panelDeRol(usuario.rol);
            return null;
        }
        return usuario;
    },
};