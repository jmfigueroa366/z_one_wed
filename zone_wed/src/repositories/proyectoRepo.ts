// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearProyecto } from '../models/Proyecto.ts';
import type { EntradaProyecto, Proyecto } from '../models/Proyecto.ts';
import { sincronizarProyectos, eliminarFilaRemota, idRemoto, hayConexionSupabase } from '../infrastructure/supabaseSync.ts';


const CLAVE = 'proyectos';

function obtenerListaInicial(): Proyecto[] {
    return SEED.proyectos.map((proyecto, indice) => crearProyecto({ ...proyecto, id: proyecto.id ?? indice + 1 }));
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

    crear(data: EntradaProyecto): Proyecto {
        const proyectos = this.listar();
        const siguienteId = generarIdUnico(proyectos);
        const proyecto = crearProyecto({ ...data, id: siguienteId });
        proyectos.push(proyecto);
        Storage.guardarValor(CLAVE, proyectos);
        return proyecto;
    },

    actualizar(id: number | string, data: EntradaProyecto): Proyecto | null {
        const proyectos = this.listar();
        const indice = proyectos.findIndex((proyecto) => String(proyecto.id) === String(id));
        if (indice === -1) {
            return null;
        }
        proyectos[indice] = crearProyecto({ ...proyectos[indice], ...data, id: proyectos[indice].id });
        Storage.guardarValor(CLAVE, proyectos);
        return proyectos[indice];
    },

    eliminar(id: number | string): Proyecto[] {
        const proyectos = this.listar();
        const proyecto = proyectos.find((item) => String(item.id) === String(id)) ?? null;
        const proyectosRestantes = proyectos.filter((item) => String(item.id) !== String(id));
        Storage.guardarValor(CLAVE, proyectosRestantes);
        if (hayConexionSupabase() && proyecto) {
            // Solo se borra en Supabase la fila que existe alli: el id local
            // puede coincidir con el de otro proyecto y se borraria por error.
            const idRemotoProyecto = idRemoto(proyecto);
            if (idRemotoProyecto != null) {
                eliminarFilaRemota('proyectos', idRemotoProyecto).catch((error) => console.warn('No se pudo borrar el proyecto en Supabase.', error));
            }
        }
        return proyectosRestantes;
    },
};

export default proyectoRepo;