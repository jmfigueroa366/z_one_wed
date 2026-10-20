// CAPA: Dominio
import { ESTADOS } from '../config/estados.ts';

const ESTADOS_SESION = ESTADOS.sesion;

export interface Sesion {
    id: number | null;
    solicitud_id: number | null;
    titulo: string;
    tipo: string | null;
    sala_id: number | null;
    colaborador_id: number | null;
    fecha: string | null;
    hora_inicio: string | null;
    hora_fin: string | null;
    estado: string;
    cancion_id: number | null;
    proyecto_id: number | null;
    partes: string[];
    duracion?: number | null;
    [key: string]: unknown;
}

export type EntradaSesion = Partial<Sesion>;

export function crearSesion(data: EntradaSesion = {}): Sesion {
    const estado = data.estado ?? 'solicitada';
    if (!ESTADOS_SESION.estados.includes(estado)) {
        throw new Error(`Estado inválido para sesión: "${estado}".`);
    }
    return {
        id: data.id ?? null,
        solicitud_id: data.solicitud_id ?? null,
        titulo: data.titulo ?? '',
        tipo: data.tipo ?? null,
        sala_id: data.sala_id ?? null,
        colaborador_id: data.colaborador_id ?? null,
        fecha: data.fecha ?? null,
        hora_inicio: data.hora_inicio ?? null,
        hora_fin: data.hora_fin ?? null,
        estado,
        cancion_id: data.cancion_id ?? null,
        proyecto_id: data.proyecto_id ?? null,
        partes: data.partes ?? [],
        ...data,
    };
}

export const Sesion = {
    crear: crearSesion,
    estaActiva(sesion: Sesion | null | undefined): boolean {
        return sesion != null && ['solicitada', 'confirmada'].includes(sesion.estado);
    },
    puedeTransicionar(sesion: Sesion | null | undefined, nuevoEstado: string): boolean {
        return sesion != null &&
            ESTADOS_SESION.transiciones[sesion.estado]?.includes(nuevoEstado) === true;
    },
};

export default crearSesion;
