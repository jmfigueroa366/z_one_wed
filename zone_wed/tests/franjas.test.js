import test from 'node:test';
import assert from 'node:assert/strict';

import {
    aMinutos,
    estimadoSala,
    franjaEnMinutos,
    franjasOcupadas,
    seSolapan,
} from '../src/utils/solicitudes.js';

test('aMinutos convierte horas a minutos', () => {
    assert.equal(aMinutos('09:30'), 570);
    assert.equal(aMinutos('00:00'), 0);
    assert.ok(Number.isNaN(aMinutos('')));
});

test('franjaEnMinutos devuelve inicio y fin en minutos', () => {
    assert.deepEqual(franjaEnMinutos('10:00-12:00'), [600, 720]);
    assert.equal(franjaEnMinutos('mal'), null);
});

test('seSolapan detecta choques y respeta franjas pegadas', () => {
    assert.equal(seSolapan('10:00-12:00', '11:00-13:00'), true);
    assert.equal(seSolapan('10:00-12:00', '10:00-12:00'), true);
    assert.equal(seSolapan('10:00-12:00', '12:00-14:00'), false);
    assert.equal(seSolapan('10:00-12:00', '09:00-10:00'), false);
});

test('franjasOcupadas combina solicitudes y sesiones activas de sala y fecha', () => {
    const solicitudes = [
        { sala_id: 1, fecha: '2026-10-10', franja: '10:00-12:00', estado: 'confirmada' },
        { sala_id: 1, fecha: '2026-10-10', franja: '13:00-14:00', estado: 'rechazada' },
        { sala_id: 1, fecha: '2026-10-10', franja: '11:00-12:00', estado: 'solicitud' },
        { sala_id: 2, fecha: '2026-10-10', franja: '10:00-12:00', estado: 'confirmada' },
        { sala_id: 1, fecha: '2026-10-11', franja: '10:00-12:00', estado: 'confirmada' },
    ];
    const sesiones = [
        { sala_id: 1, fecha: '2026-10-10', hora_inicio: '15:00', hora_fin: '17:00', estado: 'confirmada' },
        { sala_id: 1, fecha: '2026-10-10', hora_inicio: '16:00', hora_fin: '18:00', estado: 'cancelada' },
    ];

    const ocupadas = franjasOcupadas({ fecha: '2026-10-10', salaId: 1, solicitudes, sesiones });
    assert.deepEqual(ocupadas, ['10:00-12:00', '11:00-12:00', '15:00-17:00']);
});

test('estimadoSala calcula costo a partir de la franja', () => {
    const sala = { precio_hora: 50000 };
    assert.equal(estimadoSala(sala, '10:00-12:00'), 100000);
    assert.equal(estimadoSala(null, '10:00-12:00'), null);
});