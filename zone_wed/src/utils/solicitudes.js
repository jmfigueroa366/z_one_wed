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