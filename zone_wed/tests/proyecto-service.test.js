import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { ProyectoService } from '../src/services/proyectoService.js';
import { CancionService } from '../src/services/cancionService.js';

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

test('crea proyectos para un usuario y solo lista los suyos', () => {
    const proyecto = ProyectoService.crear({ nombre: 'Demo', usuario_id: 10 });
    assert.ok(proyecto.id);
    assert.equal(proyecto.nombre, 'Demo');

    ProyectoService.crear({ nombre: 'Otro', usuario_id: 11 });

    const delUsuario = ProyectoService.listarPorUsuario(10);
    assert.ok(delUsuario.length >= 1);
    assert.ok(delUsuario.every((item) => item.nombre !== 'Otro'));
});

test('eliminar un proyecto borra también sus canciones', () => {
    const proyecto = ProyectoService.crear({ nombre: 'Demo', usuario_id: 10 });
    const cancion = CancionService.crear({ proyecto_id: proyecto.id, nombre: 'Tema 1', duracion: 3 });
    assert.equal(cancion.proyecto_id, proyecto.id);
    assert.equal(CancionService.listarPorProyecto(proyecto.id).length, 1);

    ProyectoService.eliminar(proyecto.id);

    assert.equal(ProyectoService.obtenerPorId(proyecto.id), null);
    assert.equal(CancionService.listarPorProyecto(proyecto.id).length, 0);
});

test('canciones conservan nombre y duración opcional', () => {
    const proyecto = ProyectoService.crear({ nombre: 'Demo', usuario_id: 10 });
    const conDuracion = CancionService.crear({ proyecto_id: proyecto.id, nombre: 'Amanecer', duracion: 4 });
    const sinDuracion = CancionService.crear({ proyecto_id: proyecto.id, nombre: 'Sin título' });

    assert.equal(conDuracion.duracion, 4);
    assert.equal(sinDuracion.duracion, null);
    assert.equal(CancionService.obtenerPorId(conDuracion.id).nombre, 'Amanecer');
});

test('canciones guardan partes de audio y permiten editarlas', () => {
    const proyecto = ProyectoService.crear({ nombre: 'Demo', usuario_id: 10 });
    const cancion = CancionService.crear({ proyecto_id: proyecto.id, nombre: 'Tema', partes: ['Vocales'] });
    const simple = CancionService.crear({ proyecto_id: proyecto.id, nombre: 'Instrumental' });

    assert.deepEqual(cancion.partes, ['Vocales']);
    assert.deepEqual(simple.partes, []);

    const editada = CancionService.actualizar(cancion.id, { partes: ['Vocales', 'Guitarra'] });
    assert.deepEqual(editada.partes, ['Vocales', 'Guitarra']);
});