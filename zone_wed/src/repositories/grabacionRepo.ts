// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.ts';

export interface Grabacion {
    id: number;
    cancion_id: number | string | null;
    parte: string;
    dataUrl: string | null;
    duracion: number | null;
    creado_en: string;
    [key: string]: unknown;
}

export interface EntradaGrabacion {
    cancion_id: number | string | null;
    parte?: string;
    dataUrl: string | null;
    duracion?: number | null;
    [key: string]: unknown;
}

const CLAVE = 'grabaciones';

export const grabacionRepo = {
    listar(): Grabacion[] {
        const grabaciones = Storage.obtenerValor<unknown>(CLAVE, []);
        return Array.isArray(grabaciones) ? grabaciones.map((item) => item as Grabacion) : [];
    },

    obtener(cancionId: number | string, parte = ''): Grabacion | null {
        return (
            this.listar().find(
                (grabacion) =>
                    String(grabacion.cancion_id) === String(cancionId)
                    && (grabacion.parte ?? '') === (parte ?? '')
            ) ?? null
        );
    },

    listarPorCancion(cancionId: number | string): Grabacion[] {
        return this.listar().filter((grabacion) => String(grabacion.cancion_id) === String(cancionId));
    },

    guardar(data: { cancion_id: number | string; parte?: string; dataUrl: string; duracion?: number | null }): Grabacion {
        const grabaciones = this.listar();
        const parte = data.parte ?? '';
        const indice = grabaciones.findIndex(
            (grabacion) =>
                String(grabacion.cancion_id) === String(data.cancion_id)
                && (grabacion.parte ?? '') === parte
        );
        const previa = indice >= 0 ? grabaciones[indice] : null;
        const registro: Grabacion = {
            id: previa?.id ?? grabaciones.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1,
            cancion_id: data.cancion_id,
            parte,
            dataUrl: data.dataUrl,
            duracion: data.duracion ?? null,
            creado_en: previa?.creado_en ?? new Date().toISOString(),
        };
        if (indice >= 0) {
            grabaciones[indice] = registro;
        } else {
            grabaciones.push(registro);
        }
        Storage.guardarValor(CLAVE, grabaciones);
        return registro;
    },

    eliminar(cancionId: number | string, parte = ''): Grabacion[] {
        const grabaciones = this.listar().filter(
            (grabacion) =>
                !(String(grabacion.cancion_id) === String(cancionId) && (grabacion.parte ?? '') === (parte ?? ''))
        );
        Storage.guardarValor(CLAVE, grabaciones);
        return grabaciones;
    },

    eliminarPorCancion(cancionId: number | string): Grabacion[] {
        const grabaciones = this.listar().filter((grabacion) => String(grabacion.cancion_id) !== String(cancionId));
        Storage.guardarValor(CLAVE, grabaciones);
        return grabaciones;
    },
};

export default grabacionRepo;
