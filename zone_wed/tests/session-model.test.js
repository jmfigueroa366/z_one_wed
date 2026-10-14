import test from 'node:test';
import assert from 'node:assert/strict';

import { crearSesion, Sesion } from '../src/models/Sesion.js';
import { validarRegistro } from '../src/utils/validators.js';

test('crearSesion aplica valores por defecto de una sesión', () => {
  const sesion = crearSesion({ titulo: 'Grabación demo' });

  assert.equal(sesion.id, null);
  assert.equal(sesion.titulo, 'Grabación demo');
  assert.equal(sesion.sala_id, null);
  assert.equal(sesion.colaborador_id, null);
  assert.equal(sesion.fecha, null);
  assert.equal(sesion.hora_inicio, null);
  assert.equal(sesion.hora_fin, null);
  assert.equal(sesion.estado, 'solicitada');
});

test('Sesion.estaActiva reconoce sesiones activas (solicitada o confirmada)', () => {
  assert.equal(Sesion.estaActiva(crearSesion({ estado: 'solicitada' })), true);
  assert.equal(Sesion.estaActiva(crearSesion({ estado: 'confirmada' })), true);
  assert.equal(Sesion.estaActiva(crearSesion({ estado: 'completada' })), false);
  assert.equal(Sesion.estaActiva(crearSesion({ estado: 'cancelada' })), false);
  assert.equal(Sesion.estaActiva(null), false);
});

test('Sesion.puedeTransicionar reconoce transiciones válidas de estado', () => {
  const solicitada = crearSesion({ estado: 'solicitada' });
  assert.equal(Sesion.puedeTransicionar(solicitada, 'confirmada'), true);
  assert.equal(Sesion.puedeTransicionar(solicitada, 'cancelada'), true);
  assert.equal(Sesion.puedeTransicionar(solicitada, 'completada'), false);

  const confirmada = crearSesion({ estado: 'confirmada' });
  assert.equal(Sesion.puedeTransicionar(confirmada, 'completada'), true);
  assert.equal(Sesion.puedeTransicionar(confirmada, 'solicitada'), false);

});

test('crearSesion rechaza estados inválidos', () => {
  assert.throws(() => crearSesion({ estado: 'en_proceso' }), /Estado inválido/);
});

test('validarRegistro rechaza nombre, email y password vacíos', () => {
  const errores = validarRegistro({ nombre: '', email: 'correo', password: '' });

  assert.deepEqual(errores, {
    nombre: 'El nombre es obligatorio.',
    email: 'Ingresa un email válido.',
    password: 'La contraseña es obligatoria.',
  });
});
