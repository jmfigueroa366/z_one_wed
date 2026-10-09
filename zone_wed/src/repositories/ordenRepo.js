// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';
import { SEED } from '../data/seed.js';
import { crearOrden } from '../models/Orden.js';

const CLAVE = 'ordenes';

function obtenerListaInicial() {
    return SEED.ordenes_servicio.map((orden) => crearOrden(orden));
}

export const ordenRepo = {
    listar() {
        const ordenes = Storage.obtenerValor(CLAVE, []);
        if (!Array.isArray(ordenes) || ordenes.length === 0) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return ordenes.map((orden) => crearOrden(orden));
    },

    obtenerPorId(id) {
        return this.listar().find((orden) => String(orden.id ?? orden.sesion_id) === String(id)) ?? null;
    },

    crear(data) {
        const ordenes = this.listar();
        const siguienteId = ordenes.reduce((max, orden) => Math.max(max, Number(orden.id) || 0), 0) + 1;
        const orden = crearOrden({ ...data, id: siguienteId });
        ordenes.push(orden);
        Storage.guardarValor(CLAVE, ordenes);
        return orden;
    },

    actualizar(id, data) {
        const ordenes = this.listar();
        const indice = ordenes.findIndex((orden) => String(orden.id) === String(id));
        if (indice === -1) {
            return null;
        }
        ordenes[indice] = crearOrden({ ...ordenes[indice], ...data, id: ordenes[indice].id });
        Storage.guardarValor(CLAVE, ordenes);
        return ordenes[indice];
    },

    eliminar(id) {
        const ordenes = this.listar().filter((orden) => String(orden.id) !== String(id));
        Storage.guardarValor(CLAVE, ordenes);
        return ordenes;
    },
};

export default ordenRepo;
