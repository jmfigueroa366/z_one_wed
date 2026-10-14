import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SesionService } from '../src/services/sesionService.js';
import { SolicitudService } from '../src/services/solicitudService.js';

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

test('crear registra una solicitud solicitada con invitaciones pendientes', () => {
    const solicitud = SolicitudService.crear({
        usuario_id: 3,
        solicitante_nombre: 'Cliente Zeta',
        titulo: 'Prueba',
        sala_id: 1,
        fecha: '2026-12-01',
        franja: '08:00-09:00',
        tipo: 'mezcla',
        colaboradores: [
            { colaborador_id: 2, rol: 'productor' },
            { colaborador_id: 5, rol: 'artista' },
        ],
    });

    assert.equal(solicitud.estado, 'solicitada');
    assert.equal(solicitud.colaboradores.length, 2);
    assert.ok(solicitud.colaboradores.every((invitacion) => invitacion.estado === 'pendiente'));
});

test('crear exige al menos un colaborador', () => {
    assert.throws(
        () => SolicitudService.crear({
            sala_id: 1,
            fecha: '2026-12-02',
            franja: '08:00-09:00',
            tipo: 'mezcla',
            colaboradores: [],
        }),
        /al menos un artista/
    );
});

test('crear rechaza una franja que choca con otra solicitud activa', () => {
    SolicitudService.crear({
        sala_id: 1,
        fecha: '2026-12-07',
        franja: '10:00-12:00',
        tipo: 'mezcla',
        colaboradores: [{ colaborador_id: 1 }],
    });

    assert.throws(
        () => SolicitudService.crear({
            sala_id: 1,
            fecha: '2026-12-07',
            franja: '11:00-13:00',
            tipo: 'mezcla',
            colaboradores: [{ colaborador_id: 1 }],
        }),
        /ya está reservada/
    );
});

test('la solicitud se confirma y crea sesión cuando todos aceptan', () => {
    const solicitud = SolicitudService.crear({
        sala_id: 1,
        fecha: '2026-12-03',
        franja: '08:00-09:00',
        tipo: 'mezcla',
        colaboradores: [{ colaborador_id: 1 }, { colaborador_id: 2 }],
    });

    const parcial = SolicitudService.responderInvitacion(solicitud.id, 1, 'aceptada');
    assert.equal(parcial.estado, 'solicitada');

    const final = SolicitudService.responderInvitacion(solicitud.id, 2, 'aceptada');
    assert.equal(final.estado, 'confirmada');

    const sesion = SesionService.listar().find((item) => String(item.solicitud_id) === String(solicitud.id));
    assert.ok(sesion, 'Debería crearse una sesión vinculada');
    assert.equal(sesion.estado, 'confirmada');
    assert.equal(sesion.sala_id, solicitud.sala_id);
});

test('la solicitud se rechaza cuando alguien rechaza y ya respondieron todos', () => {
    const solicitud = SolicitudService.crear({
        sala_id: 2,
        fecha: '2026-12-04',
        franja: '08:00-09:00',
        tipo: 'mezcla',
        colaboradores: [{ colaborador_id: 1 }, { colaborador_id: 2 }],
    });

    SolicitudService.responderInvitacion(solicitud.id, 1, 'aceptada');
    const final = SolicitudService.responderInvitacion(solicitud.id, 2, 'rechazada');
    assert.equal(final.estado, 'rechazada');

    const sesion = SesionService.listar().find((item) => String(item.solicitud_id) === String(solicitud.id));
    assert.equal(sesion, undefined);
});

test('no se puede responder dos veces ni responder sin invitación', () => {
    const solicitud = SolicitudService.crear({
        sala_id: 3,
        fecha: '2026-12-05',
        franja: '08:00-09:00',
        tipo: 'mezcla',
        colaboradores: [{ colaborador_id: 1 }, { colaborador_id: 2 }],
    });

    SolicitudService.responderInvitacion(solicitud.id, 1, 'aceptada');
    assert.throws(() => SolicitudService.responderInvitacion(solicitud.id, 1, 'rechazada'), /Ya respondiste/);
    assert.throws(() => SolicitudService.responderInvitacion(solicitud.id, 7, 'aceptada'), /No fuiste invitado/);
});

test('cancelar deja la solicitud en cancelada y respeta la máquina de estados', () => {
    const solicitud = SolicitudService.crear({
        sala_id: 1,
        fecha: '2026-12-06',
        franja: '08:00-09:00',
        tipo: 'mezcla',
        colaboradores: [{ colaborador_id: 1 }],
    });

    const cancelada = SolicitudService.cancelar(solicitud.id);
    assert.equal(cancelada.estado, 'cancelada');
    assert.throws(() => SolicitudService.cancelar(solicitud.id), /ya no se puede cancelar/);
});