// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';
import { SEED } from '../data/seed.js';
import { crearSolicitud } from '../models/Solicitud.js';
import { sincronizarSolicitudes } from '../infrastructure/supabaseSync.js';

const CLAVE = 'solicitudes';

function obtenerListaInicial() {
    return SEED.solicitudes.map((solicitud, indice) =>
        crearSolicitud({ ...solicitud, id: solicitud.id ?? indice + 1 })
    );
}

// Sincroniza solicitudes desde Supabase una vez al cargar el módulo.
let sincronizado = false;
export async function sincronizar() {
    if (sincronizado) {
        return;
    }
    try {
        await sincronizarSolicitudes();
        sincronizado = true;
    } catch (error) {
        console.warn('No se pudieron sincronizar las solicitudes con Supabase.', error);
    }
}

sincronizar();

export const solicitudRepo = {
    listar() {
        const solicitudes = Storage.obtenerValor(CLAVE, []);
        if (!Array.isArray(solicitudes) || solicitudes.length === 0) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return solicitudes.map((solicitud, indice) =>
            crearSolicitud({ ...solicitud, id: solicitud.id ?? indice + 1 })
        );
    },

    obtenerPorId(id) {
        if (id == null) return null;
        return this.listar().find((solicitud) => String(solicitud.id) === String(id)) ?? null;
    },

    crear(data) {
        const solicitudes = this.listar();
        const siguienteId = solicitudes.reduce((max, solicitud) => Math.max(max, Number(solicitud.id) || 0), 0) + 1;
        const solicitud = crearSolicitud({ ...data, id: siguienteId });
        solicitudes.push(solicitud);
        Storage.guardarValor(CLAVE, solicitudes);
        return solicitud;
    },

    actualizar(id, data) {
        if (id == null) return null;
        const solicitudes = this.listar();
        const indice = solicitudes.findIndex((solicitud) => String(solicitud.id) === String(id));
        if (indice === -1) {
            return null;
        }
        solicitudes[indice] = crearSolicitud({ ...solicitudes[indice], ...data, id: solicitudes[indice].id });
        Storage.guardarValor(CLAVE, solicitudes);
        return solicitudes[indice];
    },
};

export default solicitudRepo;