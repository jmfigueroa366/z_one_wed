// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';
import { SEED } from '../data/seed.js';
import { crearSolicitud } from '../models/Solicitud.js';

const CLAVE = 'solicitudes';

function obtenerListaInicial() {
    return SEED.solicitudes.map((solicitud, indice) =>
        crearSolicitud({ ...solicitud, id: solicitud.id ?? indice + 1 })
    );
}

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
        return this.listar().find((solicitud) => String(solicitud.id ?? solicitud.colaborador_id) === String(id)) ?? null;
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
        const solicitudes = this.listar();
        const indice = solicitudes.findIndex((solicitud) => String(solicitud.id) === String(id));
        if (indice === -1) {
            return null;
        }
        solicitudes[indice] = crearSolicitud({ ...solicitudes[indice], ...data, id: solicitudes[indice].id });
        Storage.guardarValor(CLAVE, solicitudes);
        return solicitudes[indice];
    },

    eliminar(id) {
        const solicitudes = this.listar().filter((solicitud) => String(solicitud.id) !== String(id));
        Storage.guardarValor(CLAVE, solicitudes);
        return solicitudes;
    },
};

export default solicitudRepo;
