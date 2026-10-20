// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearOrden } from '../models/Orden.ts';
import type { EntradaOrden, Orden } from '../models/Orden.ts';

const CLAVE = 'ordenes_servicio';

function prefijo(anio: number): string {
    return `ZW-${anio}-`;
}

export function siguienteNumero(ordenes: EntradaOrden[] = [], anio: number = new Date().getFullYear()): string {
    const marca = prefijo(anio);
    const maximo = ordenes.reduce((max, orden) => {
        const numero = String(orden?.numero ?? '');
        if (!numero.startsWith(marca)) return max;
        const consecutivo = Number.parseInt(numero.slice(marca.length), 10);
        return Number.isFinite(consecutivo) ? Math.max(max, consecutivo) : max;
    }, 0);
    return `${marca}${String(maximo + 1).padStart(4, '0')}`;
}

function obtenerListaInicial(): Orden[] {
    return SEED.ordenes_servicio.map((orden, indice) => crearOrden({ ...orden, id: indice + 1 }));
}

export const ordenRepo = {
    listar(): Orden[] {
        const ordenes = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(ordenes) || ordenes.length === 0) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return ordenes.map((orden, indice) => crearOrden({ ...orden, id: orden.id ?? indice + 1 }));
    },

    obtenerPorId(id: number | string | null | undefined): Orden | null {
        if (id == null) return null;
        return this.listar().find((orden) => String(orden.id) === String(id)) ?? null;
    },

    listarPorUsuario(usuarioId: number | string | null | undefined): Orden[] {
        return this.listar().filter((orden) => String(orden.usuario_id) === String(usuarioId));
    },

    listarPorProyecto(proyectoId: number | string | null | undefined): Orden[] {
        return this.listar().filter((orden) => String(orden.proyecto_id) === String(proyectoId));
    },

    crear(data: EntradaOrden): Orden {
        const ordenes = this.listar();
        const siguienteId = generarIdUnico(ordenes);
        const numero = data.numero ?? siguienteNumero(ordenes);
        const orden = crearOrden({ ...data, id: siguienteId, numero });
        ordenes.push(orden);
        Storage.guardarValor(CLAVE, ordenes);
        return orden;
    },

    actualizar(id: number | string | null | undefined, data: EntradaOrden): Orden | null {
        if (id == null) return null;
        const ordenes = this.listar();
        const indice = ordenes.findIndex((orden) => String(orden.id) === String(id));
        if (indice === -1) {
            return null;
        }
        ordenes[indice] = crearOrden({ ...ordenes[indice], ...data, id: ordenes[indice].id });
        Storage.guardarValor(CLAVE, ordenes);
        return ordenes[indice];
    },

    cancelar(id: number | string | null | undefined): Orden | null {
        return this.actualizar(id, { estado: 'cancelada' });
    },
};

export default ordenRepo;
