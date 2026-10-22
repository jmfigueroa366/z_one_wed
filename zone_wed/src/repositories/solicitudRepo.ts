// CAPA: Infraestructura
import { Storage, generarIdUnico } from '../infrastructure/storage.ts';
import { SEED } from '../data/seed.ts';
import { crearSolicitud } from '../models/Solicitud.ts';
import type { EntradaSolicitud, Solicitud } from '../models/Solicitud.ts';
import { sincronizarSolicitudes } from '../infrastructure/supabaseSync.ts';

const CLAVE = 'solicitudes';

function obtenerListaInicial(): Solicitud[] {
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
    listar(): Solicitud[] {
        const solicitudes = Storage.obtenerValor<unknown>(CLAVE, []);
        if (!Array.isArray(solicitudes) || !Storage.existeValor(CLAVE)) {
            Storage.guardarValor(CLAVE, obtenerListaInicial());
            return obtenerListaInicial();
        }
        return solicitudes.map((solicitud, indice) =>
            crearSolicitud({ ...solicitud, id: solicitud.id ?? indice + 1 })
        );
    },

    obtenerPorId(id: number | string | null | undefined): Solicitud | null {
        if (id == null) return null;
        return this.listar().find((solicitud) => String(solicitud.id) === String(id)) ?? null;
    },

    crear(data: EntradaSolicitud): Solicitud {
        const solicitudes = this.listar();
        const siguienteId = generarIdUnico(solicitudes);
        const solicitud = crearSolicitud({ ...data, id: siguienteId });
        solicitudes.push(solicitud);
        Storage.guardarValor(CLAVE, solicitudes);
        return solicitud;
    },

    // Guarda el id que Supabase asignó a la solicitud para que las
    // actualizaciones y borrados remotos apunten a la fila correcta.
    async registrarIdRemoto(id: number | string | null | undefined, idRemoto: unknown): Promise<void> {
        if (id == null || idRemoto == null) {
            return;
        }
        const solicitudes = this.listar();
        const indice = solicitudes.findIndex((solicitud) => String(solicitud.id) === String(id));
        if (indice === -1) {
            return;
        }
        solicitudes[indice] = crearSolicitud({ ...solicitudes[indice], id_remoto: idRemoto as number | string });
        Storage.guardarValor(CLAVE, solicitudes);
    },

    actualizar(id: number | string | null | undefined, data: EntradaSolicitud): Solicitud | null {
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