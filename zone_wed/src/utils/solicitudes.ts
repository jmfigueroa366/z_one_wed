// CAPA: Dominio
import { ESTADOS_SOLICITUD_ACTIVOS } from '../config/estados.ts';
import type { Sala } from '../models/Sala.ts';
import type { Sesion } from '../models/Sesion.ts';
import type { Solicitud } from '../models/Solicitud.ts';
import type { Colaborador } from '../models/Colaborador.ts';

export const ETIQUETAS_ESTADO: Record<string, string> = {
    solicitada: 'Solicitada',
    por_autorizar: 'Por autorizar',
    por_pagar: 'Por pagar',
    confirmada: 'Confirmada',
    rechazada: 'Rechazada',
    cancelada: 'Cancelada',
};

export { ESTADOS_SOLICITUD_ACTIVOS };

export const ETIQUETAS_INVITACION: Record<string, string> = {
    pendiente: 'Pendiente',
    aceptada: 'Aceptó',
    rechazada: 'Rechazó',
};

export const ETIQUETAS_TIPO: Record<string, string> = {
    grabacion: 'Grabación',
    mezcla: 'Mezcla',
    masterizacion: 'Masterización',
    ensayo: 'Ensayo',
    produccion: 'Producción',
};

export const ETIQUETAS_ROL: Record<string, string> = {
    artista: 'Artista',
    productor: 'Productor',
    ingeniero: 'Ingeniero',
};

export function etiquetaEstado(estado: string | null | undefined): string {
    return (estado != null ? ETIQUETAS_ESTADO[estado] : undefined) ?? estado ?? '';
}

export function etiquetaInvitacion(estado: string | null | undefined): string {
    return (estado != null ? ETIQUETAS_INVITACION[estado] : undefined) ?? estado ?? '';
}

export function etiquetaTipo(tipo: string | null | undefined): string {
    return (tipo != null ? ETIQUETAS_TIPO[tipo] : undefined) ?? (tipo ?? 'Grabación');
}

export function etiquetaRol(rol: string | null | undefined): string {
    return (rol != null ? ETIQUETAS_ROL[rol] : undefined) ?? (rol ?? 'Colaborador');
}

export function rolDeColaborador(colaborador: Colaborador | null | undefined): string {
    const especialidad = String(colaborador?.especialidad ?? '').toLowerCase();
    if (especialidad.includes('producc')) return 'productor';
    if (especialidad.includes('ingenier')) return 'ingeniero';
    return 'artista';
}

export function duracionFranja(franja: unknown): number | '' {
    const horas = String(franja ?? '').match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!horas) return '';
    const inicio = Number(horas[1]) * 60 + Number(horas[2]);
    let fin = Number(horas[3]) * 60 + Number(horas[4]);
    if (fin < inicio) fin += 24 * 60;
    return Math.max(0, (fin - inicio) / 60);
}

export function estimadoSala(sala: Sala | null | undefined, franja: unknown): number | null {
    const horas = duracionFranja(franja);
    return sala && horas ? sala.precio_hora * horas : null;
}

export function aMinutos(hora: unknown): number {
    const partes = String(hora ?? '').split(':');
    if (partes.length < 2) return NaN;
    return Number(partes[0]) * 60 + Number(partes[1]);
}

export function franjaEnMinutos(franja: unknown): [number, number] | null {
    const [inicio, fin] = String(franja ?? '').split('-').map((valor) => valor.trim());
    const inicioMin = aMinutos(inicio);
    const finMin = aMinutos(fin);
    return Number.isFinite(inicioMin) && Number.isFinite(finMin) ? [inicioMin, finMin] : null;
}

export function seSolapan(franjaA: unknown, franjaB: unknown): boolean {
    const A = franjaEnMinutos(franjaA);
    const B = franjaEnMinutos(franjaB);
    if (!A || !B) return false;
    return Math.max(A[0], B[0]) < Math.min(A[1], B[1]);
}

export interface ParametrosFranjasOcupadas {
    fecha: string | null | undefined;
    salaId: unknown;
    solicitudes?: Solicitud[];
    sesiones?: Sesion[];
}

export function franjasOcupadas({
    fecha,
    salaId,
    solicitudes = [],
    sesiones = [],
}: ParametrosFranjasOcupadas): string[] {
    const deSolicitudes = solicitudes
        .filter((solicitud) =>
            String(solicitud.sala_id) === String(salaId)
            && solicitud.fecha === fecha
            && ESTADOS_SOLICITUD_ACTIVOS.includes(solicitud.estado))
        .map((solicitud) => solicitud.franja)
        .filter((franja): franja is string => Boolean(franja));

    const deSesiones = sesiones
        .filter((sesion) =>
            String(sesion.sala_id) === String(salaId)
            && sesion.fecha === fecha
            && sesion.estado !== 'cancelada')
        .map((sesion) => `${sesion.hora_inicio}-${sesion.hora_fin}`)
        .filter((franja): franja is string => Boolean(franja));

    return [...new Set([...deSolicitudes, ...deSesiones])];
}
