// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearSesion } from '../models/Sesion.ts';
import type { EntradaSesion, Sesion } from '../models/Sesion.ts';

import { insertarSesion, sincronizarSesiones, encadenarEscritura, recordarIdRemoto, hayConexionSupabase } from '../infrastructure/supabaseSync.ts';

const CLAVE = 'sesiones';

function claveSesion(id: number | string | null | undefined): string {
    return `sesion:${String(id)}`;
}

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
// El alta queda encadenada con los cambios de estado posteriores para que un
// cambio que llega antes del insert se aplique sobre la fila correcta.
function guardarEnSupabase(sesion: Sesion) {
    if (!hayConexionSupabase()) {
        return;
    }
    encadenarEscritura(claveSesion(sesion.id), async () => {
        const { id } = await insertarSesion(sesion);
        recordarIdRemoto(claveSesion(sesion.id), id);
        registrarIdRemoto(sesion.id, id);
        await sincronizarSesiones();
    }).catch((error) => console.warn('No se pudo guardar la sesión en Supabase.', error));
}

// Guarda el id que Supabase asignó a la sesión para que las actualizaciones
// y borrados remotos apunten a la fila correcta.
function registrarIdRemoto(id: number | string | null | undefined, idRemoto: unknown): void {
    if (id == null || idRemoto == null) {
        return;
    }
    const sesiones = sesionRepo.listar();
    const indice = sesiones.findIndex((sesion) => String(sesion.id) === String(id));
    if (indice === -1) {
        return;
    }
    sesiones[indice] = crearSesion({ ...sesiones[indice], id_remoto: idRemoto as number | string });
    Storage.guardarValor(CLAVE, sesiones);
}

export const sesionRepo = {
    listar(): Sesion[] {
        const sesiones = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(sesiones) || !Storage.existeValor(CLAVE)) {
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
        const siguienteId = generarIdUnico(sesiones);
        const sesion = crearSesion({ ...data, id: siguienteId });
        sesiones.push(sesion);
        Storage.guardarValor(CLAVE, sesiones);
        guardarEnSupabase(sesion);
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
