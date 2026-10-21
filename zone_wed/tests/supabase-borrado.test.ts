import test from 'node:test';
import assert from 'node:assert/strict';

import { configurarClienteSupabase, idRemoto, eliminarFilaRemota } from '../src/infrastructure/supabaseSync.ts';

interface Llamada {
    tabla: string;
    operacion: 'delete' | 'update' | 'insert' | 'select';
    id: unknown;
    datos: unknown;
}

// Cliente falso que anota las escrituras para poder comprobarlas.
function crearClienteFalso(llamadas: Llamada[]) {
    const consulta = (tabla: string) => {
        const respuesta = { data: [], error: null };
        const promesa = {
            then: (cb: (v: typeof respuesta) => unknown) => Promise.resolve(respuesta).then(cb),
        };
        const api = {
            select() { return api; },
            insert(valores: unknown) { llamadas.push({ tabla, operacion: 'insert', id: null, datos: valores }); return api; },
            update(valores: unknown) { llamadas.push({ tabla, operacion: 'update', id: null, datos: valores }); return api; },
            delete() { llamadas.push({ tabla, operacion: 'delete', id: null, datos: null }); return api; },
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
        from(tabla: string) {
            return consulta(tabla);
        },
        rpc() {
            return Promise.resolve({ data: null, error: null });
        },
    };
}

test('eliminarFilaRemota borra la fila con el id indicado', async () => {
    const llamadas: Llamada[] = [];
    configurarClienteSupabase(crearClienteFalso(llamadas));

    await eliminarFilaRemota('canciones', 42);

    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].tabla, 'canciones');
    assert.equal(llamadas[0].operacion, 'delete');
    assert.equal(llamadas[0].id, 42);
});

test('eliminarFilaRemota no borra nada cuando falta el id', async () => {
    const llamadas: Llamada[] = [];
    configurarClienteSupabase(crearClienteFalso(llamadas));

    await eliminarFilaRemota('canciones', null);
    await eliminarFilaRemota('canciones', undefined);

    assert.equal(llamadas.length, 0);
});

test('una entidad sin id remoto no expone ningun id para borrar', () => {
    assert.equal(idRemoto({ id_remoto: null }), null);
    assert.equal(idRemoto({}), null);
    assert.equal(idRemoto(null), null);
});
