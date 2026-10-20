// CAPA: Dominio
import { ESTADOS } from '../config/estados.ts';
import type { Entrada } from './entrada.ts';

const ESTADOS_SOLICITUD = ESTADOS.solicitud;
const ESTADOS_INVITACION = ESTADOS.invitacion;

export interface Invitacion {
    colaborador_id: number | null;
    rol: string | null;
    estado: string;
    [key: string]: unknown;
}

export type EntradaInvitacion = Entrada<Invitacion>;

export interface Solicitud {
    id: number | null;
    usuario_id: number | null;
    solicitante_nombre: string | null;
    titulo: string;
    descripcion: string;
    tipo: string;
    sala_id: number | null;
    cancion_id: number | null;
    proyecto_id: number | null;
    partes: string[];
    fecha: string | null;
    franja: string;
    fecha_solicitud: string | null;
    colaboradores: Invitacion[];
    estado: string;
    [key: string]: unknown;
}

export type EntradaSolicitud = Entrada<Solicitud>;

export function crearInvitacion(data: EntradaInvitacion = {}): Invitacion {
    const estado = data.estado ?? 'pendiente';
    if (!ESTADOS_INVITACION.estados.includes(estado)) {
        throw new Error(`Estado inválido para invitación: "${estado}".`);
    }
    return {
        colaborador_id: data.colaborador_id ?? null,
        rol: data.rol ?? null,
        estado,
    };
}

export function crearSolicitud(data: EntradaSolicitud = {}): Solicitud {
    const estado = data.estado ?? 'solicitada';
    if (!ESTADOS_SOLICITUD.estados.includes(estado)) {
        throw new Error(`Estado inválido para solicitud: "${estado}".`);
    }
    return {
        ...data,
        id: data.id ?? null,
        usuario_id: data.usuario_id ?? null,
        solicitante_nombre: data.solicitante_nombre ?? null,
        titulo: data.titulo ?? '',
        descripcion: data.descripcion ?? '',
        tipo: data.tipo ?? 'grabacion',
        sala_id: data.sala_id ?? null,
        cancion_id: data.cancion_id ?? null,
        proyecto_id: data.proyecto_id ?? null,
        partes: data.partes ?? [],
        fecha: data.fecha ?? null,
        franja: data.franja ?? '',
        fecha_solicitud: data.fecha_solicitud ?? null,
        colaboradores: (Array.isArray(data.colaboradores) ? data.colaboradores : []).map(crearInvitacion),
        estado,
    };
}

export const TIPOS_SOLICITUD = Object.freeze({
    GRABACION: 'grabacion',
    MEZCLA: 'mezcla',
    MASTERIZACION: 'masterizacion',
    ENSAYO: 'ensayo',
    PRODUCCION: 'produccion',
});

export const Solicitud = {
    crear: crearSolicitud,
    colaboradoresDe(solicitud: Solicitud | null | undefined): Invitacion[] {
        return Array.isArray(solicitud?.colaboradores) ? solicitud.colaboradores : [];
    },
    invitacionDe(solicitud: Solicitud | null | undefined, colaboradorId: unknown): Invitacion | null {
        return this.colaboradoresDe(solicitud)
            .find((invitacion) => String(invitacion.colaborador_id) === String(colaboradorId)) ?? null;
    },
    todosRespondieron(solicitud: Solicitud | null | undefined): boolean {
        const invitaciones = this.colaboradoresDe(solicitud);
        return invitaciones.length > 0 && invitaciones.every((invitacion) => invitacion.estado !== 'pendiente');
    },
    todosAceptaron(solicitud: Solicitud | null | undefined): boolean {
        const invitaciones = this.colaboradoresDe(solicitud);
        return invitaciones.length > 0 && invitaciones.every((invitacion) => invitacion.estado === 'aceptada');
    },
    estaPendiente(solicitud: Solicitud | null | undefined): boolean {
        return solicitud != null && solicitud.estado === 'solicitada';
    },
    puedeTransicionar(solicitud: Solicitud | null | undefined, nuevoEstado: string): boolean {
        return solicitud != null &&
            ESTADOS_SOLICITUD.transiciones[solicitud.estado]?.includes(nuevoEstado) === true;
    },
};

export default crearSolicitud;
