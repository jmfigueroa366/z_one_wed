// CAPA: Dominio
import { TIPOS_PROYECTO } from '../config/facturacion.js';

export function crearProyecto(data = {}) {
    const tipo = data.tipo ?? TIPOS_PROYECTO.SENCILLO;
    if (!Object.values(TIPOS_PROYECTO).includes(tipo)) {
        throw new Error(`Tipo de proyecto inválido: "${tipo}".`);
    }
    return {
        id: data.id ?? null,
        nombre: data.nombre ?? '',
        usuario_id: data.usuario_id ?? null,
        tipo,
        creado_en: data.creado_en ?? new Date().toISOString(),
        ...data,
    };
}

export const Proyecto = {
    crear: crearProyecto,
};

export default crearProyecto;