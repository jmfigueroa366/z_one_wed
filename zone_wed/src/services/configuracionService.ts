// CAPA: Aplicación
import { configuracionRepo } from '../repositories/configuracionRepo.ts';
import { FACTURACION } from '../config/facturacion.ts';
import type { FacturacionConfig } from '../config/facturacion.ts';

const CAMPOS_MONETARIOS: (keyof FacturacionConfig)[] = [
    'tarifaProduccionHora',
    'tarifaEnsayoHora',
    'umbralAlbumDescuento',
    'bloqueRedondeoMin',
];

const CAMPOS_PORCENTAJE: (keyof FacturacionConfig)[] = ['descuentoAlbum', 'anticipoPorcentaje', 'cancelacionPorcentaje'];

function validar(cambios: Partial<FacturacionConfig> = {}): Partial<FacturacionConfig> {
    const limpio: Partial<FacturacionConfig> = {};

    CAMPOS_MONETARIOS.forEach((campo) => {
        if (cambios[campo] === undefined) return;
        const valor = Number(cambios[campo]);
        if (!Number.isFinite(valor) || valor <= 0) {
            throw new Error(`"${campo}" debe ser un número mayor que cero.`);
        }
        limpio[campo] = valor;
    });

    CAMPOS_PORCENTAJE.forEach((campo) => {
        if (cambios[campo] === undefined) return;
        const valor = Number(cambios[campo]);
        if (!Number.isFinite(valor) || valor < 0 || valor > 1) {
            throw new Error(`"${campo}" debe ser un porcentaje entre 0 y 1.`);
        }
        limpio[campo] = valor;
    });

    if (cambios.cancelacionHorasGratis !== undefined) {
        const valor = Number(cambios.cancelacionHorasGratis);
        if (!Number.isFinite(valor) || valor < 0) {
            throw new Error('"cancelacionHorasGratis" no puede ser negativa.');
        }
        limpio.cancelacionHorasGratis = valor;
    }

    return limpio;
}

export const ConfiguracionService = {
    obtener(): FacturacionConfig {
        return configuracionRepo.obtener();
    },

    predeterminada(): FacturacionConfig {
        return { ...FACTURACION };
    },

    actualizar(cambios: Partial<FacturacionConfig> = {}): FacturacionConfig {
        return configuracionRepo.guardar(validar(cambios));
    },

    restablecer(): FacturacionConfig {
        return configuracionRepo.restablecer();
    },
};

export default ConfiguracionService;
