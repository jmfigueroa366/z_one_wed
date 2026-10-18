// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';
import { SEED } from '../data/seed.js';
import { crearSala } from '../models/Sala.js';
import { sincronizarTabla } from '../infrastructure/supabaseSync.js';

const CLAVE = 'salas';

function obtenerListaInicial() {
    return SEED.salas.map((sala, indice) => crearSala({ ...sala, id: indice + 1 }));
}

// Trae las salas reales de Supabase una vez y las guarda en la caché local.
let sincronizado = false;
export async function sincronizarSalas() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarTabla('salas', CLAVE);
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar las salas con Supabase.', error);
    }
}

// Se ejecuta al cargar el módulo.
sincronizarSalas();

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
        if (id == null) return null;
        return this.listar().find((sala) => String(sala.id) === String(id)) ?? null;
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