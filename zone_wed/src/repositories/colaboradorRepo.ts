// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearColaborador } from '../models/Colaborador.ts';
import type { Colaborador, EntradaColaborador } from '../models/Colaborador.ts';
import {
    sincronizarColaboradores,
    eliminarFilaRemota,
    idRemoto,
    hayConexionSupabase,
    claveColaborador,
    insertarColaborador,
    actualizarColaborador,
    cambiosDeColaborador,
    registrarIdRemoto,
    recordarIdRemoto,
} from '../infrastructure/supabaseSync.ts';

const CLAVE = 'colaboradores';

function obtenerListaInicial(): Colaborador[] {
    return SEED.colaboradores.map((colaborador, indice) =>
        crearColaborador({ ...colaborador, id: colaborador.id ?? indice + 1, origen: 'seed' })
    );
}

function normalizarLista(colaboradores: EntradaColaborador[]): Colaborador[] {
    return colaboradores.map((colaborador, indice) =>
        crearColaborador({ ...colaborador, id: colaborador.id ?? indice + 1 })
    );
}

function actualizarCache(colaboradores: Colaborador[]): void {
    Storage.guardarValor(CLAVE, colaboradores);
}

// Sincroniza colaboradores desde Supabase una vez al cargar el mÃ³dulo.
let sincronizado = false;
export async function sincronizar() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarColaboradores();
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar los colaboradores con Supabase.', error);
    }
}

sincronizar();

export const colaboradorRepo = {
    listar(): Colaborador[] {
        const colaboradores = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(colaboradores) || !Storage.existeValor(CLAVE)) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return normalizarLista(colaboradores as EntradaColaborador[]);
    },

    obtenerPorId(id: number | string | null | undefined): Colaborador | null {
        if (id == null) return null;
        return this.listar().find((colaborador) => String(colaborador.id) === String(id)) ?? null;
    },

    async crear(data: EntradaColaborador): Promise<Colaborador> {
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexiÃ³n con Supabase. No se puede guardar el colaborador.');
        }

        const colaboradorBase = crearColaborador({ ...data, origen: 'usuario', activo: data?.activo !== false });
        const { id: idRemotoColaborador } = await insertarColaborador(colaboradorBase);

        const colaboradores = this.listar();
        const colaborador = crearColaborador({
            ...colaboradorBase,
            id: (idRemotoColaborador as number | string | null) ?? colaboradorBase.id,
            id_remoto: (idRemotoColaborador as number | string | null) ?? null,
        });
        colaboradores.push(colaborador);
        actualizarCache(colaboradores);

        if (typeof idRemotoColaborador === 'string') {
            recordarIdRemoto(claveColaborador(colaborador.id), idRemotoColaborador);
            registrarIdRemoto('colaboradores', colaborador.id, idRemotoColaborador);
        }

        await sincronizarColaboradores().catch((error) => console.warn('No se pudo refrescar colaboradores tras guardar en Supabase.', error));
        return colaborador;
    },

    async actualizar(id: number | string, data: EntradaColaborador): Promise<Colaborador | null> {
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexiÃ³n con Supabase. No se puede actualizar el colaborador.');
        }

        const colaboradores = this.listar();
        const indice = colaboradores.findIndex((colaborador) => String(colaborador.id) === String(id));
        if (indice === -1) {
            return null;
        }

        const colaboradorActual = colaboradores[indice];
        const colaboradorActualizado = crearColaborador({ ...colaboradorActual, ...data, id: colaboradorActual.id, origen: colaboradorActual.origen ?? 'usuario' });
        const idRemotoColaborador = idRemoto(colaboradorActualizado) ?? idRemoto(colaboradorActual);

        if (idRemotoColaborador == null) {
            throw new Error('El colaborador no tiene id remoto en Supabase. Sincroniza los datos e intÃ©ntalo de nuevo.');
        }

        const cambios = cambiosDeColaborador(colaboradorActualizado);
            await actualizarColaborador(idRemotoColaborador as number | string, cambios);

        colaboradores[indice] = crearColaborador({ ...colaboradorActualizado, id_remoto: idRemotoColaborador as number | string | null });
        actualizarCache(colaboradores);

        await sincronizarColaboradores().catch((error) => console.warn('No se pudo refrescar colaboradores tras actualizar en Supabase.', error));
        return colaboradores[indice];
    },

    async eliminar(id: number | string): Promise<Colaborador[]> {
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexiÃ³n con Supabase. No se puede eliminar el colaborador.');
        }

        const colaboradores = this.listar();
        const colaborador = colaboradores.find((item) => String(item.id) === String(id)) ?? null;
        const colaboradoresRestantes = colaboradores.filter((item) => String(item.id) !== String(id));

        if (colaborador) {
            const idRemotoColaborador = idRemoto(colaborador);
            if (idRemotoColaborador != null) {
                await eliminarFilaRemota('colaboradores', idRemotoColaborador as number | string);
            } else {
                throw new Error('El colaborador no tiene id remoto en Supabase. No se puede eliminar desde la base de datos.');
            }
        }

        Storage.guardarValor(CLAVE, colaboradoresRestantes);
        await sincronizarColaboradores().catch((error) => console.warn('No se pudo refrescar colaboradores tras eliminar en Supabase.', error));
        return colaboradoresRestantes;
    },

    subir(colaborador: Colaborador): void {
        void (async () => {
            try {
                if (!hayConexionSupabase()) return;
                const { id: idRemotoColaborador } = await insertarColaborador(colaborador);
                if (typeof idRemotoColaborador === 'string') {
                    recordarIdRemoto(claveColaborador(colaborador.id), idRemotoColaborador);
                    registrarIdRemoto('colaboradores', colaborador.id, idRemotoColaborador);
                }
                await sincronizarColaboradores();
            } catch (error) {
                console.warn('No se pudo guardar el colaborador en Supabase.', error);
            }
        })();
    },

    subirCambios(colaborador: Colaborador): void {
        void (async () => {
            try {
                if (!hayConexionSupabase()) return;
                const idRemotoColaborador = idRemoto(colaborador);
                if (idRemotoColaborador == null) return;
                const cambios = cambiosDeColaborador(colaborador);
                if (!cambios) return;
                await actualizarColaborador(idRemotoColaborador as string, cambios as Record<string, unknown>);
                await sincronizarColaboradores();
            } catch (error) {
                console.warn('No se pudo actualizar el colaborador en Supabase.', error);
            }
        })();
    },

};

export default colaboradorRepo;
