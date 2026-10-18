// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';
import { SEED } from '../data/seed.js';
import { crearProyecto } from '../models/Proyecto.js';
import { sincronizarProyectos } from '../infrastructure/supabaseSync.js';

const CLAVE = 'proyectos';

function obtenerListaInicial() {
    return SEED.proyectos.map((proyecto, indice) =>
        crearProyecto({ ...proyecto, id: proyecto.id ?? indice + 1 })
    );
}

function normalizarLista(proyectos) {
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

export const proyectoRepo = {
    listar() {
        const proyectos = Storage.obtenerValor(CLAVE, []);
        if (!Array.isArray(proyectos) || proyectos.length === 0) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return normalizarLista(proyectos);
    },

    listarPorUsuario(usuarioId) {
        if (!usuarioId) {
            return [];
        }
        return this.listar().filter((proyecto) => String(proyecto.usuario_id) === String(usuarioId));
    },

    obtenerPorId(id) {
        if (id == null) return null;
        return this.listar().find((proyecto) => String(proyecto.id) === String(id)) ?? null;
    },

    crear(data) {
        const proyectos = this.listar();
        const siguienteId = proyectos.reduce((max, proyecto) => Math.max(max, Number(proyecto.id) || 0), 0) + 1;
        const proyecto = crearProyecto({ ...data, id: siguienteId });
        proyectos.push(proyecto);
        Storage.guardarValor(CLAVE, proyectos);
        return proyecto;
    },

    actualizar(id, data) {
        const proyectos = this.listar();
        const indice = proyectos.findIndex((proyecto) => String(proyecto.id) === String(id));
        if (indice === -1) {
            return null;
        }
        proyectos[indice] = crearProyecto({ ...proyectos[indice], ...data, id: proyectos[indice].id });
        Storage.guardarValor(CLAVE, proyectos);
        return proyectos[indice];
    },

    eliminar(id) {
        const proyectos = this.listar().filter((proyecto) => String(proyecto.id) !== String(id));
        Storage.guardarValor(CLAVE, proyectos);
        return proyectos;
    },
};

export default proyectoRepo;