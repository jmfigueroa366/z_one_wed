// CAPA: Dominio
export function formatearMoneda(valor: unknown, locale = 'es-CO', moneda = 'COP'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: moneda,
        maximumFractionDigits: 0,
    }).format(Number(valor) || 0);
}

export interface OpcionesFecha extends Intl.DateTimeFormatOptions {
    locale?: string;
}

export function formatearFecha(
    fecha: string | Date | null | undefined,
    { locale = 'es-CO', ...formato }: OpcionesFecha = {}
): string {
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
        ...formato,
    }).format(fechaValida);
}

export function normalizarTexto(valor: unknown): string {
    return String(valor ?? '').trim().toLocaleLowerCase();
}
