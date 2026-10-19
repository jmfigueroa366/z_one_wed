// CAPA: Infraestructura
import { Storage } from './storage.ts';
import type { Usuario } from '../models/Usuario.ts';

const CLAVE_SESION = 'sesion';

// Forma de la sesión: id, nombre, email, rol, perfil
export const Session = {
    guardar(usuario: Usuario | null | undefined): Usuario | null {
        if (!usuario || typeof usuario !== 'object') {
            return null;
        }

        Storage.guardarValor(CLAVE_SESION, usuario);
        return usuario;
    },

    obtener(): Usuario | null {
        const sesion = Storage.obtenerValor<Usuario | null>(CLAVE_SESION, null);
        if (!sesion || typeof sesion !== 'object') {
            return null;
        }

        return sesion.nombre || sesion.email ? sesion : null;
    },

    cerrar(): boolean {
        Storage.eliminarValor(CLAVE_SESION);
        return true;
    },

    rol(): string | null {
        const sesion = this.obtener();
        return sesion ? sesion.rol : null;
    },

    perfil(): string | null {
        const sesion = this.obtener();
        return sesion ? sesion.perfil : null;
    },
};

export default Session;
