// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearSesion } from '../models/Sesion.ts';
import type { EntradaSesion, Sesion } from '../models/Sesion.ts';

const CLAVE = 'sesiones';

function obtenerListaInicial(): Sesion[] {
    return SEED.sesiones.map((sesion, indice) => crearSesion({ ...sesion, id: indice + 1 }));
}

export const sesionRepo = {
    listar(): Sesion[] {
        const sesiones = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(sesiones) || sesiones.length === 0) {
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
        const siguienteId = sesiones.reduce((max, sesion) => Math.max(max, Number(sesion.id) || 0), 0) + 1;
        const sesion = crearSesion({ ...data, id: siguienteId });
        sesiones.push(sesion);
        Storage.guardarValor(CLAVE, sesiones);
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
