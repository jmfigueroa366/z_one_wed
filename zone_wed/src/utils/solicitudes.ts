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

export const PATRON_HORA = /^(\d{1,2}):(\d{2})$/;

export function franjaEnMinutos(franja: unknown): [number, number] | null {
    const partes = String(franja ?? '').split('-').map((valor) => valor.trim());
    if (partes.length !== 2) return null;
    const inicio = PATRON_HORA.exec(partes[0]);
    const fin = PATRON_HORA.exec(partes[1]);
    if (!inicio || !fin) return null;
    const inicioHoras = Number(inicio[1]);
    const inicioMin = Number(inicio[2]);
    const finHoras = Number(fin[1]);
    const finMinutos = Number(fin[2]);
    // HH:MM con horas 0-23 y minutos 0-59.
    if (inicioHoras > 23 || finHoras > 23 || inicioMin > 59 || finMinutos > 59) return null;
    const inicioTotal = inicioHoras * 60 + inicioMin;
    let finTotal = finHoras * 60 + finMinutos;
    // Franja que cruza la medianoche (23:00-01:00): se normaliza al día siguiente.
    if (finTotal < inicioTotal) finTotal += 24 * 60;
    return [inicioTotal, finTotal];
}

export function seSolapan(franjaA: unknown, franjaB: unknown): boolean {
    const A = franjaEnMinutos(franjaA);
    const B = franjaEnMinutos(franjaB);
    if (!A || !B) return false;
    // Las franjas pueden cruzar la medianoche, así que comparamos también el
    // desplazamiento de un día para detectar choques entre 23:00-01:00 y 00:30.
    const choca = ([a0, a1]: [number, number], [b0, b1]: [number, number]) =>
        Math.max(a0, b0) < Math.min(a1, b1);
    return (
        choca(A, B)
        || choca(A, [B[0] + 24 * 60, B[1] + 24 * 60])
        || choca([A[0] + 24 * 60, A[1] + 24 * 60], B)
    );
}

// Formato esperado: HH:MM-HH:MM con horas de 00 a 23.
export function esFranjaValida(franja: unknown): boolean {
    const A = franjaEnMinutos(franja);
    return A != null && A[1] > A[0];
}

// ¿La sala/fecha/franja ya está comprometida por una solicitud o sesión activa?
export function hayConflicto({
    salaId,
    fecha,
    franja,
    solicitudes = [],
    sesiones = [],
    excluirSolicitudId = null,
    excluirSesionId = null,
}: {
    salaId: number | string | null | undefined;
    fecha: string | null | undefined;
    franja: string | null | undefined;
    solicitudes?: Solicitud[];
    sesiones?: Sesion[];
    excluirSolicitudId?: number | string | null;
    excluirSesionId?: number | string | null;
}): boolean {
    if (salaId == null || !fecha || !esFranjaValida(franja)) return false;

    const chocaConSolicitud = solicitudes.some((solicitud) =>
        ESTADOS_SOLICITUD_ACTIVOS.includes(solicitud.estado) &&
        (excluirSolicitudId == null || String(solicitud.id) !== String(excluirSolicitudId)) &&
        String(solicitud.sala_id) === String(salaId) &&
        solicitud.fecha === fecha &&
        seSolapan(solicitud.franja, franja)
    );
    if (chocaConSolicitud) {
        return true;
    }

    return sesiones.some((sesion) =>
        sesion.estado !== 'cancelada' &&
        (excluirSesionId == null || String(sesion.id) !== String(excluirSesionId)) &&
        String(sesion.sala_id) === String(salaId) &&
        sesion.fecha === fecha &&
        seSolapan(`${sesion.hora_inicio ?? ''}-${sesion.hora_fin ?? ''}`, franja)
    );
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
