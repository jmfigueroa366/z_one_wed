import test from 'node:test';
import assert from 'node:assert/strict';

import {
    cambiosDeCancion,
    cambiosDeColaborador,
    cambiosDeProyecto,
    cambiosDeSala,
    mapearCancion,
    mapearColaborador,
    mapearProyecto,
    mapearSala,
    perfilEnApp,
    perfilEnBd,
} from '../src/infrastructure/supabaseSync.ts';

test('la duracion de la base de datos (segundos) se lee en minutos', () => {
    const cancion = mapearCancion({ id: 1, titulo: 'Amanecer', duracion_seg: 180, partes: ['Vocales'] });

    assert.equal(cancion.nombre, 'Amanecer');
    assert.equal(cancion.duracion, 3);
    assert.deepEqual(cancion.partes, ['Vocales']);
    assert.equal(cancion.id_remoto, 1);
});

test('si la columna de partes no existe se conserva la que ya tenia la cancion', () => {
    const cancion = mapearCancion({ id: 1, titulo: 'Amanecer', duracion_seg: 180 });

    assert.equal(cancion.partes, undefined);
    assert.equal(cancion.duracion, 3);
});

test('el proyecto toma el usuario de su cliente', () => {
    const proyecto = mapearProyecto({
        id: 4,
        nombre: 'Mi primer album',
        cliente_id: 'cliente-1',
        clientes: { usuario_id: 'usuario-9' },
    });

    assert.equal(proyecto.usuario_id, 'usuario-9');
    assert.equal(proyecto.cliente_id, 'cliente-1');
    assert.equal(proyecto.id_remoto, 4);
});

test('el proyecto sin columna de tipo conserva el que ya tenia', () => {
    const proyecto = mapearProyecto({ id: 4, nombre: 'Mi primer album' });

    assert.equal(proyecto.tipo, undefined);
});

test('el proyecto con un tipo desconocido cae en sencillo', () => {
    const proyecto = mapearProyecto({ id: 4, nombre: 'Mi primer album', tipo: 'inventado' });

    assert.equal(proyecto.tipo, 'sencillo');
});

test('el colaborador traduce el perfil de la base de datos al de la app', () => {
    const colaborador = mapearColaborador({ id: 'uuid-1', nombre_artistico: 'Lua', perfil: 'productor' });

    assert.equal(colaborador.perfil, 'produccion');
    assert.equal(colaborador.nombre, 'Lua');
    assert.equal(colaborador.activo, true);
    assert.equal(colaborador.id_remoto, 'uuid-1');
});

test('el colaborador solo expone la especialidad si la columna existe', () => {
    const sinColumna = mapearColaborador({ id: 'uuid-1', nombre_artistico: 'Lua' });
    const conColumna = mapearColaborador({ id: 'uuid-1', nombre_artistico: 'Lua', especialidad: 'Canto' });

    assert.equal(sinColumna.especialidad, undefined);
    assert.equal(conColumna.especialidad, 'Canto');
});

test('el colaborador desvinculado no esta activo', () => {
    const colaborador = mapearColaborador({ id: 'uuid-1', vinculacion: 'desvinculado' });

    assert.equal(colaborador.activo, false);
});

test('la sala se lee con su precio y si esta activa', () => {
    const sala = mapearSala({ id: 3, nombre: 'Sala A', precio_hora: 45000, activo: true });

    assert.equal(sala.nombre, 'Sala A');
    assert.equal(sala.precio_hora, 45000);
    assert.equal(sala.activo, true);
    assert.equal(sala.id_remoto, 3);
});

test('los perfiles se traducen en los dos sentidos', () => {
    assert.equal(perfilEnBd('produccion'), 'productor');
    assert.equal(perfilEnBd('ingeniero'), 'ingeniero_sonido');
    assert.equal(perfilEnApp('productor'), 'produccion');
    assert.equal(perfilEnApp('ingeniero_sonido'), 'ingeniero');
});

test('sin perfil se deduce de la especialidad', () => {
    assert.equal(perfilEnBd(undefined, 'Ingenieria de sonido'), 'ingeniero_sonido');
    assert.equal(perfilEnBd(undefined, 'Produccion musical'), 'productor');
    assert.equal(perfilEnBd(undefined, 'Canto'), 'artista');
    assert.equal(perfilEnBd(undefined, 'Fotografia'), 'otro');
});

test('al escribir, la cancion pasa los minutos a segundos', () => {
    const cambios = cambiosDeCancion({ nombre: 'Amanecer', duracion: 3, partes: ['Vocales'], requiere_ensayo: true });

    assert.equal(cambios.titulo, 'Amanecer');
    assert.equal(cambios.duracion_seg, 180);
    assert.deepEqual(cambios.partes, ['Vocales']);
    assert.equal(cambios.requiere_ensayo, true);
});

test('al escribir, la cancion sin duracion no inventa segundos', () => {
    const cambios = cambiosDeCancion({ nombre: 'Amanecer', duracion: null });

    assert.equal(cambios.duracion_seg, null);
    assert.deepEqual(cambios.partes, []);
});

test('al escribir, el colaborador usa el perfil y la vinculacion de la base de datos', () => {
    const cambios = cambiosDeColaborador({ nombre: 'Lua', perfil: 'produccion', especialidad: 'Canto', activo: true });

    assert.equal(cambios.perfil, 'productor');
    assert.equal(cambios.nombre_artistico, 'Lua');
    assert.equal(cambios.especialidad, 'Canto');
    assert.equal(cambios.vinculacion, 'activo');
});

test('al escribir, un colaborador inactivo queda desvinculado', () => {
    const cambios = cambiosDeColaborador({ nombre: 'Lua', activo: false });

    assert.equal(cambios.vinculacion, 'desvinculado');
});

test('al escribir, el proyecto solo lleva nombre y tipo', () => {
    const cambios = cambiosDeProyecto({ nombre: 'Mi primer album', tipo: 'album' });

    assert.deepEqual(cambios, { nombre: 'Mi primer album', tipo: 'album' });
});

test('al escribir, la sala lleva su precio y si esta activa', () => {
    const cambios = cambiosDeSala({ nombre: 'Sala A', precio_hora: 45000, activo: true });

    assert.deepEqual(cambios, { nombre: 'Sala A', precio_hora: 45000, activo: true });
});
