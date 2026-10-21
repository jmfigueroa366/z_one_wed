// CAPA: Dominio
import { TIPOS_PROYECTO } from '../config/facturacion.ts';

export interface Proyecto {
    id: number | string | null;
    // Id que la fila tiene en Supabase (null si el proyecto solo existe en local).
    id_remoto: number | string | null;
    nombre: string;
    usuario_id: number | string | null;
    tipo: string;
    creado_en: string;
    // 'seed' para los datos de ejemplo, 'usuario' para los reales.
    origen?: 'seed' | 'usuario';
    [key: string]: unknown;
}

export type EntradaProyecto = Partial<Proyecto>;

export function crearProyecto(data: EntradaProyecto = {}): Proyecto {
    const tipo = data.tipo ?? TIPOS_PROYECTO.SENCILLO;
    if (!(Object.values(TIPOS_PROYECTO) as string[]).includes(tipo)) {
        throw new Error(`Tipo de proyecto inválido: "${tipo}".`);
    }
    return {
        ...data,
        id: data.id ?? null,
        id_remoto: data.id_remoto ?? null,
        nombre: data.nombre ?? '',
        usuario_id: data.usuario_id ?? null,
        tipo,
        creado_en: data.creado_en ?? new Date().toISOString(),
        origen: data.origen ?? 'usuario',
    };
}

export const Proyecto = {
    crear: crearProyecto,
};

export default crearProyecto;
