// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';

const CLAVE = 'grabaciones';

export const grabacionRepo = {
    listar() {
        const grabaciones = Storage.obtenerValor(CLAVE, []);
        return Array.isArray(grabaciones) ? grabaciones : [];
    },

    obtener(cancionId, parte = '') {
        return (
            this.listar().find(
                (grabacion) =>
                    String(grabacion.cancion_id) === String(cancionId)
                    && (grabacion.parte ?? '') === (parte ?? '')
            ) ?? null
        );
    },

    listarPorCancion(cancionId) {
        return this.listar().filter((grabacion) => String(grabacion.cancion_id) === String(cancionId));
    },

    guardar(data) {
        const grabaciones = this.listar();
        const parte = data.parte ?? '';
        const indice = grabaciones.findIndex(
            (grabacion) =>
                String(grabacion.cancion_id) === String(data.cancion_id)
                && (grabacion.parte ?? '') === parte
        );
        const previa = indice >= 0 ? grabaciones[indice] : null;
        const registro = {
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

    eliminar(cancionId, parte = '') {
        const grabaciones = this.listar().filter(
            (grabacion) =>
                !(String(grabacion.cancion_id) === String(cancionId) && (grabacion.parte ?? '') === (parte ?? ''))
        );
        Storage.guardarValor(CLAVE, grabaciones);
        return grabaciones;
    },

    eliminarPorCancion(cancionId) {
        const grabaciones = this.listar().filter((grabacion) => String(grabacion.cancion_id) !== String(cancionId));
        Storage.guardarValor(CLAVE, grabaciones);
        return grabaciones;
    },
};

export default grabacionRepo;