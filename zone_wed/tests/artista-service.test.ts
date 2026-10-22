import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { ArtistaService } from '../src/services/artistaService.ts';
import { ProductorService } from '../src/services/productorService.ts';

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
    if (windowOriginal === undefined){
        Reflect.deleteProperty(globalThis, 'window');
    } else {
        globalThis.window = windowOriginal;
    }
});

test('lista artistas activos sin incluir productores', () => {
    const artistas = ArtistaService.listar();

    assert.deepEqual(artistas.map((artista) => artista.nombre), ['Lúa Ferreira', 'Nova Lima']);
});

test('registra y persiste artistas con su estilo y foto opcional', () => {
    const artista = ArtistaService.crear({
        nombre: ' Luna Mar ',
        especialidad: 'Pop',
        imagen: 'data:image/jpeg;base64,YWJj',
    });

    assert.equal(artista.nombre, 'Luna Mar');
    assert.equal(artista.especialidad, 'Pop');
    assert.equal(artista.perfil, 'artista');
    assert.equal(artista.imagen, 'data:image/jpeg;base64,YWJj');
    assert.equal(ArtistaService.obtenerPorId(artista.id!)?.nombre, 'Luna Mar');
    assert.equal(ProductorService.listar().some((item) => item.id === artista.id), false);
});

test('rechaza nombres vacíos, géneros inválidos e imágenes inválidas', () => {
    assert.throws(() => ArtistaService.crear({ nombre: '  ', especialidad: 'Pop' }), /nombre.*obligatorio/);
    assert.throws(() => ArtistaService.crear({ nombre: 'Luna Mar', especialidad: 'Metal' }), /género.*válida/);
    assert.throws(() => ArtistaService.crear({
        nombre: 'Luna Mar',
        especialidad: 'Pop',
        imagen: 'javascript:alert(1)',
    }), /imagen JPG, PNG o WebP válida/);
});
