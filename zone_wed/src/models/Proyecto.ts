// CAPA: Dominio
import { TIPOS_PROYECTO } from '../config/facturacion.ts';

export interface Proyecto {
    id: number | string | null;
    nombre: string;
    usuario_id: number | string | null;
    tipo: string;
    creado_en: string;
    [key: string]: unknown;
}

export type EntradaProyecto = Partial<Proyecto>;

export function crearProyecto(data: EntradaProyecto = {}): Proyecto {
    const tipo = data.tipo ?? TIPOS_PROYECTO.SENCILLO;
    if (!(Object.values(TIPOS_PROYECTO) as string[]).includes(tipo)) {
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
