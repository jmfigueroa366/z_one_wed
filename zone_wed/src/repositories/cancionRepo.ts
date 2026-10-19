// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearCancion } from '../models/Cancion.ts';
import type { Cancion, EntradaCancion } from '../models/Cancion.ts';

const CLAVE = 'canciones';

function obtenerListaInicial(): Cancion[] {
    return SEED.canciones.map((cancion, indice) => crearCancion({ ...cancion, id: indice + 1 }));
}

export const cancionRepo = {
    listar(): Cancion[] {
        const canciones = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(canciones) || canciones.length === 0) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return canciones.map((cancion, indice) => crearCancion({ ...cancion, id: cancion.id ?? indice + 1 }));
    },

    listarPorProyecto(proyectoId: number | string | null | undefined): Cancion[] {
        return this.listar().filter((cancion) => String(cancion.proyecto_id) === String(proyectoId));
    },

    obtenerPorId(id: number | string): Cancion | null {
        return this.listar().find((cancion) => String(cancion.id) === String(id)) ?? null;
    },

    crear(data: EntradaCancion): Cancion {
        const canciones = this.listar();
        const siguienteId = canciones.reduce((max, cancion) => Math.max(max, Number(cancion.id) || 0), 0) + 1;
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
        return canciones;
    },

    eliminarPorProyecto(proyectoId: number | string | null | undefined): Cancion[] {
        const canciones = this.listar().filter((cancion) => String(cancion.proyecto_id) !== String(proyectoId));
        Storage.guardarValor(CLAVE, canciones);
        return canciones;
    },
};

export default cancionRepo;