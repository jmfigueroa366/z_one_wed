import test from 'node:test';
import assert from 'node:assert/strict';

import { crearSolicitud } from '../src/models/Solicitud.ts';
import { crearSesion } from '../src/models/Sesion.ts';
import { crearCancion } from '../src/models/Cancion.ts';
import { crearProyecto } from '../src/models/Proyecto.ts';
import { crearColaborador } from '../src/models/Colaborador.ts';
import {
    idRemoto,
    idRemotoOPropio,
    mapearSolicitud,
    mapearSesion,
    mapearCancion,
    mapearProyecto,
    mapearColaborador,
} from '../src/infrastructure/supabaseSync.ts';
import { generarIdUnico } from '../src/infrastructure/storage.ts';

test('las entidades nuevas nacen sin id remoto', () => {
    assert.equal(crearSolicitud({}).id_remoto, null);
    assert.equal(crearSesion({}).id_remoto, null);
    assert.equal(crearCancion({}).id_remoto, null);
    assert.equal(crearProyecto({}).id_remoto, null);
    assert.equal(crearColaborador({}).id_remoto, null);
});

test('idRemoto devuelve null cuando la entidad nunca se subio', () => {
    assert.equal(idRemoto(crearSolicitud({ id: 7 })), null);
    assert.equal(idRemoto(null), null);
    assert.equal(idRemoto(undefined), null);
});

test('idRemoto devuelve el id de Supabase cuando la entidad ya subio', () => {
    const solicitud = crearSolicitud({ id: 7, id_remoto: 42 });
    assert.equal(idRemoto(solicitud), 42);
});

test('idRemotoOPropio cae al id propio solo si no hay id remoto', () => {
    assert.equal(idRemotoOPropio(crearSolicitud({ id: 7, id_remoto: 42 })), 42);
    assert.equal(idRemotoOPropio(crearSolicitud({ id: 7 })), 7);
    assert.equal(idRemotoOPropio(crearSolicitud({ id: null })), null);
});

test('los mapeos de Supabase guardan el id remoto de la fila', () => {
    assert.equal(mapearSolicitud({ id: 11, estado: 'solicitada' }).id_remoto, 11);
    assert.equal(mapearSesion({ id: 12, estado: 'confirmada' }).id_remoto, 12);
    assert.equal(mapearCancion({ id: 13, nombre: 'Cancion' }).id_remoto, 13);
    assert.equal(mapearProyecto({ id: 14, nombre: 'Proyecto' }).id_remoto, 14);
    assert.equal(mapearColaborador({ id: 'uuid-15', nombre: 'Artista' }).id_remoto, 'uuid-15');
});

test('el id remoto de un mapeo es el mismo id de la fila en Supabase', () => {
    const solicitud = mapearSolicitud({ id: 11, estado: 'solicitada' });
    assert.equal(solicitud.id, solicitud.id_remoto);
});

test('generarIdUnico no repite un id que ya existe en Supabase', () => {
    const entidades = [
        crearSolicitud({ id: 3, id_remoto: 3 }),
        crearSolicitud({ id: 9, id_remoto: 9 }),
    ];
    assert.equal(generarIdUnico(entidades), 10);
});

test('generarIdUnico ignora los ids de texto que no son numeros', () => {
    const entidades = [crearColaborador({ id: 'uuid-abc' })];
    assert.equal(generarIdUnico(entidades), 1);
});
