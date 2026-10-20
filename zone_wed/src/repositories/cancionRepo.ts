// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearCancion } from '../models/Cancion.ts';
import type { Cancion, EntradaCancion } from '../models/Cancion.ts';
import { sincronizarCanciones, eliminarFilaRemota } from '../infrastructure/supabaseSync.ts';
import { haySupabase } from '../lib/supabaseClient.ts';
import { proyectoRepo } from './proyectoRepo.ts';

const CLAVE = 'canciones';

function obtenerListaInicial(): Cancion[] {
    return SEED.canciones.map((cancion, indice) =>
        crearCancion({ ...cancion, id: cancion.id ?? indice + 1 })
    );
}

function normalizarLista(canciones: EntradaCancion[]): Cancion[] {
    return canciones.map((cancion, indice) =>
        crearCancion({ ...cancion, id: cancion.id ?? indice + 1 })
    );
}

// Sincroniza canciones desde Supabase una vez al cargar el módulo.
let sincronizado = false;
export async function sincronizar() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarCanciones();
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar las canciones con Supabase.', error);
    }
}

sincronizar();

export const cancionRepo = {
    listar(): Cancion[] {
        const canciones = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(canciones) || !Storage.existeValor(CLAVE)) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return normalizarLista(canciones as EntradaCancion[]);
    },

    listarPorProyecto(proyectoId: number | string | null | undefined): Cancion[] {
        if (!proyectoId) {
            return [];
        }
        return this.listar().filter((cancion) => String(cancion.proyecto_id) === String(proyectoId));
    },

    listarPorUsuario(usuarioId: number | string | null | undefined): Cancion[] {
        if (!usuarioId) {
            return [];
        }
        const proyectosUsuario = proyectoRepo.listarPorUsuario(usuarioId);
        const idsProyectos = new Set(proyectosUsuario.map((proyecto) => String(proyecto.id)));
        return this.listar().filter((cancion) => idsProyectos.has(String(cancion.proyecto_id)));
    },

    obtenerPorId(id: number | string): Cancion | null {
        if (id == null) return null;
        return this.listar().find((cancion) => String(cancion.id) === String(id)) ?? null;
    },

    crear(data: EntradaCancion): Cancion {
        const canciones = this.listar();
        const siguienteId = generarIdUnico(canciones);
        const cancion = crearCancion({ ...data, id: siguienteId });
        canciones.push(cancion);
        Storage.guardarValor(CLAVE, canciones);
        return cancion;
    },

    actualizar(id: number | string, data: EntradaCancion): Cancion | null {
        const canciones = this.listar();
        const indice = canciones.findIndex((cancion) => String(cancion.id) === String(id));
        if (indice === -1) {
            return null;
        }
        canciones[indice] = crearCancion({ ...canciones[indice], ...data, id: canciones[indice].id });
        Storage.guardarValor(CLAVE, canciones);
        return canciones[indice];
    },

    eliminar(id: number | string): Cancion[] {
        const canciones = this.listar().filter((cancion) => String(cancion.id) !== String(id));
        Storage.guardarValor(CLAVE, canciones);
        if (haySupabase) {
            eliminarFilaRemota('canciones', id).catch((error) => console.warn('No se pudo borrar la canción en Supabase.', error));
        }
        return canciones;
    },

    eliminarPorProyecto(proyectoId: number | string | null | undefined): Cancion[] {
        if (proyectoId == null) return [];
        const canciones = this.listar().filter((cancion) => String(cancion.proyecto_id) !== String(proyectoId));
        Storage.guardarValor(CLAVE, canciones);
        return canciones;
    },
};

export default cancionRepo;