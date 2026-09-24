import { Storage } from "./storage.js";

const CLAVE_SESION = 'sesion';

//Forma de la sesion: id, nombre, email, rol, perfil
export const Session = {
    
    //Guarda el usuario logueado (sincronizando con ambas claves)
    guardar(usuario) {
        Storage.guardarValor(CLAVE_SESION, usuario);
        if (usuario && usuario.nombre) {
            localStorage.setItem('zone_usuario', usuario.nombre);
        }
        if (usuario && usuario.rol) {
            localStorage.setItem('zone_rol_usuario', usuario.rol);
        }
    },

    //Devuelve el usuario de la sesion o null
    obtener() {
        const sesion = Storage.obtenerValor(CLAVE_SESION);
        if (sesion && sesion.nombre) {
            return sesion;
        }
        // Respaldo de compatibilidad
        const legacyUsuario = localStorage.getItem('zone_usuario');
        const legacyRol = localStorage.getItem('zone_rol_usuario') || 'cliente';
        if (legacyUsuario) {
            return {
                id: null,
                nombre: legacyUsuario,
                email: '',
                rol: legacyRol,
                perfil: null
            };
        }
        return null;
    },

    //Cierre de sesion
    cerrar() {
        Storage.eliminarValor(CLAVE_SESION);
        localStorage.removeItem('zone_usuario');
        localStorage.removeItem('zone_rol_usuario');
    },

    //Leer el rol o el perfil
    rol() {
        const sesion = this.obtener();
        return sesion ? sesion.rol : null;
    },

    perfil() {
        const sesion = this.obtener();
        return sesion ? sesion.perfil : null;
    },
};