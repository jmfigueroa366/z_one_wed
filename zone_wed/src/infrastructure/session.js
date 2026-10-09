// CAPA: Infraestructura
import { Storage } from './storage.js';

const CLAVE_SESION = 'sesion';

// Forma de la sesión: id, nombre, email, rol, perfil
export const Session = {
    guardar(usuario) {
        if (!usuario || typeof usuario !== 'object') {
            return null;
        }

        Storage.guardarValor(CLAVE_SESION, usuario);
        return usuario;
    },

    obtener() {
        const sesion = Storage.obtenerValor(CLAVE_SESION, null);
        if (!sesion || typeof sesion !== 'object') {
            return null;
        }

        return sesion.nombre || sesion.email ? sesion : null;
    },

    cerrar() {
        Storage.eliminarValor(CLAVE_SESION);
        return true;
    },

    rol() {
        const sesion = this.obtener();
        return sesion ? sesion.rol : null;
    },

    perfil() {
        const sesion = this.obtener();
        return sesion ? sesion.perfil : null;
    },
};
