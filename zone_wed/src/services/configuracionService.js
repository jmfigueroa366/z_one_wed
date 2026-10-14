// CAPA: Aplicación
import { configuracionRepo } from '../repositories/configuracionRepo.js';
import { FACTURACION } from '../config/facturacion.js';

const CAMPOS_MONETARIOS = [
    'tarifaProduccionHora',
    'tarifaEnsayoHora',
    'umbralAlbumDescuento',
    'bloqueRedondeoMin',
];

const CAMPOS_PORCENTAJE = ['descuentoAlbum', 'anticipoPorcentaje', 'cancelacionPorcentaje'];

function validar(cambios = {}) {
    const limpio = {};

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
    obtener() {
        return configuracionRepo.obtener();
    },

    predeterminada() {
        return { ...FACTURACION };
    },

    actualizar(cambios) {
        return configuracionRepo.guardar(validar(cambios));
    },

    restablecer() {
        return configuracionRepo.restablecer();
    },
};

export default ConfiguracionService;
