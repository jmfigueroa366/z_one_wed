import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { configurarClienteSupabase, insertarCancion } from '../src/infrastructure/supabaseSync.ts';

const windowOriginal = globalThis.window;
const valores = new Map<string, string>();

interface Llamada {
    tabla: string;
    operacion: string;
    datos: unknown;
}

// Cliente falso que puede rechazar una columna que todavia no existe en la
// base de datos (por ejemplo, si la migracion de la fase 2 aun no se ejecuto).
function crearClienteFalso(columnaAusente: string) {
    const llamadas: Llamada[] = [];
    let intentos = 0;

    const consulta = (tabla: string) => {
        const llamada: Llamada = { tabla, operacion: 'select', datos: undefined };
        const promesa = {
            then: (cb: (v: unknown) => unknown) => Promise.resolve(resolver()).then(cb),
        };

        const resolver = () => {
            if (llamada.operacion === 'insert') {
                intentos += 1;
                const datos = llamada.datos as Record<string, unknown>;
                if (intentos === 1 && columnaAusente in datos) {
                    return {
                        data: null,
                        error: {
                            code: 'PGRST204',
                            message: `Could not find the '${columnaAusente}' column of 'canciones' in the schema cache`,
                        },
                    };
                }
                return { data: { id: 900 }, error: null };
            }
            return { data: [], error: null };
        };

        const api = {
            select() { return api; },
            insert(valores: unknown) { llamada.operacion = 'insert'; llamada.datos = valores; llamadas.push(llamada); return api; },
            update(valores: unknown) { llamada.operacion = 'update'; llamada.datos = valores; llamadas.push(llamada); return api; },
            delete() { llamada.operacion = 'delete'; llamadas.push(llamada); return api; },
            eq() { return api; },
            in() { return api; },
            order() { return api; },
            maybeSingle() { return promesa; },
            single() { return promesa; },
            then: promesa.then,
        };
        return api;
    };

    return {
        cliente: {
            from: (tabla: string) => consulta(tabla),
            rpc: () => Promise.resolve({ data: null, error: null }),
        },
        llamadas,
        intentos: () => intentos,
    };
}

beforeEach(() => {
    valores.clear();
    globalThis.window = {
        localStorage: {
            getItem: (clave: string) => valores.get(clave) ?? null,
            setItem: (clave: string, valor: string) => {
                valores.set(clave, valor);
            },
            removeItem: (clave: string) => valores.delete(clave),
        },
    } as unknown as Window & typeof globalThis;
});

after(() => {
    if (windowOriginal === undefined) {
        Reflect.deleteProperty(globalThis, 'window');
    } else {
        globalThis.window = windowOriginal;
    }
});

test('si la columna no existe se reintenta sin ella y el resto si se guarda', async () => {
    const falso = crearClienteFalso('partes');
    configurarClienteSupabase(falso.cliente);

    await insertarCancion({ nombre: 'Amanecer', duracion: 3, partes: ['Vocales'] }, 77);

    assert.equal(falso.intentos(), 2);
    const ultima = falso.llamadas[falso.llamadas.length - 1];
    const datos = ultima.datos as Record<string, unknown>;
    // La columna que falta se quita, pero el resto de los datos se guardan.
    assert.equal('partes' in datos, false);
    assert.equal(datos.titulo, 'Amanecer');
    assert.equal(datos.duracion_seg, 180);
    assert.equal(datos.proyecto_id, 77);
});
