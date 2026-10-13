import test from 'node:test';
import assert from 'node:assert/strict';

import { crearSolicitud, TIPOS_SOLICITUD } from '../src/models/Solicitud.js';

test('crearSolicitud asigna tipo y estado por defecto', () => {
    const solicitud = crearSolicitud({ fecha: '2026-10-10', franja: '10:00-12:00' });

    assert.equal(solicitud.tipo, TIPOS_SOLICITUD.GRABACION);
    assert.equal(solicitud.estado, 'solicitud');
    assert.equal(solicitud.usuario_id, null);
    assert.equal(solicitud.colaborador_id, null);
    assert.equal(solicitud.cancion_id, null);
    assert.deepEqual(solicitud.partes, []);
});

test('crearSolicitud conserva tipo, usuario y solicitante cuando se envían', () => {
    const solicitud = crearSolicitud({
        usuario_id: 3,
        solicitante_nombre: 'Cliente Demo',
        tipo: TIPOS_SOLICITUD.MEZCLA,
    });

    assert.equal(solicitud.usuario_id, 3);
    assert.equal(solicitud.solicitante_nombre, 'Cliente Demo');
    assert.equal(solicitud.tipo, TIPOS_SOLICITUD.MEZCLA);
});

test('crearSolicitud conserva canción, proyecto y partes de una grabación', () => {
    const solicitud = crearSolicitud({
        cancion_id: 1,
        proyecto_id: 1,
        partes: ['Vocales', 'Guitarra'],
    });

    assert.equal(solicitud.cancion_id, 1);
    assert.equal(solicitud.proyecto_id, 1);
    assert.deepEqual(solicitud.partes, ['Vocales', 'Guitarra']);
});