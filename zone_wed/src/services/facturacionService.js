// CAPA: Aplicación
// Funciones puras de facturación. No acceden a repositorios ni a Storage:
// reciben datos y configuración, y devuelven números. Así son testeables.
import { FACTURACION } from '../config/facturacion.js';
import { aMinutos } from '../utils/solicitudes.js';

export function redondearMoneda(valor) {
    return Math.round(Number(valor) || 0);
}

export function minutosDeFranja(horaInicio, horaFin) {
    if (!horaInicio || !horaFin) return 0;
    const inicio = aMinutos(horaInicio);
    let fin = aMinutos(horaFin);
    if (!Number.isFinite(inicio) || !Number.isFinite(fin)) return 0;
    if (fin <= inicio) fin += 24 * 60;
    return Math.max(0, fin - inicio);
}

// Redondea horas hacia arriba a bloques (por defecto 30 min).
export function redondearHaciaArribaBloque(horas, bloqueMin = FACTURACION.bloqueRedondeoMin) {
    const bloqueHoras = bloqueMin / 60;
    if (bloqueHoras <= 0) return Number(horas) || 0;
    return Math.ceil((Number(horas) || 0) / bloqueHoras) * bloqueHoras;
}

// Suma las horas de una lista de sesiones, redondeando cada franja hacia arriba.
export function horasDesdeSesiones(sesiones = [], { bloqueMin = FACTURACION.bloqueRedondeoMin } = {}) {
    return (sesiones ?? []).reduce((total, sesion) => {
        const horas = minutosDeFranja(sesion?.hora_inicio, sesion?.hora_fin) / 60;
        return total + redondearHaciaArribaBloque(horas, bloqueMin);
    }, 0);
}

// Total de un sencillo/canción: producción + (ensayo solo si la canción lo requiere).
export function calcularTotalCancion(
    { horasProduccion = 0, horasEnsayo = 0, requiereEnsayo = false } = {},
    config = FACTURACION
) {
    const subtotalProduccion = redondearMoneda(horasProduccion * config.tarifaProduccionHora);
    const subtotalEnsayo = requiereEnsayo
        ? redondearMoneda(horasEnsayo * config.tarifaEnsayoHora)
        : 0;
    return {
        horasProduccion,
        horasEnsayo: requiereEnsayo ? horasEnsayo : 0,
        subtotalProduccion,
        descuento: 0,
        subtotalEnsayo,
        total: subtotalProduccion + subtotalEnsayo,
    };
}

// Descuento de álbum: porcentaje SOLO sobre el subtotal de producción.
export function aplicarDescuentoAlbum(subtotalProduccion, cantidadCanciones, config = FACTURACION) {
    const bruto = redondearMoneda(subtotalProduccion);
    if (cantidadCanciones > config.umbralAlbumDescuento) {
        return redondearMoneda(bruto * config.descuentoAlbum);
    }
    return 0;
}

// Total de un álbum/EP: horas acumuladas por día + ensayo, con descuento.
export function calcularTotalAlbum(
    { horasPorDia = [], horasEnsayo = 0, cantidadCanciones = 0 } = {},
    config = FACTURACION
) {
    const dias = Array.isArray(horasPorDia) ? horasPorDia : [];
    const horasProduccion = dias.reduce((suma, horas) => suma + (Number(horas) || 0), 0);
    const subtotalProduccion = redondearMoneda(horasProduccion * config.tarifaProduccionHora);
    const descuento = aplicarDescuentoAlbum(subtotalProduccion, cantidadCanciones, config);
    const subtotalEnsayo = redondearMoneda(horasEnsayo * config.tarifaEnsayoHora);
    return {
        horasProduccion,
        horasEnsayo,
        subtotalProduccion,
        descuento,
        subtotalEnsayo,
        total: subtotalProduccion - descuento + subtotalEnsayo,
    };
}

// Total de una sesión suelta (una franja): horas redondeadas × tarifa según tipo.
// Se usa para estimar el anticipo de una reserva confirmada.
export function calcularTotalSesion(
    { tipo, horaInicio, horaFin } = {},
    config = FACTURACION
) {
    const esEnsayo = tipo === 'ensayo';
    const horas = redondearHaciaArribaBloque(
        minutosDeFranja(horaInicio, horaFin) / 60,
        config.bloqueRedondeoMin
    );
    const tarifa = esEnsayo ? config.tarifaEnsayoHora : config.tarifaProduccionHora;
    const subtotal = redondearMoneda(horas * tarifa);
    return {
        horasProduccion: esEnsayo ? 0 : horas,
        horasEnsayo: esEnsayo ? horas : 0,
        subtotalProduccion: esEnsayo ? 0 : subtotal,
        descuento: 0,
        subtotalEnsayo: esEnsayo ? subtotal : 0,
        total: subtotal,
    };
}

// Anticipo (sobre el estimado) y saldo (sobre el real menos lo ya pagado).
export function calcularAnticipoYSaldo(
    { total = 0, totalEstimado = 0, anticipoPagado = 0 } = {},
    config = FACTURACION
) {
    const anticipo = redondearMoneda(totalEstimado * config.anticipoPorcentaje);
    const saldo = redondearMoneda(total - anticipoPagado);
    return {
        anticipo,
        saldo,
        saldoFavor: saldo < 0 ? -saldo : 0,
    };
}

// Política de cancelación: gratis con >= 24 h de anticipación; si no, 50% del estimado.
export function aplicarPoliticaCancelacion(
    { estimado = 0, horasAnticipacion = 0 } = {},
    config = FACTURACION
) {
    if (horasAnticipacion >= config.cancelacionHorasGratis) {
        return { cargo: 0, aplica: false };
    }
    return { cargo: redondearMoneda(estimado * config.cancelacionPorcentaje), aplica: true };
}

export default {
    redondearMoneda,
    minutosDeFranja,
    redondearHaciaArribaBloque,
    horasDesdeSesiones,
    calcularTotalCancion,
    aplicarDescuentoAlbum,
    calcularTotalAlbum,
    calcularTotalSesion,
    calcularAnticipoYSaldo,
    aplicarPoliticaCancelacion,
};
