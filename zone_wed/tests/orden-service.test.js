import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { OrdenService } from '../src/services/ordenService.js';
import { ordenRepo } from '../src/repositories/ordenRepo.js';
import { ROLES } from '../src/config/roles.js';
import { METODOS_PAGO } from '../src/models/Orden.js';

const windowOriginal = globalThis.window;
const valores = new Map();

beforeEach(() => {
    valores.clear();
    globalThis.window = {
        localStorage: {
            getItem: (clave) => valores.get(clave) ?? null,
            setItem: (clave, valor) => valores.set(clave, valor),
            removeItem: (clave) => valores.delete(clave),
        },
    };
});

after(() => {
    if (windowOriginal === undefined) {
        delete globalThis.window;
    } else {
        globalThis.window = windowOriginal;
    }
});

const CLIENTE = { id: 3, rol: ROLES.CLIENTE };

test('el administrador ve todas las órdenes; el cliente solo las suyas', () => {
    const todas = OrdenService.listar({ usuario: { id: 1 }, rol: ROLES.ADMINISTRADOR });
    const propias = OrdenService.listar({ usuario: CLIENTE, rol: ROLES.CLIENTE });

    assert.ok(todas.length >= propias.length);
    assert.ok(propias.every((orden) => String(orden.usuario_id) === '3'));
});

test('el colaborador no tiene acceso a la facturación', () => {
    assert.throws(
        () => OrdenService.listar({ usuario: { id: 2 }, rol: ROLES.COLABORADOR }),
        /no tiene acceso/
    );
});

test('un pago parcial deja la orden en estado parcial y actualiza el saldo', () => {
    const orden = OrdenService.listar({ usuario: CLIENTE, rol: ROLES.CLIENTE })
        .find((item) => item.estado === 'facturada');
    assert.ok(orden);

    const actualizada = OrdenService.pagar(orden.id, {
        usuario: CLIENTE,
        rol: ROLES.CLIENTE,
        monto: 100000,
        metodo: METODOS_PAGO.TRANSFERENCIA,
    });

    assert.equal(actualizada.estado, 'parcial');
    assert.equal(actualizada.pagado, 100000);
    assert.equal(actualizada.saldo, orden.total - 100000);
    assert.equal(actualizada.pagos.length, 1);
});

test('pagar el saldo completo deja la orden pagada', () => {
    const orden = OrdenService.listar({ usuario: CLIENTE, rol: ROLES.CLIENTE })
        .find((item) => item.estado === 'parcial');
    assert.ok(orden);

    const actualizada = OrdenService.pagar(orden.id, {
        usuario: CLIENTE,
        rol: ROLES.CLIENTE,
        monto: orden.saldo,
        metodo: METODOS_PAGO.EFECTIVO,
    });

    assert.equal(actualizada.estado, 'pagada');
    assert.equal(actualizada.saldo, 0);
});

test('no se puede pagar más que el saldo pendiente', () => {
    const orden = OrdenService.listar({ usuario: CLIENTE, rol: ROLES.CLIENTE })
        .find((item) => ['facturada', 'parcial'].includes(item.estado));
    assert.ok(orden);

    assert.throws(
        () => OrdenService.pagar(orden.id, {
            usuario: CLIENTE,
            rol: ROLES.CLIENTE,
            monto: orden.saldo + 1,
            metodo: METODOS_PAGO.EFECTIVO,
        }),
        /supera el saldo/
    );
});

test('un cliente no puede pagar una orden ajena', () => {
    const ajena = ordenRepo.crear({ usuario_id: 99, total: 50000, estado: 'facturada' });

    assert.throws(
        () => OrdenService.pagar(ajena.id, {
            usuario: CLIENTE,
            rol: ROLES.CLIENTE,
            monto: 10000,
            metodo: METODOS_PAGO.EFECTIVO,
        }),
        /no es tuya/
    );
});

test('solo el administrador puede emitir facturas', () => {
    assert.throws(
        () => OrdenService.emitir({ proyecto_id: 1 }, { rol: ROLES.CLIENTE }),
        /Solo un administrador/
    );

    const emitida = OrdenService.emitir({ proyecto_id: 1 }, { rol: ROLES.ADMINISTRADOR });
    assert.equal(emitida.estado, 'facturada');
    assert.equal(emitida.usuario_id, 3);
    assert.ok(emitida.total > 0);
});

test('la numeración de las órdenes es consecutiva y no se repite', () => {
    const antes = ordenRepo.listar();
    const nueva = ordenRepo.crear({ usuario_id: 3, total: 10000, estado: 'facturada' });
    const numeros = ordenRepo.listar().map((orden) => orden.numero);

    assert.equal(new Set(numeros).size, numeros.length);
    assert.ok(nueva.numero.startsWith('ZW-'));
    assert.equal(numeros.length, antes.length + 1);
});
