import test from 'node:test';
import assert from 'node:assert/strict';

import { crearSolicitud, crearInvitacion, Solicitud, TIPOS_SOLICITUD } from '../src/models/Solicitud.ts';

test('crearSolicitud asigna tipo, estado y colaboradores por defecto', () => {
    const solicitud = crearSolicitud({ fecha: '2026-10-10', franja: '10:00-12:00' });

    assert.equal(solicitud.tipo, TIPOS_SOLICITUD.GRABACION);
    assert.equal(solicitud.estado, 'solicitada');
    assert.equal(solicitud.usuario_id, null);
    assert.equal(solicitud.cancion_id, null);
    assert.equal(solicitud.titulo, '');
    assert.deepEqual(solicitud.partes, []);
    assert.deepEqual(solicitud.colaboradores, []);
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

test('crearSolicitud normaliza las invitaciones de colaboradores', () => {
    const solicitud = crearSolicitud({
        colaboradores: [
            { colaborador_id: 2, rol: 'productor' },
            { colaborador_id: 5, rol: 'artista', estado: 'aceptada' },
        ],
    });

    assert.deepEqual(solicitud.colaboradores, [
        { colaborador_id: 2, rol: 'productor', estado: 'pendiente' },
        { colaborador_id: 5, rol: 'artista', estado: 'aceptada' },
    ]);
});

test('crearInvitacion rechaza estados inválidos', () => {
    assert.throws(() => crearInvitacion({ estado: 'en_proceso' }), /Estado inválido/);
});

test('Solicitud evalúa las respuestas de los colaboradores', () => {
    const pendiente = crearSolicitud({ colaboradores: [{ colaborador_id: 1, estado: 'pendiente' }] });
    assert.equal(Solicitud.todosRespondieron(pendiente), false);
    assert.equal(Solicitud.todosAceptaron(pendiente), false);

    const mixta = crearSolicitud({
        colaboradores: [
            { colaborador_id: 1, estado: 'aceptada' },
            { colaborador_id: 2, estado: 'rechazada' },
        ],
    });
    assert.equal(Solicitud.todosRespondieron(mixta), true);
    assert.equal(Solicitud.todosAceptaron(mixta), false);

    const completa = crearSolicitud({
        colaboradores: [
            { colaborador_id: 1, estado: 'aceptada' },
            { colaborador_id: 2, estado: 'aceptada' },
        ],
    });
    assert.equal(Solicitud.todosRespondieron(completa), true);
    assert.equal(Solicitud.todosAceptaron(completa), true);
});

test('Solicitud.invitacionDe encuentra la invitación por colaborador', () => {
    const solicitud = crearSolicitud({
        colaboradores: [
            { colaborador_id: 1, estado: 'aceptada' },
            { colaborador_id: 2, estado: 'pendiente' },
        ],
    });

    assert.equal(Solicitud.invitacionDe(solicitud, 2)!.estado, 'pendiente');
    assert.equal(Solicitud.invitacionDe(solicitud, 9), null);
});