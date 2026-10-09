// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';
import { SEED } from '../data/seed.js';
import { crearSala } from '../models/Sala.js';

const CLAVE = 'salas';

function obtenerListaInicial() {
    return SEED.salas.map((sala, indice) => crearSala({ ...sala, id: indice + 1 }));
}

export const salaRepo = {
    listar() {
        const salas = Storage.obtenerValor(CLAVE, []);
        if (!Array.isArray(salas) || salas.length === 0) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return salas.map((sala, indice) => crearSala({ ...sala, id: sala.id ?? indice + 1 }));
    },

    obtenerPorId(id) {
        return this.listar().find((sala) => String(sala.id ?? sala.nombre) === String(id)) ?? null;
    },

    crear(data) {
        const salas = this.listar();
        const siguienteId = salas.reduce((max, sala) => Math.max(max, Number(sala.id) || 0), 0) + 1;
        const sala = crearSala({ ...data, id: siguienteId });
        salas.push(sala);
        Storage.guardarValor(CLAVE, salas);
        return sala;
    },

    actualizar(id, data) {
        const salas = this.listar();
        const indice = salas.findIndex((sala) => String(sala.id) === String(id));
        if (indice === -1) {
            return null;
        }
        salas[indice] = crearSala({ ...salas[indice], ...data, id: salas[indice].id });
        Storage.guardarValor(CLAVE, salas);
        return salas[indice];
    },

    eliminar(id) {
        const salas = this.listar().filter((sala) => String(sala.id) !== String(id));
        Storage.guardarValor(CLAVE, salas);
        return salas;
    },
};

export default salaRepo;
