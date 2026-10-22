import test from 'node:test';
import assert from 'node:assert/strict';

import {
    aMinutos,
    estimadoSala,
    franjaEnMinutos,
    franjasOcupadas,
    seSolapan,
} from '../src/utils/solicitudes.ts';
import type { Solicitud } from '../src/models/Solicitud.ts';
import type { Sesion } from '../src/models/Sesion.ts';
import type { Sala } from '../src/models/Sala.ts';

test('aMinutos convierte horas a minutos', () => {
    assert.equal(aMinutos('09:30'), 570);
    assert.equal(aMinutos('00:00'), 0);
    assert.ok(Number.isNaN(aMinutos('')));
});

test('franjaEnMinutos devuelve inicio y fin en minutos', () => {
    assert.deepEqual(franjaEnMinutos('10:00-12:00'), [600, 720]);
    assert.equal(franjaEnMinutos('mal'), null);
});

test('franjaEnMinutos normaliza franjas que cruzan la medianoche', () => {
    assert.deepEqual(franjaEnMinutos('23:00-01:00'), [1380, 1500]);
});

test('franjaEnMinutos rechaza horas fuera del día', () => {
    assert.equal(franjaEnMinutos('25:00-26:00'), null);
    assert.equal(franjaEnMinutos('10:00-10:75'), null);
});

test('seSolapan detecta choques y respeta franjas pegadas', () => {
    assert.equal(seSolapan('10:00-12:00', '11:00-13:00'), true);
    assert.equal(seSolapan('10:00-12:00', '10:00-12:00'), true);
    assert.equal(seSolapan('10:00-12:00', '12:00-14:00'), false);
    assert.equal(seSolapan('10:00-12:00', '09:00-10:00'), false);
});

test('seSolapan detecta choques de franjas que cruzan la medianoche', () => {
    assert.equal(seSolapan('23:00-01:00', '00:30-01:30'), true);
    assert.equal(seSolapan('23:00-01:00', '23:00-01:00'), true);
    assert.equal(seSolapan('23:00-01:00', '01:00-02:00'), false);
});

test('seSolapan no considera solape una franja malformada', () => {
    assert.equal(seSolapan('', '10:00-12:00'), false);
    assert.equal(seSolapan('10:00', '10:00-12:00'), false);
});

test('franjasOcupadas combina solicitudes y sesiones activas de sala y fecha', () => {
    const solicitudes = [
        { sala_id: 1, fecha: '2026-10-10', franja: '10:00-12:00', estado: 'confirmada' },
        { sala_id: 1, fecha: '2026-10-10', franja: '13:00-14:00', estado: 'rechazada' },
        { sala_id: 1, fecha: '2026-10-10', franja: '11:00-12:00', estado: 'solicitada' },
        { sala_id: 2, fecha: '2026-10-10', franja: '10:00-12:00', estado: 'confirmada' },
        { sala_id: 1, fecha: '2026-10-11', franja: '10:00-12:00', estado: 'confirmada' },
    ] as Solicitud[];
    const sesiones = [
        { sala_id: 1, fecha: '2026-10-10', hora_inicio: '15:00', hora_fin: '17:00', estado: 'confirmada' },
        { sala_id: 1, fecha: '2026-10-10', hora_inicio: '16:00', hora_fin: '18:00', estado: 'cancelada' },
    ] as Sesion[];

    const ocupadas = franjasOcupadas({ fecha: '2026-10-10', salaId: 1, solicitudes, sesiones });
    assert.deepEqual(ocupadas, ['10:00-12:00', '11:00-12:00', '15:00-17:00']);
});

test('estimadoSala calcula costo a partir de la franja', () => {
    const sala = { precio_hora: 50000 } as Sala;
    assert.equal(estimadoSala(sala, '10:00-12:00'), 100000);
    assert.equal(estimadoSala(null, '10:00-12:00'), null);
});