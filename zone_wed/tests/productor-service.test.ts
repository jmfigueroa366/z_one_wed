import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { ProductorService } from '../src/services/productorService.ts';
import { ArtistaService } from '../src/services/artistaService.ts';

const windowOriginal = globalThis.window;
const valores = new Map<string, string>();

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

test('lista productores activos del estudio', () => {
    const productores = ProductorService.listar();

    assert.deepEqual(productores.map((productor) => productor.nombre), ['Batey Norte', 'Leo Norte']);
});

test('un productor registrado aparece en la lista y no entre los artistas', () => {
    const productor = ProductorService.crear({ nombre: ' Marco Reyes ', especialidad: 'Grabación' });

    assert.equal(productor.nombre, 'Marco Reyes');
    assert.equal(productor.perfil, 'produccion');
    assert.equal(ProductorService.obtenerPorId(productor.id!)?.nombre, 'Marco Reyes');
    assert.ok(ProductorService.listar().some((item) => item.id === productor.id));
    assert.equal(ArtistaService.listar().some((item) => item.id === productor.id), false);
});

test('rechaza productores sin nombre o con especialidad inválida', () => {
    assert.throws(() => ProductorService.crear({ nombre: '  ', especialidad: 'Grabación' }), /nombre.*obligatorio/);
    assert.throws(() => ProductorService.crear({ nombre: 'Marco', especialidad: 'Canto' }), /especialidad válida/);
});
