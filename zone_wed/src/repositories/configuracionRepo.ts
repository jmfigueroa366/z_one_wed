// CAPA: Infraestructura
import { Storage } from '../infrastructure/storage.ts';
import { FACTURACION } from '../config/facturacion.ts';
import type { FacturacionConfig } from '../config/facturacion.ts';

const CLAVE = 'configuracion_facturacion';

export const configuracionRepo = {
    obtener(): FacturacionConfig {
        const guardada = Storage.obtenerValor<Record<string, unknown>>(CLAVE, {});
        const base = guardada && typeof guardada === 'object' ? guardada : {};
        return { ...FACTURACION, ...base };
    },

    guardar(cambios: Partial<FacturacionConfig>): FacturacionConfig {
        const actual = this.obtener();
        Storage.guardarValor(CLAVE, { ...actual, ...cambios });
        return this.obtener();
    },

    restablecer(): FacturacionConfig {
        Storage.guardarValor(CLAVE, { ...FACTURACION });
        return { ...FACTURACION };
    },
};

export default configuracionRepo;
