// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';
import { SEED } from '../data/seed.js';
import { crearSesion } from '../models/Sesion.js';

const CLAVE = 'sesiones';

function obtenerListaInicial() {
    return SEED.sesiones.map((sesion, indice) => crearSesion({ ...sesion, id: indice + 1 }));
}

export const sesionRepo = {
    listar() {
        const sesiones = Storage.obtenerValor(CLAVE, []);
        if (!Array.isArray(sesiones) || sesiones.length === 0) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return sesiones.map((sesion, indice) => crearSesion({ ...sesion, id: sesion.id ?? indice + 1 }));
    },

    obtenerPorId(id) {
        return this.listar().find((sesion) => String(sesion.id ?? sesion.titulo) === String(id)) ?? null;
    },

    crear(data) {
        const sesiones = this.listar();
        const siguienteId = sesiones.reduce((max, sesion) => Math.max(max, Number(sesion.id) || 0), 0) + 1;
        const sesion = crearSesion({ ...data, id: siguienteId });
        sesiones.push(sesion);
        Storage.guardarValor(CLAVE, sesiones);
        return sesion;
    },

    actualizar(id, data) {
        const sesiones = this.listar();
        const indice = sesiones.findIndex((sesion) => String(sesion.id) === String(id));
        if (indice === -1) {
            return null;
        }
        sesiones[indice] = crearSesion({ ...sesiones[indice], ...data, id: sesiones[indice].id });
        Storage.guardarValor(CLAVE, sesiones);
        return sesiones[indice];
    },

    eliminar(id) {
        const sesiones = this.listar().filter((sesion) => String(sesion.id) !== String(id));
        Storage.guardarValor(CLAVE, sesiones);
        return sesiones;
    },
};

export default sesionRepo;
