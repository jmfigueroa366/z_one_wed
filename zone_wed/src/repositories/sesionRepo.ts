// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearSesion } from '../models/Sesion.ts';
import type { EntradaSesion, Sesion } from '../models/Sesion.ts';
import { haySupabase } from '../lib/supabaseClient.ts';
import { insertarSesion, sincronizarSesiones } from '../infrastructure/supabaseSync.ts';

const CLAVE = 'sesiones';

function obtenerListaInicial(): Sesion[] {
    return SEED.sesiones.map((sesion, indice) => crearSesion({ ...sesion, id: indice + 1 }));
}

// Sincroniza sesiones desde Supabase una vez al cargar el módulo.
let sincronizado = false;
export async function sincronizar() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarSesiones();
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar las sesiones con Supabase.', error);
    }
}

sincronizar();

// Guarda la sesión en Supabase sin frenar la interfaz: la app ya guardó la
// sesión en local y la muestra; en segundo plano se sube y se refresca la lista.
function guardarEnSupabase(sesion: Sesion) {
    if (!haySupabase) {
        return;
    }
    insertarSesion(sesion)
        .then(() => sincronizarSesiones())
        .catch((error) => console.warn('No se pudo guardar la sesión en Supabase.', error));
}

export const sesionRepo = {
    listar(): Sesion[] {
        const sesiones = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(sesiones) || sesiones.length === 0) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return sesiones.map((sesion, indice) => crearSesion({ ...sesion, id: sesion.id ?? indice + 1 }));
    },

    obtenerPorId(id: number | string | null | undefined): Sesion | null {
        if (id == null) return null;
        return this.listar().find((sesion) => String(sesion.id) === String(id)) ?? null;
    },

    crear(data: EntradaSesion): Sesion {
        const sesiones = this.listar();
        const siguienteId = sesiones.reduce((max, sesion) => Math.max(max, Number(sesion.id) || 0), 0) + 1;
        const sesion = crearSesion({ ...data, id: siguienteId });
        sesiones.push(sesion);
        Storage.guardarValor(CLAVE, sesiones);
        return sesion;
    },

    actualizar(id: number | string | null | undefined, data: EntradaSesion): Sesion | null {
        if (id == null) return null;
        const sesiones = this.listar();
        const indice = sesiones.findIndex((sesion) => String(sesion.id) === String(id));
        if (indice === -1) {
            return null;
        }
        sesiones[indice] = crearSesion({ ...sesiones[indice], ...data, id: sesiones[indice].id });
        Storage.guardarValor(CLAVE, sesiones);
        return sesiones[indice];
    },

    cancelar(id: number | string | null | undefined): Sesion | null {
        return this.actualizar(id, { estado: 'cancelada' });
    },
};

export default sesionRepo;
