// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearCancion } from '../models/Cancion.ts';
import type { Cancion, EntradaCancion } from '../models/Cancion.ts';
import {
    sincronizarCanciones,
    idApiDe,
    insertarCancion,
    actualizarCancion,
    eliminarCancion,
    cambiosDeCancion,
} from '../infrastructure/supabaseSync.ts';
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

// Sincroniza las canciones de los proyectos reales una vez al cargar el módulo.
let sincronizado = false;
export async function sincronizar() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarCanciones();
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar las canciones con la API.', error);
    }
}

sincronizar();

function actualizarCache(canciones: Cancion[]): void {
    Storage.guardarValor(CLAVE, canciones);
}

function idRemotoNumerico(id: unknown): number | null {
    const numero = typeof id === 'number' ? id : Number(id);
    return Number.isFinite(numero) ? numero : null;
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
        const proyectoId = data?.proyecto_id;
        if (proyectoId == null) {
            throw new Error('Asigna la canción a un proyecto.');
        }

        const proyecto = proyectoRepo.obtenerPorId(proyectoId);
        if (!proyecto) {
            throw new Error('El proyecto no existe.');
        }

        const cancionBase = crearCancion({ ...data, origen: 'usuario' });
        const proyectoApiId = idApiDe(proyecto);
        const canciones = this.listar();
        const id = generarIdUnico(canciones);

        let idRemoto: number | null = null;
        if (proyectoApiId != null) {
            const { id: remoto } = await insertarCancion(cancionBase, proyectoApiId);
            idRemoto = idRemotoNumerico(remoto);
        }

        const cancion = crearCancion({ ...cancionBase, id, id_remoto: idRemoto });
        canciones.push(cancion);
        actualizarCache(canciones);

        if (proyectoApiId != null) {
            await sincronizarCanciones().catch((error) => console.warn('No se pudo refrescar canciones tras guardar en la API.', error));
        }
        return cancion;
    },

    async actualizar(id: number | string, data: EntradaCancion): Promise<Cancion | null> {
        const canciones = this.listar();
        const indice = canciones.findIndex((cancion) => String(cancion.id) === String(id));
        if (indice === -1) {
            return null;
        }

        const cancionActual = canciones[indice];
        const cancionActualizada = crearCancion({
            ...cancionActual,
            ...data,
            id: cancionActual.id,
            id_remoto: cancionActual.id_remoto ?? null,
            origen: cancionActual.origen ?? 'usuario',
        });
        const idApi = idApiDe(cancionActualizada);

        if (idApi != null) {
            await actualizarCancion(idApi, cambiosDeCancion(cancionActualizada));
        }

        canciones[indice] = cancionActualizada;
        actualizarCache(canciones);

        if (idApi != null) {
            await sincronizarCanciones().catch((error) => console.warn('No se pudo refrescar canciones tras actualizar en la API.', error));
            return this.obtenerPorId(id) ?? cancionActualizada;
        }
        return cancionActualizada;
    },

    async eliminar(id: number | string): Promise<Cancion[]> {
        const canciones = this.listar();
        const cancion = canciones.find((item) => String(item.id) === String(id)) ?? null;
        const idApi = idApiDe(cancion);

        if (idApi != null) {
            await eliminarCancion(idApi);
        }

        const cancionesRestantes = canciones.filter((item) => String(item.id) !== String(id));
        Storage.guardarValor(CLAVE, cancionesRestantes);

        if (idApi != null) {
            await sincronizarCanciones().catch((error) => console.warn('No se pudo refrescar canciones tras eliminar en la API.', error));
        }
        return cancionesRestantes;
    },

    eliminarPorProyecto(proyectoId: number | string | null | undefined): Cancion[] {
        if (proyectoId == null) return [];
        const canciones = this.listar().filter((cancion) => String(cancion.proyecto_id) !== String(proyectoId));
        Storage.guardarValor(CLAVE, canciones);
        return canciones;
    },
};

export default cancionRepo;
