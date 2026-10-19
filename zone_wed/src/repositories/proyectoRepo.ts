// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearProyecto } from '../models/Proyecto.ts';
import type { EntradaProyecto, Proyecto } from '../models/Proyecto.ts';

const CLAVE = 'proyectos';

function obtenerListaInicial(): Proyecto[] {
    return SEED.proyectos.map((proyecto, indice) => crearProyecto({ ...proyecto, id: indice + 1 }));
}

export const proyectoRepo = {
    listar(): Proyecto[] {
        const proyectos = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(proyectos) || proyectos.length === 0) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return proyectos.map((proyecto, indice) => crearProyecto({ ...proyecto, id: proyecto.id ?? indice + 1 }));
    },

    obtenerPorId(id: number | string): Proyecto | null {
        return this.listar().find((proyecto) => String(proyecto.id ?? proyecto.nombre) === String(id)) ?? null;
    },

    listarPorUsuario(usuarioId: number | string | null | undefined): Proyecto[] {
        return this.listar().filter((proyecto) => String(proyecto.usuario_id) === String(usuarioId));
    },

    crear(data: EntradaProyecto): Proyecto {
        const proyectos = this.listar();
        const siguienteId = proyectos.reduce((max, proyecto) => Math.max(max, Number(proyecto.id) || 0), 0) + 1;
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
        const proyectos = this.listar().filter((proyecto) => String(proyecto.id) !== String(id));
        Storage.guardarValor(CLAVE, proyectos);
        return proyectos;
    },
};

export default proyectoRepo;