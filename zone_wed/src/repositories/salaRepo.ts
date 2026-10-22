// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearSala } from '../models/Sala.ts';
import type { EntradaSala, Sala } from '../models/Sala.ts';
import {
    sincronizarSalas as sincronizarSalasRemotas,
    eliminarFilaRemota,
    idRemoto,
    hayConexionSupabase,
    claveSala,
    insertarSala,
    actualizarSala,
    cambiosDeSala,
    registrarIdRemoto,
    recordarIdRemoto,
} from '../infrastructure/supabaseSync.ts';

const CLAVE = 'salas';

function obtenerListaInicial(): Sala[] {
    return SEED.salas.map((sala, indice) =>
        crearSala({ ...sala, id: indice + 1, origen: 'seed' })
    );
}

function normalizarLista(salas: EntradaSala[]): Sala[] {
    return salas.map((sala, indice) => crearSala({ ...sala, id: sala.id ?? indice + 1 }));
}

// Trae las salas reales de Supabase una vez y las guarda en la cachÃ© local.
let sincronizado = false;
export async function sincronizarSalas() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarSalasRemotas();
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar las salas con Supabase.', error);
    }
}

// Se ejecuta al cargar el mÃ³dulo.
sincronizarSalas();

function actualizarCache(salas: Sala[]): void {
    Storage.guardarValor(CLAVE, salas);
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
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexiÃ³n con Supabase. No se puede guardar la sala.');
        }

        const salaBase = crearSala({ ...data, origen: 'usuario', activo: data?.activo !== false });
        const { id: idRemotoSala } = await insertarSala(salaBase);

        const salas = this.listar();
        const sala = crearSala({
            ...salaBase,
            id: (idRemotoSala as number | string | null) ?? salaBase.id,
            id_remoto: (idRemotoSala as number | string | null) ?? null,
        });
        salas.push(sala);
        actualizarCache(salas);

        if (typeof idRemotoSala === 'number' || typeof idRemotoSala === 'string') {
            recordarIdRemoto(claveSala(sala.id), idRemotoSala);
            registrarIdRemoto('salas', sala.id, idRemotoSala);
        }

        await sincronizarSalasRemotas().catch((error) => console.warn('No se pudo refrescar salas tras guardar en Supabase.', error));
        return sala;
    },

    async actualizar(id: number | string, data: EntradaSala): Promise<Sala | null> {
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexiÃ³n con Supabase. No se puede actualizar la sala.');
        }

        const salas = this.listar();
        const indice = salas.findIndex((sala) => String(sala.id) === String(id));
        if (indice === -1) {
            return null;
        }

        const salaActual = salas[indice];
        const salaActualizada = crearSala({ ...salaActual, ...data, id: salaActual.id, origen: salaActual.origen ?? 'usuario' });
        const idRemotoSala = idRemoto(salaActualizada) ?? idRemoto(salaActual);

        if (idRemotoSala == null) {
            throw new Error('La sala no tiene id remoto en Supabase. Sincroniza los datos e intÃ©ntalo de nuevo.');
        }

        const cambios = cambiosDeSala(salaActualizada);
            await actualizarSala(idRemotoSala as number | string, cambios);

        salas[indice] = crearSala({ ...salaActualizada, id_remoto: idRemotoSala as number | string | null });
        actualizarCache(salas);

        await sincronizarSalasRemotas().catch((error) => console.warn('No se pudo refrescar salas tras actualizar en Supabase.', error));
        return salas[indice];
    },

    async eliminar(id: number | string): Promise<Sala[]> {
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexiÃ³n con Supabase. No se puede eliminar la sala.');
        }

        const salas = this.listar();
        const sala = salas.find((item) => String(item.id) === String(id)) ?? null;
        const salasRestantes = salas.filter((item) => String(item.id) !== String(id));

        if (sala) {
            const idRemotoSala = idRemoto(sala);
            if (idRemotoSala != null) {
                await eliminarFilaRemota('salas', idRemotoSala as number | string);
            } else {
                throw new Error('La sala no tiene id remoto en Supabase. No se puede eliminar desde la base de datos.');
            }
        }

        Storage.guardarValor(CLAVE, salasRestantes);
        await sincronizarSalasRemotas().catch((error) => console.warn('No se pudo refrescar salas tras eliminar en Supabase.', error));
        return salasRestantes;
    },

    subir(sala: Sala): void {
        void (async () => {
            try {
                if (!hayConexionSupabase()) return;
                const { id: idRemotoSala } = await insertarSala(sala);
                if (typeof idRemotoSala === 'number' || typeof idRemotoSala === 'string') {
                    recordarIdRemoto(claveSala(sala.id), idRemotoSala);
                    registrarIdRemoto('salas', sala.id, idRemotoSala);
                }
                await sincronizarSalasRemotas();
            } catch (error) {
                console.warn('No se pudo guardar la sala en Supabase.', error);
            }
        })();
    },

    subirCambios(sala: Sala): void {
        void (async () => {
            try {
                if (!hayConexionSupabase()) return;
                const idRemotoSala = idRemoto(sala);
                if (idRemotoSala == null) return;
                const cambios = cambiosDeSala(sala);
                if (!cambios) return;
                await actualizarSala(idRemotoSala as number | string, cambios as Record<string, unknown>);
                await sincronizarSalasRemotas();
            } catch (error) {
                console.warn('No se pudo actualizar la sala en Supabase.', error);
            }
        })();
    },

};
