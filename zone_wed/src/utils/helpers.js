// CAPA: Dominio
export function formatearMoneda(valor, locale = 'es-CO', moneda = 'COP') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: moneda,
        maximumFractionDigits: 0,
    }).format(Number(valor) || 0);
}

export function formatearFecha(fecha, locale = 'es-CO') {
    if (!fecha) {
        return '';
    }

    const fechaValida = fecha instanceof Date ? fecha : new Date(`${fecha}T00:00:00`);
    if (Number.isNaN(fechaValida.getTime())) {
        return '';
    }

    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(fechaValida);
}

export function normalizarTexto(valor) {
    return String(valor ?? '').trim().toLocaleLowerCase();
}
