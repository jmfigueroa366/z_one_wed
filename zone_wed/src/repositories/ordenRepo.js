// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';
import { SEED } from '../data/seed.js';
import { crearOrden } from '../models/Orden.js';

const CLAVE = 'ordenes_servicio';

function prefijo(anio) {
    return `ZW-${anio}-`;
}

export function siguienteNumero(ordenes = [], anio = new Date().getFullYear()) {
    const marca = prefijo(anio);
    const maximo = ordenes.reduce((max, orden) => {
        const numero = String(orden?.numero ?? '');
        if (!numero.startsWith(marca)) return max;
        const consecutivo = Number.parseInt(numero.slice(marca.length), 10);
        return Number.isFinite(consecutivo) ? Math.max(max, consecutivo) : max;
    }, 0);
    return `${marca}${String(maximo + 1).padStart(4, '0')}`;
}

function obtenerListaInicial() {
    return SEED.ordenes_servicio.map((orden, indice) => crearOrden({ ...orden, id: indice + 1 }));
}

export const ordenRepo = {
    listar() {
        const ordenes = Storage.obtenerValor(CLAVE, []);
        if (!Array.isArray(ordenes) || ordenes.length === 0) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return ordenes.map((orden, indice) => crearOrden({ ...orden, id: orden.id ?? indice + 1 }));
    },

    obtenerPorId(id) {
        if (id == null) return null;
        return this.listar().find((orden) => String(orden.id) === String(id)) ?? null;
    },

    listarPorUsuario(usuarioId) {
        return this.listar().filter((orden) => String(orden.usuario_id) === String(usuarioId));
    },

    listarPorProyecto(proyectoId) {
        return this.listar().filter((orden) => String(orden.proyecto_id) === String(proyectoId));
    },

    crear(data) {
        const ordenes = this.listar();
        const siguienteId = ordenes.reduce((max, orden) => Math.max(max, Number(orden.id) || 0), 0) + 1;
        const numero = data.numero ?? siguienteNumero(ordenes);
        const orden = crearOrden({ ...data, id: siguienteId, numero });
        ordenes.push(orden);
        Storage.guardarValor(CLAVE, ordenes);
        return orden;
    },

    actualizar(id, data) {
        if (id == null) return null;
        const ordenes = this.listar();
        const indice = ordenes.findIndex((orden) => String(orden.id) === String(id));
        if (indice === -1) {
            return null;
        }
        ordenes[indice] = crearOrden({ ...ordenes[indice], ...data, id: ordenes[indice].id });
        Storage.guardarValor(CLAVE, ordenes);
        return ordenes[indice];
    },

    cancelar(id) {
        return this.actualizar(id, { estado: 'cancelada' });
    },
};

export default ordenRepo;
