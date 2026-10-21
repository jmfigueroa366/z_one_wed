// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
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
} from '../infrastructure/supabaseSync.ts';
import { subirAlta, subirCambio } from '../infrastructure/colaRemota.ts';


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
        const colaborador = crearColaborador({ ...data, id: siguienteId, origen: 'usuario' });
        colaboradores.push(colaborador);
        Storage.guardarValor(CLAVE, colaboradores);
        this.subir(colaborador);
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
        this.subirCambios(colaboradores[indice]);
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

    // Sube el colaborador a Supabase.
    subir(colaborador: Colaborador): void {
        subirAlta({
            tipo: 'colaboradores',
            clave: claveColaborador(colaborador.id),
            idLocal: colaborador.id,
            insertar: () => insertarColaborador(colaborador),
            sincronizar: sincronizarColaboradores,
        });
    },

    // Sube los cambios del colaborador (nombre, perfil y especialidad).
    subirCambios(colaborador: Colaborador): void {
        subirCambio({
            clave: claveColaborador(colaborador.id),
            obtenerIdRemoto: () => idRemoto(this.obtenerPorId(colaborador.id)) ?? idRemoto(colaborador),
            cambios: () => cambiosDeColaborador(colaborador),
            aplicar: (idRemotoColaborador, cambios) => actualizarColaborador(idRemotoColaborador, cambios),
            sincronizar: sincronizarColaboradores,
        });
    },
};

export default colaboradorRepo;
