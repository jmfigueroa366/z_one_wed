// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearProyecto } from '../models/Proyecto.ts';
import type { EntradaProyecto, Proyecto } from '../models/Proyecto.ts';
import { sincronizarProyectos, idApiDe } from '../infrastructure/supabaseSync.ts';

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

// Sincroniza los proyectos reales de la API una vez al cargar el módulo.
let sincronizado = false;
export async function sincronizar() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarProyectos();
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar los proyectos con la API.', error);
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
        return this.listar().filter(
            (proyecto) =>
                String(proyecto.usuario_id) === String(usuarioId) || idApiDe(proyecto) != null
        );
    },

    async crear(data: EntradaProyecto): Promise<Proyecto> {
        const proyectos = this.listar();
        const id = generarIdUnico(proyectos);
        const proyecto = crearProyecto({
            ...data,
            id,
            id_remoto: null,
            origen: 'usuario',
        });
        proyectos.push(proyecto);
        actualizarCache(proyectos);
        return proyecto;
    },

    async actualizar(id: number | string, data: EntradaProyecto): Promise<Proyecto | null> {
        const proyectos = this.listar();
        const indice = proyectos.findIndex((proyecto) => String(proyecto.id) === String(id));
        if (indice === -1) {
            return null;
        }

        const proyectoActual = proyectos[indice];
        const proyectoActualizado = crearProyecto({
            ...proyectoActual,
            ...data,
            id: proyectoActual.id,
            id_remoto: proyectoActual.id_remoto ?? null,
            origen: proyectoActual.origen ?? 'usuario',
        });

        proyectos[indice] = proyectoActualizado;
        actualizarCache(proyectos);
        return proyectoActualizado;
    },

    async eliminar(id: number | string): Promise<Proyecto[]> {
        const proyectos = this.listar();
        const proyectosRestantes = proyectos.filter((item) => String(item.id) !== String(id));
        Storage.guardarValor(CLAVE, proyectosRestantes);
        return proyectosRestantes;
    },
};

export default proyectoRepo;
