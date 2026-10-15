import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SesionService } from '../src/services/sesionService.js';
import { SolicitudService } from '../src/services/solicitudService.js';
import { OrdenService } from '../src/services/ordenService.js';
import { ordenRepo } from '../src/repositories/ordenRepo.js';
import { ROLES } from '../src/config/roles.js';
import { METODOS_PAGO } from '../src/models/Orden.js';

const windowOriginal = globalThis.window;
const valores = new Map();

const CLIENTE = { id: 3, rol: ROLES.CLIENTE };

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

test('cuando todos aceptan la solicitud queda por autorizar, sin sesión todavía', () => {
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
    assert.equal(final.estado, 'por_autorizar');

    const sesion = SesionService.listar().find((item) => String(item.solicitud_id) === String(solicitud.id));
    assert.equal(sesion, undefined, 'Todavía no debe existir sesión');
});

test('al autorizar una solicitud de un no-cliente se confirma y crea la sesión', () => {
    const solicitud = SolicitudService.crear({
        sala_id: 1,
        fecha: '2026-12-13',
        franja: '08:00-09:00',
        tipo: 'mezcla',
        colaboradores: [{ colaborador_id: 1 }, { colaborador_id: 2 }],
    });

    SolicitudService.responderInvitacion(solicitud.id, 1, 'aceptada');
    SolicitudService.responderInvitacion(solicitud.id, 2, 'aceptada');

    const autorizada = SolicitudService.autorizar(solicitud.id, { rol: ROLES.ADMINISTRADOR });
    assert.equal(autorizada.estado, 'confirmada');

    const sesion = SesionService.listar().find((item) => String(item.solicitud_id) === String(solicitud.id));
    assert.ok(sesion, 'Debería crearse una sesión al autorizar');
    assert.equal(sesion.estado, 'confirmada');
    assert.equal(sesion.sala_id, solicitud.sala_id);
});

test('solo un administrador puede autorizar la solicitud', () => {
    const solicitud = SolicitudService.crear({
        sala_id: 1,
        fecha: '2026-12-14',
        franja: '08:00-09:00',
        tipo: 'mezcla',
        colaboradores: [{ colaborador_id: 1 }],
    });
    SolicitudService.responderInvitacion(solicitud.id, 1, 'aceptada');

    assert.throws(
        () => SolicitudService.autorizar(solicitud.id, { rol: ROLES.CLIENTE }),
        /Solo un administrador/
    );
});

test('al autorizar un cliente se emite la factura del anticipo de la reserva', () => {
    const solicitud = SolicitudService.crear({
        usuario_id: 3,
        solicitante_nombre: 'Cliente Zeta',
        sala_id: 1,
        fecha: '2026-12-08',
        franja: '08:00-10:00',
        tipo: 'mezcla',
        colaboradores: [{ colaborador_id: 1 }, { colaborador_id: 2 }],
    });

    SolicitudService.responderInvitacion(solicitud.id, 1, 'aceptada');
    SolicitudService.responderInvitacion(solicitud.id, 2, 'aceptada');

    const autorizada = SolicitudService.autorizar(solicitud.id, { rol: ROLES.ADMINISTRADOR });
    assert.equal(autorizada.estado, 'por_pagar');

    const reserva = ordenRepo.listar().find(
        (orden) => orden.tipo === 'reserva' && String(orden.solicitud_id) === String(solicitud.id)
    );

    // 2 h de producción = 80000; anticipo 50% = 40000.
    assert.ok(reserva, 'Debería emitirse una factura de anticipo');
    assert.equal(reserva.estado, 'facturada');
    assert.equal(reserva.total, 40000);
});

test('pagar el anticipo confirma la solicitud y crea la sesión', () => {
    const solicitud = SolicitudService.crear({
        usuario_id: 3,
        solicitante_nombre: 'Cliente Zeta',
        sala_id: 1,
        fecha: '2026-12-15',
        franja: '08:00-10:00',
        tipo: 'mezcla',
        colaboradores: [{ colaborador_id: 1 }],
    });
    SolicitudService.responderInvitacion(solicitud.id, 1, 'aceptada');
    SolicitudService.autorizar(solicitud.id, { rol: ROLES.ADMINISTRADOR });

    const reserva = ordenRepo.listar().find((orden) => String(orden.solicitud_id) === String(solicitud.id));
    OrdenService.pagar(reserva.id, {
        usuario: CLIENTE,
        rol: ROLES.CLIENTE,
        monto: reserva.saldo,
        metodo: METODOS_PAGO.EFECTIVO,
    });

    assert.equal(SolicitudService.obtenerPorId(solicitud.id).estado, 'confirmada');
    const sesion = SesionService.listar().find((item) => String(item.solicitud_id) === String(solicitud.id));
    assert.ok(sesion, 'El pago debe crear la sesión');
});

test('un cliente con un anticipo sin pagar no puede crear otra solicitud', () => {
    ordenRepo.crear({ tipo: 'reserva', usuario_id: 3, total: 40000, estado: 'facturada' });

    assert.throws(
        () => SolicitudService.crear({
            usuario_id: 3,
            solicitante_nombre: 'Cliente Zeta',
            sala_id: 1,
            fecha: '2026-12-16',
            franja: '08:00-09:00',
            tipo: 'mezcla',
            colaboradores: [{ colaborador_id: 1 }],
        }),
        /anticipo de reserva sin pagar/
    );
});

test('no se emite factura de anticipo cuando el solicitante no es cliente', () => {
    const solicitud = SolicitudService.crear({
        usuario_id: 2,
        solicitante_nombre: 'Lúa Ferreira',
        sala_id: 2,
        fecha: '2026-12-09',
        franja: '08:00-09:00',
        tipo: 'mezcla',
        colaboradores: [{ colaborador_id: 1 }],
    });

    SolicitudService.responderInvitacion(solicitud.id, 1, 'aceptada');
    SolicitudService.autorizar(solicitud.id, { rol: ROLES.ADMINISTRADOR });

    const reservas = ordenRepo.listar().filter((orden) => orden.tipo === 'reserva');
    assert.equal(reservas.length, 0);
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
