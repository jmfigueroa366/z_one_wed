// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearProyecto } from '../models/Proyecto.ts';
import type { EntradaProyecto, Proyecto } from '../models/Proyecto.ts';
import {
    sincronizarProyectos,
    eliminarFilaRemota,
    idRemoto,
    hayConexionSupabase,
    claveProyecto,
    insertarProyecto,
    actualizarProyecto,
    cambiosDeProyecto,
    resolverClienteId,
    registrarIdRemoto,
    recordarIdRemoto,
} from '../infrastructure/supabaseSync.ts';


const CLAVE = 'proyectos';

function obtenerListaInicial(): Proyecto[] {
    return SEED.proyectos.map((proyecto, indice) =>
        crearProyecto({ ...proyecto, id: proyecto.id ?? indice + 1, origen: 'seed' })
    );
}

function normalizarLista(proyectos: EntradaProyecto[]): Proyecto[] {
    return proyectos.map((proyecto, indice) =>
        crearProyecto({ ...proyecto, id: proyecto.id ?? indice + 1 })
    );
}

// Sincroniza proyectos desde Supabase una vez al cargar el módulo.
let sincronizado = false;
export async function sincronizar() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarProyectos();
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar los proyectos con Supabase.', error);
    }
}

sincronizar();

function actualizarCache(proyectos: Proyecto[]): void {
    Storage.guardarValor(CLAVE, proyectos);
}

export const proyectoRepo = {
    listar(): Proyecto[] {
        const proyectos = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(proyectos) || !Storage.existeValor(CLAVE)) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return normalizarLista(proyectos as EntradaProyecto[]);
    },

    obtenerPorId(id: number | string | null | undefined): Proyecto | null {
        return this.listar().find((proyecto) => String(proyecto.id ?? proyecto.nombre) === String(id)) ?? null;
    },

    listarPorUsuario(usuarioId: number | string | null | undefined): Proyecto[] {
        if (!usuarioId) {
            return [];
        }
        return this.listar().filter((proyecto) => String(proyecto.usuario_id) === String(usuarioId));
    },

    async crear(data: EntradaProyecto): Promise<Proyecto> {
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexión con Supabase. No se puede guardar el proyecto.');
        }

        const clienteId = await resolverClienteId(data?.usuario_id);
        if (!clienteId) {
            throw new Error('El propietario del proyecto no tiene un cliente en Supabase.');
        }

        const proyectoBase = crearProyecto({ ...data, origen: 'usuario' });
        const { id: idRemotoProyecto } = await insertarProyecto(proyectoBase, clienteId);

        const proyectos = this.listar();
        const proyecto = crearProyecto({
            ...proyectoBase,
            id: (idRemotoProyecto as number | string | null) ?? proyectoBase.id,
            id_remoto: (idRemotoProyecto as number | string | null) ?? null,
        });
        proyectos.push(proyecto);
        actualizarCache(proyectos);

        if (typeof idRemotoProyecto === 'number' || typeof idRemotoProyecto === 'string') {
            recordarIdRemoto(claveProyecto(proyecto.id), idRemotoProyecto);
            registrarIdRemoto('proyectos', proyecto.id, idRemotoProyecto);
        }

        await sincronizarProyectos().catch((error) => console.warn('No se pudo refrescar proyectos tras guardar en Supabase.', error));
        return proyecto;
    },

    async actualizar(id: number | string, data: EntradaProyecto): Promise<Proyecto | null> {
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexión con Supabase. No se puede actualizar el proyecto.');
        }

        const proyectos = this.listar();
        const indice = proyectos.findIndex((proyecto) => String(proyecto.id) === String(id));
        if (indice === -1) {
            return null;
        }

        const proyectoActual = proyectos[indice];
        const proyectoActualizado = crearProyecto({ ...proyectoActual, ...data, id: proyectoActual.id, origen: proyectoActual.origen ?? 'usuario' });
        const idRemotoProyecto = idRemoto(proyectoActualizado) ?? idRemoto(proyectoActual);

        if (idRemotoProyecto == null) {
            throw new Error('El proyecto no tiene id remoto en Supabase. Sincroniza los datos e inténtalo de nuevo.');
        }

        const cambios = cambiosDeProyecto(proyectoActualizado);
        await actualizarProyecto(idRemotoProyecto, cambios);

        proyectos[indice] = crearProyecto({ ...proyectoActualizado, id_remoto: idRemotoProyecto as number | string | null });
        actualizarCache(proyectos);

        await sincronizarProyectos().catch((error) => console.warn('No se pudo refrescar proyectos tras actualizar en Supabase.', error));
        return proyectos[indice];
    },

    async eliminar(id: number | string): Promise<Proyecto[]> {
        if (!hayConexionSupabase()) {
            throw new Error('No hay conexión con Supabase. No se puede eliminar el proyecto.');
        }

        const proyectos = this.listar();
        const proyecto = proyectos.find((item) => String(item.id) === String(id)) ?? null;
        const proyectosRestantes = proyectos.filter((item) => String(item.id) !== String(id));

        if (proyecto) {
            const idRemotoProyecto = idRemoto(proyecto);
            if (idRemotoProyecto != null) {
                await eliminarFilaRemota('proyectos', idRemotoProyecto as number | string);
            } else {
                throw new Error('El proyecto no tiene id remoto en Supabase. No se puede eliminar desde la base de datos.');
            }
        }

        Storage.guardarValor(CLAVE, proyectosRestantes);
        await sincronizarProyectos().catch((error) => console.warn('No se pudo refrescar proyectos tras eliminar en Supabase.', error));
        return proyectosRestantes;
    },

    // Métodos de compatibilidad (ya no usan cola, pero se mantienen por si se llaman)
    subir(proyecto: Proyecto): void {
        void (async () => {
            try {
                if (!hayConexionSupabase()) return;
                const clienteId = await resolverClienteId(proyecto.usuario_id);
                if (!clienteId) return;
                const { id: idRemotoProyecto } = await insertarProyecto(proyecto, clienteId);
                if (typeof idRemotoProyecto === 'number' || typeof idRemotoProyecto === 'string') {
                    recordarIdRemoto(claveProyecto(proyecto.id), idRemotoProyecto);
                    registrarIdRemoto('proyectos', proyecto.id, idRemotoProyecto);
                }
                await sincronizarProyectos();
            } catch (error) {
                console.warn('No se pudo guardar el proyecto en Supabase.', error);
            }
        })();
    },

    subirCambios(proyecto: Proyecto): void {
        void (async () => {
            try {
                if (!hayConexionSupabase()) return;
                const idRemotoProyecto = idRemoto(proyecto);
                if (idRemotoProyecto == null) return;
                const cambios = cambiosDeProyecto(proyecto);
                if (!cambios) return;
                await actualizarProyecto(idRemotoProyecto as number | string, cambios);
                await sincronizarProyectos();
            } catch (error) {
                console.warn('No se pudo actualizar el proyecto en Supabase.', error);
            }
        })();
    },
};

export default proyectoRepo;

