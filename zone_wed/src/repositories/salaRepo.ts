// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearSala } from '../models/Sala.ts';
import type { EntradaSala, Sala } from '../models/Sala.ts';
import { sincronizarTabla } from '../infrastructure/supabaseSync.ts';

const CLAVE = 'salas';

function obtenerListaInicial(): Sala[] {
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
    listar(): Sala[] {
        const salas = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(salas) || !Storage.existeValor(CLAVE)) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return salas.map((sala, indice) => crearSala({ ...sala, id: sala.id ?? indice + 1 }));
    },

    obtenerPorId(id: number | string | null | undefined): Sala | null {
        if (id == null) return null;
        return this.listar().find((sala) => String(sala.id) === String(id)) ?? null;
    },

    crear(data: EntradaSala): Sala {
        const salas = this.listar();
        const siguienteId = generarIdUnico(salas);
        const sala = crearSala({ ...data, id: siguienteId });
        salas.push(sala);
        Storage.guardarValor(CLAVE, salas);
        return sala;
    },

    actualizar(id: number | string, data: EntradaSala): Sala | null {
        const salas = this.listar();
        const indice = salas.findIndex((sala) => String(sala.id) === String(id));
        if (indice === -1) {
            return null;
        }
        salas[indice] = crearSala({ ...salas[indice], ...data, id: salas[indice].id });
        Storage.guardarValor(CLAVE, salas);
        return salas[indice];
    },

    eliminar(id: number | string): Sala[] {
        const salas = this.listar().filter((sala) => String(sala.id) !== String(id));
        Storage.guardarValor(CLAVE, salas);
        return salas;
    },
};

export default salaRepo;