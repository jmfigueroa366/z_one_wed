import test from 'node:test';
import assert from 'node:assert/strict';

import { FACTURACION } from '../src/config/facturacion.js';
import {
    redondearHaciaArribaBloque,
    horasDesdeSesiones,
    calcularTotalCancion,
    aplicarDescuentoAlbum,
    calcularTotalAlbum,
    calcularAnticipoYSaldo,
    aplicarPoliticaCancelacion,
} from '../src/services/facturacionService.js';

test('canción sin ensayo: horas de producción por tarifa', () => {
    const resultado = calcularTotalCancion({ horasProduccion: 10 }, FACTURACION);

    assert.equal(resultado.subtotalProduccion, 400000);
    assert.equal(resultado.descuento, 0);
    assert.equal(resultado.subtotalEnsayo, 0);
    assert.equal(resultado.total, 400000);
});

test('canción con ensayo requerido suma la sala de ensayo', () => {
    const resultado = calcularTotalCancion(
        { horasProduccion: 10, horasEnsayo: 4, requiereEnsayo: true },
        FACTURACION
    );

    assert.equal(resultado.subtotalProduccion, 400000);
    assert.equal(resultado.subtotalEnsayo, 200000);
    assert.equal(resultado.total, 600000);
});

test('canción que no requiere ensayo no cobra sala de ensayo', () => {
    const resultado = calcularTotalCancion(
        { horasProduccion: 2, horasEnsayo: 4, requiereEnsayo: false },
        FACTURACION
    );

    assert.equal(resultado.subtotalEnsayo, 0);
    assert.equal(resultado.total, 80000);
});

test('descuento de álbum solo cuando supera el umbral (15 canciones)', () => {
    assert.equal(aplicarDescuentoAlbum(960000, 15, FACTURACION), 0);
    assert.equal(aplicarDescuentoAlbum(960000, 16, FACTURACION), 288000);
});

test('álbum sin descuento: 3 días por 8 horas', () => {
    const resultado = calcularTotalAlbum(
        { horasPorDia: [8, 8, 8], cantidadCanciones: 10 },
        FACTURACION
    );

    assert.equal(resultado.horasProduccion, 24);
    assert.equal(resultado.subtotalProduccion, 960000);
    assert.equal(resultado.descuento, 0);
    assert.equal(resultado.total, 960000);
});

test('álbum con más de 15 canciones aplica 30% solo a producción', () => {
    const resultado = calcularTotalAlbum(
        { horasPorDia: [8, 8, 8], cantidadCanciones: 16 },
        FACTURACION
    );

    assert.equal(resultado.subtotalProduccion, 960000);
    assert.equal(resultado.descuento, 288000);
    assert.equal(resultado.total, 672000);
});

test('álbum con descuento y ensayo: el ensayo nunca se descuenta', () => {
    const resultado = calcularTotalAlbum(
        { horasPorDia: [8, 8, 8], horasEnsayo: 5, cantidadCanciones: 16 },
        FACTURACION
    );

    assert.equal(resultado.descuento, 288000);
    assert.equal(resultado.subtotalEnsayo, 250000);
    assert.equal(resultado.total, 922000);
});

test('fracciones de hora se redondean hacia arriba a bloques de 30 min', () => {
    assert.equal(redondearHaciaArribaBloque(1.2, FACTURACION.bloqueRedondeoMin), 1.5);
    assert.equal(redondearHaciaArribaBloque(2, FACTURACION.bloqueRedondeoMin), 2);
    assert.equal(redondearHaciaArribaBloque(0.1, FACTURACION.bloqueRedondeoMin), 0.5);

    const horas = horasDesdeSesiones(
        [{ hora_inicio: '10:00', hora_fin: '11:20' }],
        { bloqueMin: FACTURACION.bloqueRedondeoMin }
    );
    assert.equal(horas, 1.5);
});

test('horasDesdeSesiones suma varias sesiones', () => {
    const horas = horasDesdeSesiones(
        [
            { hora_inicio: '08:00', hora_fin: '16:00' },
            { hora_inicio: '08:00', hora_fin: '16:00' },
            { hora_inicio: '11:00', hora_fin: '13:00' },
        ],
        { bloqueMin: FACTURACION.bloqueRedondeoMin }
    );
    assert.equal(horas, 18);
});

test('anticipo es 50% del estimado y el saldo es total menos lo pagado', () => {
    const { anticipo, saldo } = calcularAnticipoYSaldo(
        { total: 600000, totalEstimado: 800000, anticipoPagado: 200000 },
        FACTURACION
    );

    assert.equal(anticipo, 400000);
    assert.equal(saldo, 400000);
});

test('si se pagó más que el total, el excedente queda como saldo a favor', () => {
    const { saldo, saldoFavor } = calcularAnticipoYSaldo(
        { total: 300000, totalEstimado: 800000, anticipoPagado: 400000 },
        FACTURACION
    );

    assert.equal(saldo, -100000);
    assert.equal(saldoFavor, 100000);
});

test('política de cancelación: gratis con 24 h o más, 50% si es tarde', () => {
    assert.equal(aplicarPoliticaCancelacion({ estimado: 100000, horasAnticipacion: 30 }, FACTURACION).cargo, 0);
    assert.equal(aplicarPoliticaCancelacion({ estimado: 100000, horasAnticipacion: 24 }, FACTURACION).cargo, 0);

    const tarde = aplicarPoliticaCancelacion({ estimado: 100000, horasAnticipacion: 10 }, FACTURACION);
    assert.equal(tarde.cargo, 50000);
    assert.equal(tarde.aplica, true);
});
