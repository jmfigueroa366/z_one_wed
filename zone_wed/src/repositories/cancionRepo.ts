// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearCancion } from '../models/Cancion.ts';
import type { Cancion, EntradaCancion } from '../models/Cancion.ts';
import {
    sincronizarCanciones,
    eliminarFilaRemota,
    idRemoto,
    hayConexionSupabase,
    claveCancion,
    claveProyecto,
    insertarCancion,
    actualizarCancion,
    cambiosDeCancion,
    esperarEscritura,
    registrarIdRemoto,
    recordarIdRemoto,
} from '../infrastructure/supabaseSync.ts';
import { idRemotoDe } from '../infrastructure/identificadores.ts';

import { proyectoRepo } from './proyectoRepo.ts';

const CLAVE = 'canciones';

function obtenerListaInicial(): Cancion[] {
    return SEED.canciones.map((cancion, indice) =>
        crearCancion({ ...cancion, id: cancion.id ?? indice + 1, origen: 'seed' })
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

function actualizarCache(canciones: Cancion[]): void {
    Storage.guardarValor(CLAVE, canciones);
}

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

    obtenerPorId(id: number | string | null | undefined): Cancion | null {
        if (id == null) return null;
        return this.listar().find((cancion) => String(cancion.id) === String(id)) ?? null;
    },

    async crear(data: EntradaCancion): Promise<Cancion> {
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexión con Supabase. No se puede guardar la canción.');
        }

        const proyectoId = data?.proyecto_id;
        if (proyectoId == null) {
            throw new Error('Asigna la canción a un proyecto.');
        }

        const proyecto = proyectoRepo.obtenerPorId(proyectoId);
        if (!proyecto) {
            throw new Error('El proyecto no existe.');
        }

        await esperarEscritura(claveProyecto(proyecto.id)).catch(() => undefined);
        const proyectoRemoto = idRemotoDe('proyectos', proyecto.id) ?? idRemoto(proyecto);
        if (proyectoRemoto == null) {
            throw new Error('La canción no se pudo guardar: su proyecto todavía no existe en Supabase.');
        }

        const cancionBase = crearCancion({ ...data, origen: 'usuario' });
        const { id: idRemotoCancion } = await insertarCancion(cancionBase, proyectoRemoto);

        const canciones = this.listar();
        const cancion = crearCancion({
            ...cancionBase,
            id: (idRemotoCancion as number | string | null) ?? cancionBase.id,
            id_remoto: (idRemotoCancion as number | string | null) ?? null,
        });
        canciones.push(cancion);
        actualizarCache(canciones);

        if (typeof idRemotoCancion === 'number' || typeof idRemotoCancion === 'string') {
            recordarIdRemoto(claveCancion(cancion.id), idRemotoCancion);
            registrarIdRemoto('canciones', cancion.id, idRemotoCancion);
        }

        await sincronizarCanciones().catch((error) => console.warn('No se pudo refrescar canciones tras guardar en Supabase.', error));
        return cancion;
    },

    async actualizar(id: number | string, data: EntradaCancion): Promise<Cancion | null> {
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexión con Supabase. No se puede actualizar la canción.');
        }

        const canciones = this.listar();
        const indice = canciones.findIndex((cancion) => String(cancion.id) === String(id));
        if (indice === -1) {
            return null;
        }

        const cancionActual = canciones[indice];
        const cancionActualizada = crearCancion({ ...cancionActual, ...data, id: cancionActual.id, origen: cancionActual.origen ?? 'usuario' });
        const idRemotoCancion = idRemoto(cancionActualizada) ?? idRemoto(cancionActual);

        if (idRemotoCancion == null) {
            throw new Error('La canción no tiene id remoto en Supabase. Sincroniza los datos e inténtalo de nuevo.');
        }

        const cambios = cambiosDeCancion(cancionActualizada);
        await actualizarCancion(idRemotoCancion, cambios);

        canciones[indice] = crearCancion({ ...cancionActualizada, id_remoto: idRemotoCancion as number | string | null });
        actualizarCache(canciones);

        await sincronizarCanciones().catch((error) => console.warn('No se pudo refrescar canciones tras actualizar en Supabase.', error));
        return canciones[indice];
    },

    async eliminar(id: number | string): Promise<Cancion[]> {
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexión con Supabase. No se puede eliminar la canción.');
        }

        const canciones = this.listar();
        const cancion = canciones.find((item) => String(item.id) === String(id)) ?? null;
        const cancionesRestantes = canciones.filter((item) => String(item.id) !== String(id));

        if (cancion) {
            const idRemotoCancion = idRemoto(cancion);
            if (idRemotoCancion != null) {
                await eliminarFilaRemota('canciones', idRemotoCancion as number | string);
            } else {
                throw new Error('La canción no tiene id remoto en Supabase. No se puede eliminar desde la base de datos.');
            }
        }

        Storage.guardarValor(CLAVE, cancionesRestantes);
        await sincronizarCanciones().catch((error) => console.warn('No se pudo refrescar canciones tras eliminar en Supabase.', error));
        return cancionesRestantes;
    },

    eliminarPorProyecto(proyectoId: number | string | null | undefined): Cancion[] {
        if (proyectoId == null) return [];
        const canciones = this.listar().filter((cancion) => String(cancion.proyecto_id) !== String(proyectoId));
        Storage.guardarValor(CLAVE, canciones);
        return canciones;
    },

    // Métodos de compatibilidad
    subir(cancion: Cancion): void {
        void (async () => {
            try {
                if (!hayConexionSupabase()) return;
                await esperarEscritura(claveProyecto(cancion.proyecto_id)).catch(() => undefined);
                const proyectoRemoto = idRemotoDe('proyectos', cancion.proyecto_id) ?? idRemoto(proyectoRepo.obtenerPorId(cancion.proyecto_id));
                if (proyectoRemoto == null) return;
                const { id: idRemotoCancion } = await insertarCancion(cancion, proyectoRemoto);
                if (typeof idRemotoCancion === 'number' || typeof idRemotoCancion === 'string') {
                    recordarIdRemoto(claveCancion(cancion.id), idRemotoCancion);
                    registrarIdRemoto('canciones', cancion.id, idRemotoCancion);
                }
                await sincronizarCanciones();
            } catch (error) {
                console.warn('No se pudo guardar la canción en Supabase.', error);
            }
        })();
    },

    subirCambios(cancion: Cancion): void {
        void (async () => {
            try {
                if (!hayConexionSupabase()) return;
                const idRemotoCancion = idRemoto(cancion);
                if (idRemotoCancion == null) return;
                const cambios = cambiosDeCancion(cancion);
                if (!cambios) return;
                await actualizarCancion(idRemotoCancion as number | string, cambios);
                await sincronizarCanciones();
            } catch (error) {
                console.warn('No se pudo actualizar la canción en Supabase.', error);
            }
        })();
    },
};

export default cancionRepo;

