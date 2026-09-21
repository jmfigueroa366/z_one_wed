import { Storage } from "./storage.js";

const CLAVE_SESION = 'sesion';

//Forma de la sesion: id, nombre, email, rol, perfil
export const Session = {
    
    //Guarda el usuario logueado
    guardar(usuario) {
        Storage.guardarValor(CLAVE_SESION, usuario);
    },

    //Devuelve el usuario de la sesion o null
    obtener() {
        const sesion = Storage.obtenerValor(CLAVE_SESION);
        return sesion && sesion.nombre ? sesion : null;
    },

    //Cierre de sesion
    cerrar() {
        Storage.eliminarValor(CLAVE_SESION);
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