// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearSala } from '../models/Sala.ts';
import type { EntradaSala, Sala } from '../models/Sala.ts';
import {
    sincronizarSalas as sincronizarSalasApi,
    idApiDe,
} from '../infrastructure/supabaseSync.ts';
import {
    crearSala as crearSalaApi,
    actualizarSala as actualizarSalaApi,
} from '../api/salasApi.ts';

const CLAVE = 'salas';

function obtenerListaInicial(): Sala[] {
    return SEED.salas.map((sala, indice) =>
        crearSala({ ...sala, id: indice + 1, origen: 'seed' })
    );
}

function normalizarLista(salas: EntradaSala[]): Sala[] {
    return salas.map((sala, indice) => crearSala({ ...sala, id: sala.id ?? indice + 1 }));
}

// Trae las salas reales de la API una vez y las guarda en la caché local.
let sincronizado = false;
export async function sincronizarSalas() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarSalasApi();
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar las salas con la API.', error);
    }
}
export async function refrescarSalas() { sincronizado = false; await sincronizarSalas(); }
// Se ejecuta al cargar el módulo.
sincronizarSalas();

function actualizarCache(salas: Sala[]): void {
    Storage.guardarValor(CLAVE, salas);
}

function aRequest(sala: EntradaSala, base?: Sala) {
    return {
        nombre: String(sala.nombre ?? base?.nombre ?? ''),
        precioHora: Number(sala.precio_hora ?? base?.precio_hora ?? 0),
        activo: sala.activo ?? base?.activo ?? true,
    };
}

export const salaRepo = {
    listar(): Sala[] {
        const salas = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(salas) || !Storage.existeValor(CLAVE)) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return normalizarLista(salas as EntradaSala[]);
    },

    obtenerPorId(id: number | string | null | undefined): Sala | null {
        if (id == null) return null;
        return this.listar().find((sala) => String(sala.id) === String(id)) ?? null;
    },

    async crear(data: EntradaSala): Promise<Sala> {
        const dto = await crearSalaApi(aRequest(data));
        const salas = this.listar();
        const sala = crearSala({
            ...data,
            id: generarIdUnico(salas),
            id_remoto: dto.id,
            nombre: dto.nombre,
            precio_hora: dto.precioHora,
            activo: dto.activo,
            origen: 'usuario',
        });
        salas.push(sala);
        actualizarCache(salas);
        return sala;
    },

    async actualizar(id: number | string, data: EntradaSala): Promise<Sala | null> {
        const salas = this.listar();
        const indice = salas.findIndex((sala) => String(sala.id) === String(id));
        if (indice === -1) {
            return null;
        }

        const salaActual = salas[indice];
        const idApi = idApiDe(salaActual);
        if (idApi == null) {
            throw new Error('La sala no está sincronizada con la API.');
        }

        const dto = await actualizarSalaApi(idApi, aRequest(data, salaActual));
        salas[indice] = crearSala({
            ...salaActual,
            ...data,
            id: salaActual.id,
            id_remoto: dto.id,
            nombre: dto.nombre,
            precio_hora: dto.precioHora,
            activo: dto.activo,
            origen: salaActual.origen ?? 'usuario',
        });
        actualizarCache(salas);
        return salas[indice];
    },

    async eliminar(id: number | string): Promise<Sala[]> {
        const salas = this.listar();
        const indice = salas.findIndex((sala) => String(sala.id) === String(id));
        if (indice === -1) {
            return salas;
        }

        const salaActual = salas[indice];
        const idApi = idApiDe(salaActual);
        if (idApi == null) {
            throw new Error('La sala no está sincronizada con la API.');
        }

        const dto = await actualizarSalaApi(idApi, aRequest({ activo: false }, salaActual));
        salas[indice] = crearSala({
            ...salaActual,
            id: salaActual.id,
            id_remoto: dto.id,
            nombre: dto.nombre,
            precio_hora: dto.precioHora,
            activo: dto.activo,
            origen: salaActual.origen ?? 'usuario',
        });
        actualizarCache(salas);
        return salas;
    },
};
