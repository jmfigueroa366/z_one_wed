// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.js';
import { FACTURACION } from '../config/facturacion.js';

const CLAVE = 'configuracion_facturacion';

export const configuracionRepo = {
    obtener() {
        const guardada = Storage.obtenerValor(CLAVE, {});
        const base = guardada && typeof guardada === 'object' ? guardada : {};
        return { ...FACTURACION, ...base };
    },

    guardar(cambios) {
        const actual = this.obtener();
        Storage.guardarValor(CLAVE, { ...actual, ...cambios });
        return this.obtener();
    },

    restablecer() {
        Storage.guardarValor(CLAVE, { ...FACTURACION });
        return { ...FACTURACION };
    },
};

export default configuracionRepo;
