// CAPA: Dominio
import { ESTADOS } from '../config/estados.js';
import { TIPOS_ORDEN } from '../config/facturacion.js';

const ESTADOS_ORDEN = ESTADOS.orden;

// Métodos de pago aceptados. "tarjeta" es simulado (no hay pasarela real).
export const METODOS_PAGO = Object.freeze({
    EFECTIVO: 'efectivo',
    TRANSFERENCIA: 'transferencia',
    TARJETA: 'tarjeta',
});

export const ETIQUETAS_METODO = Object.freeze({
    [METODOS_PAGO.EFECTIVO]: 'Efectivo',
    [METODOS_PAGO.TRANSFERENCIA]: 'Transferencia',
    [METODOS_PAGO.TARJETA]: 'Tarjeta',
});

function redondear(valor) {
    return Math.round(Number(valor) || 0);
}

export function crearPago(data = {}) {
    const metodo = data.metodo;
    if (!Object.values(METODOS_PAGO).includes(metodo)) {
        throw new Error(`Método de pago inválido: "${metodo}".`);
    }
    const monto = redondear(data.monto);
    if (monto <= 0) {
        throw new Error('El monto del pago debe ser mayor que cero.');
    }
    return {
        id: data.id ?? null,
        monto,
        metodo,
        fecha: data.fecha ?? new Date().toISOString().slice(0, 10),
        registrado_por: data.registrado_por ?? null,
    };
}

export function crearOrden(data = {}) {
    const estado = data.estado ?? 'borrador';
    if (!ESTADOS_ORDEN.estados.includes(estado)) {
        throw new Error(`Estado inválido para orden: "${estado}".`);
    }

    const total = redondear(data.total ?? 0);
    const pagos = (data.pagos ?? []).map(crearPago);
    const pagado = redondear(pagos.reduce((suma, pago) => suma + pago.monto, 0));
    const saldo = redondear(total - pagado);

    return {
        id: data.id ?? null,
        numero: data.numero ?? '',
        tipo: data.tipo ?? TIPOS_ORDEN.CANCION,
        usuario_id: data.usuario_id ?? null,
        proyecto_id: data.proyecto_id ?? null,
        cancion_id: data.cancion_id ?? null,
        descripcion: data.descripcion ?? '',
        detalle: data.detalle ?? {},
        total_estimado: redondear(data.total_estimado ?? 0),
        anticipo: redondear(data.anticipo ?? 0),
        estado,
        fecha_emision: data.fecha_emision ?? null,
        fecha_vencimiento: data.fecha_vencimiento ?? null,
        fecha_cancelacion: data.fecha_cancelacion ?? null,
        cargo_cancelacion: redondear(data.cargo_cancelacion ?? 0),
        ...data,
        total,
        pagos,
        pagado,
        saldo,
        saldo_favor: redondear(data.saldo_favor ?? (saldo < 0 ? -saldo : 0)),
    };
}

export const Orden = {
    crear: crearOrden,
    puedePagar(orden) {
        return Boolean(orden) && ['facturada', 'parcial'].includes(orden.estado);
    },
    estaPagada(orden) {
        return Boolean(orden) && orden.estado === 'pagada';
    },
    saldoPendiente(orden) {
        return Math.max(0, redondear(orden?.total) - redondear(orden?.pagado));
    },
    puedeTransicionar(orden, nuevoEstado) {
        return Boolean(orden) &&
            ESTADOS_ORDEN.transiciones[orden.estado]?.includes(nuevoEstado) === true;
    },
    validarPago(orden, { monto } = {}) {
        if (!orden) {
            throw new Error('La orden no existe.');
        }
        if (!this.puedePagar(orden)) {
            throw new Error(
                orden.estado === 'pagada'
                    ? 'Esta orden ya fue pagada por completo.'
                    : 'Esta orden no admite pagos en su estado actual.'
            );
        }
        const valor = redondear(monto);
        if (valor <= 0) {
            throw new Error('El monto del pago debe ser mayor que cero.');
        }
        const saldo = this.saldoPendiente(orden);
        if (valor > saldo) {
            throw new Error(`El monto supera el saldo pendiente (${saldo}).`);
        }
        return valor;
    },
};

export default crearOrden;
