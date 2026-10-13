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

test('gestiona solicitudes por los estados de negociación permitidos', () => {
    const solicitud = SolicitudService.listar()[0];
    assert.equal(solicitud.estado, 'solicitud');

    const enNegociacion = SolicitudService.actualizarEstado(solicitud.id, 'en_negociacion');
    assert.equal(enNegociacion.estado, 'en_negociacion');

    const confirmada = SolicitudService.actualizarEstado(solicitud.id, 'confirmada');
    assert.equal(confirmada.estado, 'confirmada');
    assert.equal(SolicitudService.obtenerPorId(solicitud.id).estado, 'confirmada');
});

test('rechaza transiciones no permitidas y devuelve null para solicitudes inexistentes', () => {
    const solicitud = SolicitudService.listar()[0];

    assert.throws(
        () => SolicitudService.actualizarEstado(solicitud.id, 'expirada'),
        /no admite ese cambio/
    );
    assert.equal(SolicitudService.actualizarEstado(9999, 'confirmada'), null);
});

test('al confirmar una solicitud se crea la sesión vinculada', () => {
    const solicitud = SolicitudService.listar()[0];
    SolicitudService.actualizarEstado(solicitud.id, 'en_negociacion');
    SolicitudService.actualizarEstado(solicitud.id, 'confirmada');

    const sesiones = SesionService.listar();
    const creada = sesiones.find((sesion) => String(sesion.solicitud_id) === String(solicitud.id));
    assert.ok(creada, 'Debería existir una sesión creada desde la solicitud');
    assert.equal(creada.estado, 'confirmada');
    assert.equal(creada.sala_id, solicitud.sala_id);
    assert.equal(creada.colaborador_id, solicitud.colaborador_id);
});
