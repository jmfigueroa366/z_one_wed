// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearColaborador } from '../models/Colaborador.ts';
import type { Colaborador, EntradaColaborador } from '../models/Colaborador.ts';
import { sincronizarColaboradores, eliminarFilaRemota, idRemoto, hayConexionSupabase } from '../infrastructure/supabaseSync.ts';


const CLAVE = 'colaboradores';

function obtenerListaInicial(): Colaborador[] {
    return SEED.colaboradores.map((colaborador, indice) =>
        crearColaborador({ ...colaborador, id: colaborador.id ?? indice + 1 })
    );
}

function normalizarLista(colaboradores: EntradaColaborador[]): Colaborador[] {
    return colaboradores.map((colaborador, indice) =>
        crearColaborador({ ...colaborador, id: colaborador.id ?? indice + 1 })
    );
}

// Sincroniza colaboradores desde Supabase una vez al cargar el módulo.
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

    crear(data: EntradaColaborador): Colaborador {
        const colaboradores = this.listar();
        const siguienteId = generarIdUnico(colaboradores);
        const colaborador = crearColaborador({ ...data, id: siguienteId });
        colaboradores.push(colaborador);
        Storage.guardarValor(CLAVE, colaboradores);
        return colaborador;
    },

    actualizar(id: number | string, data: EntradaColaborador): Colaborador | null {
        const colaboradores = this.listar();
        const indice = colaboradores.findIndex((colaborador) => String(colaborador.id) === String(id));
        if (indice === -1) {
            return null;
        }
        colaboradores[indice] = crearColaborador({ ...colaboradores[indice], ...data, id: colaboradores[indice].id });
        Storage.guardarValor(CLAVE, colaboradores);
        return colaboradores[indice];
    },

    eliminar(id: number | string): Colaborador[] {
        const colaboradores = this.listar();
        const colaborador = colaboradores.find((item) => String(item.id) === String(id)) ?? null;
        const colaboradoresRestantes = colaboradores.filter((item) => String(item.id) !== String(id));
        Storage.guardarValor(CLAVE, colaboradoresRestantes);
        if (hayConexionSupabase() && colaborador) {
            // Solo se borra en Supabase la fila que existe alli: el id local
            // puede coincidir con el de otro colaborador y se borraria por error.
            const idRemotoColaborador = idRemoto(colaborador);
            if (idRemotoColaborador != null) {
                eliminarFilaRemota('colaboradores', idRemotoColaborador).catch((error) => console.warn('No se pudo borrar el colaborador en Supabase.', error));
            }
        }
        return colaboradoresRestantes;
    },
};

export default colaboradorRepo;
