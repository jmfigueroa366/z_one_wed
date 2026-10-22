import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { configurarClienteSupabase, hayConexionSupabase } from '../src/infrastructure/supabaseSync.ts';
import { cancionRepo } from '../src/repositories/cancionRepo.ts';
import { crearCancion } from '../src/models/Cancion.ts';

const windowOriginal = globalThis.window;
const valores = new Map<string, string>();

interface Llamada {
    tabla: string;
    operacion: string;
    id: unknown;
}

const llamadas: Llamada[] = [];

function crearClienteFalso() {
    const consulta = (tabla: string) => {
        const promesa = { then: (cb: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(cb) };
        const api = {
            select() { return api; },
            insert() { return api; },
            update() { return api; },
            delete() { llamadas.push({ tabla, operacion: 'delete', id: null }); return api; },
            eq(_columna: string, valor: unknown) {
                const ultima = llamadas[llamadas.length - 1];
                if (ultima) {
                    ultima.id = valor;
                }
                return api;
            },
            order() { return api; },
            maybeSingle() { return promesa; },
            single() { return promesa; },
            then: promesa.then,
        };
        return api;
    };
    return {
        from: (tabla: string) => consulta(tabla),
        rpc: () => Promise.resolve({ data: null, error: null }),
    };
}

beforeEach(() => {
    valores.clear();
    llamadas.length = 0;
    globalThis.window = {
        localStorage: {
            getItem: (clave: string) => valores.get(clave) ?? null,
            setItem: (clave: string, valor: string) => {
                valores.set(clave, valor);
            },
            removeItem: (clave: string) => valores.delete(clave),
        },
    } as unknown as Window & typeof globalThis;
    configurarClienteSupabase(crearClienteFalso());
});

after(() => {
    if (windowOriginal === undefined) {
        Reflect.deleteProperty(globalThis, 'window');
    } else {
        globalThis.window = windowOriginal;
    }
});

test('con un cliente configurado hay conexion con Supabase', () => {
    assert.equal(hayConexionSupabase(), true);
});

test('al borrar una cancion que vino de Supabase se usa su id remoto', () => {
    const cancion = crearCancion({ id: 3, id_remoto: 77, nombre: 'Tema' });
    valores.set('z_one_wed_canciones', JSON.stringify([cancion]));

    cancionRepo.eliminar(3);

    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].tabla, 'canciones');
    // Se borra la fila 77 de Supabase, no la 3 que es el id local.
    assert.equal(llamadas[0].id, 77);
});

test('al borrar una cancion que solo existe en local no se borra nada en Supabase', () => {
    const cancion = crearCancion({ id: 3, id_remoto: null, nombre: 'Solo local' });
    valores.set('z_one_wed_canciones', JSON.stringify([cancion]));

    cancionRepo.eliminar(3);

    // La cancion no existe en Supabase: borrarla alli tocaria otra fila.
    assert.equal(llamadas.length, 0);
});

test('la cancion se quita de la lista local aunque no exista en Supabase', () => {
    const cancion = crearCancion({ id: 3, id_remoto: null, nombre: 'Solo local' });
    valores.set('z_one_wed_canciones', JSON.stringify([cancion]));

    const restantes = cancionRepo.eliminar(3);

    assert.equal(restantes.length, 0);
    assert.equal(cancionRepo.obtenerPorId(3), null);
});
