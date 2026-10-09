// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';
import { SEED } from '../data/seed.js';
import { crearColaborador } from '../models/Colaborador.js';

const CLAVE = 'colaboradores';

function obtenerListaInicial() {
    return SEED.colaboradores.map((colaborador, indice) =>
        crearColaborador({ ...colaborador, id: colaborador.id ?? indice + 1 })
    );
}

function normalizarLista(colaboradores) {
    return colaboradores.map((colaborador, indice) =>
        crearColaborador({ ...colaborador, id: colaborador.id ?? indice + 1 })
    );
}

export const colaboradorRepo = {
    listar() {
        const colaboradores = Storage.obtenerValor(CLAVE, []);
        if (!Array.isArray(colaboradores) || colaboradores.length === 0) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return normalizarLista(colaboradores);
    },

    obtenerPorId(id) {
        return this.listar().find((colaborador) => String(colaborador.id ?? colaborador.usuario_id) === String(id)) ?? null;
    },

    crear(data) {
        const colaboradores = this.listar();
        const siguienteId = colaboradores.reduce((max, colaborador) => Math.max(max, Number(colaborador.id) || 0), 0) + 1;
        const colaborador = crearColaborador({ ...data, id: siguienteId });
        colaboradores.push(colaborador);
        Storage.guardarValor(CLAVE, colaboradores);
        return colaborador;
    },

    actualizar(id, data) {
        const colaboradores = this.listar();
        const indice = colaboradores.findIndex((colaborador) => String(colaborador.id) === String(id));
        if (indice === -1) {
            return null;
        }
        colaboradores[indice] = crearColaborador({ ...colaboradores[indice], ...data, id: colaboradores[indice].id });
        Storage.guardarValor(CLAVE, colaboradores);
        return colaboradores[indice];
    },

    eliminar(id) {
        const colaboradores = this.listar().filter((colaborador) => String(colaborador.id) !== String(id));
        Storage.guardarValor(CLAVE, colaboradores);
        return colaboradores;
    },
};

export default colaboradorRepo;
