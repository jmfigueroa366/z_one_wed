// CAPA: Dominio

export const ETIQUETAS_ESTADO = {
    solicitud: 'Nueva',
    en_negociacion: 'En negociación',
    confirmada: 'Confirmada',
    rechazada: 'Rechazada',
    expirada: 'Expirada',
};

export const ETIQUETAS_TIPO = {
    grabacion: 'Grabación',
    mezcla: 'Mezcla',
    masterizacion: 'Masterización',
    ensayo: 'Ensayo',
    produccion: 'Producción',
};

export function etiquetaEstado(estado) {
    return ETIQUETAS_ESTADO[estado] ?? estado;
}

export function etiquetaTipo(tipo) {
    return ETIQUETAS_TIPO[tipo] ?? (tipo ?? 'Grabación');
}

export function duracionFranja(franja) {
    const horas = String(franja ?? '').match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!horas) return '';
    const inicio = Number(horas[1]) * 60 + Number(horas[2]);
    let fin = Number(horas[3]) * 60 + Number(horas[4]);
    if (fin < inicio) fin += 24 * 60;
    return Math.max(0, (fin - inicio) / 60);
}

export function estimadoSala(sala, franja) {
    const horas = duracionFranja(franja);
    return sala && horas ? sala.precio_hora * horas : null;
}

export function aMinutos(hora) {
    const partes = String(hora ?? '').split(':');
    if (partes.length < 2) return NaN;
    return Number(partes[0]) * 60 + Number(partes[1]);
}

export function franjaEnMinutos(franja) {
    const [inicio, fin] = String(franja ?? '').split('-').map((valor) => valor.trim());
    const inicioMin = aMinutos(inicio);
    const finMin = aMinutos(fin);
    return Number.isFinite(inicioMin) && Number.isFinite(finMin) ? [inicioMin, finMin] : null;
}

export function seSolapan(franjaA, franjaB) {
    const A = franjaEnMinutos(franjaA);
    const B = franjaEnMinutos(franjaB);
    if (!A || !B) return false;
    return Math.max(A[0], B[0]) < Math.min(A[1], B[1]);
}

export function franjasOcupadas({ fecha, salaId, solicitudes = [], sesiones = [] }) {
    const deSolicitudes = solicitudes
        .filter((solicitud) =>
            String(solicitud.sala_id) === String(salaId)
            && solicitud.fecha === fecha
            && ['solicitud', 'en_negociacion', 'confirmada'].includes(solicitud.estado))
        .map((solicitud) => solicitud.franja)
        .filter(Boolean);

    const deSesiones = sesiones
        .filter((sesion) =>
            String(sesion.sala_id) === String(salaId)
            && sesion.fecha === fecha
            && sesion.estado !== 'cancelada')
        .map((sesion) => `${sesion.hora_inicio}-${sesion.hora_fin}`)
        .filter(Boolean);

    return [...new Set([...deSolicitudes, ...deSesiones])];
}