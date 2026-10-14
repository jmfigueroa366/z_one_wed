import test from 'node:test';
import assert from 'node:assert/strict';

import { crearOrden, crearPago, Orden, METODOS_PAGO } from '../src/models/Orden.js';

test('crearOrden calcula pagado y saldo a partir de los pagos', () => {
    const orden = crearOrden({
        total: 100000,
        estado: 'parcial',
        pagos: [{ monto: 40000, metodo: METODOS_PAGO.EFECTIVO }],
    });

    assert.equal(orden.pagado, 40000);
    assert.equal(orden.saldo, 60000);
    assert.equal(orden.saldo_favor, 0);
});

test('crearOrden deriva saldo a favor si los pagos superan el total', () => {
    const orden = crearOrden({
        total: 100000,
        estado: 'pagada',
        pagos: [{ monto: 120000, metodo: METODOS_PAGO.TRANSFERENCIA }],
    });

    assert.equal(orden.pagado, 120000);
    assert.equal(orden.saldo, -20000);
    assert.equal(orden.saldo_favor, 20000);
});

test('crearOrden rechaza estados inválidos', () => {
    assert.throws(() => crearOrden({ estado: 'archivada' }), /Estado inválido/);
});

test('crearPago valida método y monto', () => {
    assert.throws(() => crearPago({ monto: 1000, metodo: 'bitcoin' }), /Método de pago inválido/);
    assert.throws(() => crearPago({ monto: 0, metodo: METODOS_PAGO.EFECTIVO }), /mayor que cero/);
});

test('las transiciones de estado de la orden respetan la máquina de estados', () => {
    const facturada = crearOrden({ total: 100000, estado: 'facturada' });
    assert.equal(Orden.puedeTransicionar(facturada, 'parcial'), true);
    assert.equal(Orden.puedeTransicionar(facturada, 'pagada'), true);
    assert.equal(Orden.puedeTransicionar(facturada, 'cancelada'), true);
    assert.equal(Orden.puedeTransicionar(facturada, 'borrador'), false);

    const pagada = crearOrden({ total: 100000, estado: 'pagada', pagos: [{ monto: 100000, metodo: METODOS_PAGO.TARJETA }] });
    assert.equal(Orden.puedeTransicionar(pagada, 'cancelada'), false);
});

test('validarPago bloquea estados no pagables, montos falsos y sobrepagos', () => {
    const facturada = crearOrden({ total: 100000, estado: 'facturada' });
    assert.equal(Orden.validarPago(facturada, { monto: 40000 }), 40000);
    assert.throws(() => Orden.validarPago(facturada, { monto: 0 }), /mayor que cero/);
    assert.throws(() => Orden.validarPago(facturada, { monto: 120000 }), /supera el saldo/);

    const pagada = crearOrden({ total: 100000, estado: 'pagada' });
    assert.throws(() => Orden.validarPago(pagada, { monto: 1000 }), /ya fue pagada/);

    const borrador = crearOrden({ total: 100000, estado: 'borrador' });
    assert.throws(() => Orden.validarPago(borrador, { monto: 1000 }), /no admite pagos/);
});

test('saldoPendiente nunca es negativo', () => {
    const orden = crearOrden({
        total: 100000,
        estado: 'pagada',
        pagos: [{ monto: 150000, metodo: METODOS_PAGO.EFECTIVO }],
    });
    assert.equal(Orden.saldoPendiente(orden), 0);
});
