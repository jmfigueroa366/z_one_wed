import test, { after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
    claveCancion,
    claveProyecto,
    configurarClienteSupabase,
    esperarEscritura,
    insertarCancion,
    insertarColaborador,
    insertarProyecto,
    insertarSesion,
    insertarSolicitud,
    sincronizarSalas,
} from '../src/infrastructure/supabaseSync.ts';
import { cancionRepo } from '../src/repositories/cancionRepo.ts';
import { proyectoRepo } from '../src/repositories/proyectoRepo.ts';

const windowOriginal = globalThis.window;
const valores = new Map<string, string>();

const UUID_CLIENTE = '11111111-1111-4111-8111-111111111111';
const UUID_USUARIO = '22222222-2222-4222-8222-222222222222';

interface Fila {
    [clave: string]: unknown;
}

interface Llamada {
    tabla: string;
    operacion: 'select' | 'insert' | 'update' | 'delete';
    datos: unknown;
}

interface OpcionesFalso {
    filas?: Record<string, Fila[]>;
    // Devuelve un error para la escritura (por ejemplo, una columna que no existe).
    escribir?: (tabla: string, datos: unknown) => { code?: string; message?: string } | null;
}

const llamadas: Llamada[] = [];

// Cliente falso que anota las escrituras y responde con los datos que se le pasan.
function crearClienteFalso(opciones: OpcionesFalso = {}) {
    let siguienteId = 500;

    const consulta = (tabla: string) => {
        const llamada: Llamada = { tabla, operacion: 'select', datos: undefined };
        const filtros: Array<[string, unknown]> = [];

        const resolver = (unaFila: boolean) => {
            if (llamada.operacion === 'insert') {
                const error = opciones.escribir?.(tabla, llamada.datos) ?? null;
                if (error) {
                    return { data: null, error };
                }
                siguienteId += 1;
                return { data: { id: siguienteId }, error: null };
            }
            if (llamada.operacion === 'update') {
                const error = opciones.escribir?.(tabla, llamada.datos) ?? null;
                return { data: null, error };
            }
            if (llamada.operacion === 'delete') {
                return { data: null, error: null };
            }
            const filas = (opciones.filas?.[tabla] ?? []).filter((fila) =>
                filtros.every(([columna, valor]) => {
                    if (Array.isArray(valor)) {
                        return valor.map(String).includes(String(fila[columna]));
                    }
                    return String(fila[columna]) === String(valor);
                })
            );
            return { data: unaFila ? (filas[0] ?? null) : filas, error: null };
        };

        const promesaLista = {
            then: (cb: (v: unknown) => unknown) => Promise.resolve(resolver(false)).then(cb),
        };
        const promesaFila = {
            then: (cb: (v: unknown) => unknown) => Promise.resolve(resolver(true)).then(cb),
        };

        const api = {
            select() { return api; },
            insert(valores: unknown) { llamada.operacion = 'insert'; llamada.datos = valores; llamadas.push(llamada); return api; },
            update(valores: unknown) { llamada.operacion = 'update'; llamada.datos = valores; llamadas.push(llamada); return api; },
            delete() { llamada.operacion = 'delete'; llamadas.push(llamada); return api; },
            eq(columna: string, valor: unknown) { filtros.push([columna, valor]); return api; },
            in(columna: string, valores: unknown[]) { filtros.push([columna, valores]); return api; },
            order() { return api; },
            maybeSingle() { return promesaFila; },
            single() { return promesaFila; },
            then: promesaLista.then,
        };
        return api;
    };

    return {
        from(tabla: string) {
            return consulta(tabla);
        },
        rpc() {
            return Promise.resolve({ data: 'cliente-principal', error: null });
        },
    };
}

function guardar(clave: string, valor: unknown) {
    valores.set(`z_one_wed_${clave}`, JSON.stringify(valor));
}

function leer(clave: string): unknown {
    const bruto = valores.get(`z_one_wed_${clave}`);
    return bruto ? JSON.parse(bruto) : null;
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
    configurarClienteSupabase(crearClienteFalso({
        filas: {
            clientes: [{ id: 'cliente-uuid', usuario_id: UUID_CLIENTE }],
        },
    }));
});

after(() => {
    if (windowOriginal === undefined) {
        Reflect.deleteProperty(globalThis, 'window');
    } else {
        globalThis.window = windowOriginal;
    }
});

test('al crear un proyecto se envia el cliente, el nombre, el tipo y el estado', async () => {
    await insertarProyecto({ nombre: 'Mi primer album', tipo: 'album' }, 'cliente-uuid');

    const llamada = llamadas.find((item) => item.tabla === 'proyectos' && item.operacion === 'insert');
    assert.ok(llamada);
    assert.deepEqual(llamada.datos, {
        cliente_id: 'cliente-uuid',
        nombre: 'Mi primer album',
        tipo: 'album',
        estado: 'activo',
    });
});

test('al crear una cancion se envia el proyecto y la duracion en segundos', async () => {
    await insertarCancion({ nombre: 'Amanecer', duracion: 3, partes: ['Vocales'] }, 77);

    const llamada = llamadas.find((item) => item.tabla === 'canciones' && item.operacion === 'insert');
    assert.ok(llamada);
    const datos = llamada.datos as Record<string, unknown>;
    assert.equal(datos.proyecto_id, 77);
    assert.equal(datos.titulo, 'Amanecer');
    assert.equal(datos.duracion_seg, 180);
    assert.deepEqual(datos.partes, ['Vocales']);
});

test('al crear un colaborador se envia el perfil de la base de datos y la fecha de ingreso', async () => {
    await insertarColaborador({ nombre: 'Lua', perfil: 'produccion', especialidad: 'Canto', usuario_id: UUID_USUARIO });

    const llamada = llamadas.find((item) => item.tabla === 'colaboradores' && item.operacion === 'insert');
    assert.ok(llamada);
    const datos = llamada.datos as Record<string, unknown>;
    assert.equal(datos.perfil, 'productor');
    assert.equal(datos.nombre_artistico, 'Lua');
    assert.equal(datos.especialidad, 'Canto');
    assert.equal(datos.visible_publico, true);
    assert.equal(datos.usuario_id, UUID_USUARIO);
    assert.match(String(datos.fecha_ingreso), /^\d{4}-\d{2}-\d{2}$/);
});

test('las claves foraneas de una solicitud se traducen a los ids remotos', async () => {
    guardar('salas', [{ id: 1, id_remoto: 3, nombre: 'Sala A' }]);
    guardar('canciones', [{ id: 2, id_remoto: 9, nombre: 'Amanecer' }]);
    guardar('proyectos', [{ id: 4, id_remoto: 12, nombre: 'Album' }]);

    await insertarSolicitud({
        titulo: 'Grabacion',
        sala_id: 1,
        cancion_id: 2,
        proyecto_id: 4,
        estado: 'solicitada',
    });

    const llamada = llamadas.find((item) => item.tabla === 'solicitudes' && item.operacion === 'insert');
    assert.ok(llamada);
    const datos = llamada.datos as Record<string, unknown>;
    assert.equal(datos.sala_id, 3);
    assert.equal(datos.cancion_id, 9);
    assert.equal(datos.proyecto_id, 12);
});

test('una clave foranea que no existe en Supabase se deja nula', async () => {
    guardar('salas', [{ id: 1, id_remoto: 3, nombre: 'Sala A' }]);

    await insertarSolicitud({ titulo: 'Grabacion', sala_id: 1, cancion_id: 99 });

    const llamada = llamadas.find((item) => item.tabla === 'solicitudes' && item.operacion === 'insert');
    assert.ok(llamada);
    const datos = llamada.datos as Record<string, unknown>;
    assert.equal(datos.sala_id, 3);
    // La cancion solo existe en local: se envia nula, no el id local.
    assert.equal(datos.cancion_id, null);
});

test('las claves foraneas de una sesion se traducen a los ids remotos', async () => {
    guardar('colaboradores', [{ id: 1, id_remoto: UUID_CLIENTE, nombre: 'Lua' }]);
    guardar('salas', [{ id: 1, id_remoto: 3, nombre: 'Sala A' }]);

    await insertarSesion({ titulo: 'Sesion', sala_id: 1, colaborador_id: 1, estado: 'confirmada' });

    const llamada = llamadas.find((item) => item.tabla === 'sesiones' && item.operacion === 'insert');
    assert.ok(llamada);
    const datos = llamada.datos as Record<string, unknown>;
    assert.equal(datos.sala_id, 3);
    assert.equal(datos.colaborador_id, UUID_CLIENTE);
});

test('al crear un proyecto en la app se sube a Supabase con su cliente', async () => {
    const proyecto = proyectoRepo.crear({ nombre: 'Album nuevo', tipo: 'album', usuario_id: UUID_CLIENTE });

    await esperarEscritura(claveProyecto(proyecto.id));

    const llamada = llamadas.find((item) => item.tabla === 'proyectos' && item.operacion === 'insert');
    assert.ok(llamada);
    const datos = llamada.datos as Record<string, unknown>;
    assert.equal(datos.cliente_id, 'cliente-uuid');
    assert.equal(datos.nombre, 'Album nuevo');
});

test('una cancion espera a que su proyecto exista en Supabase', async () => {
    const proyecto = proyectoRepo.crear({ nombre: 'Album nuevo', tipo: 'album', usuario_id: UUID_CLIENTE });
    await esperarEscritura(claveProyecto(proyecto.id));

    const cancion = cancionRepo.crear({ nombre: 'Tema', proyecto_id: proyecto.id, duracion: 3 });
    await esperarEscritura(claveCancion(cancion.id));

    const llamada = llamadas.find((item) => item.tabla === 'canciones' && item.operacion === 'insert');
    assert.ok(llamada);
    const datos = llamada.datos as Record<string, unknown>;
    // El proyecto ya tiene id en Supabase: la cancion apunta a ese id.
    assert.equal(datos.proyecto_id, 501);
    assert.equal(cancion.proyecto_id, proyecto.id);
});

test('al sincronizar las salas se conserva el id local de las que ya existen', async () => {
    guardar('salas', [
        { id: 1, id_remoto: 3, nombre: 'Sala A', origen: 'seed' },
        { id: 2, nombre: 'Cabina B', origen: 'seed' },
    ]);
    configurarClienteSupabase(crearClienteFalso({
        filas: {
            salas: [
                { id: 3, nombre: 'Sala A', precio_hora: 45000, activo: true },
                { id: 1, nombre: 'Sala C', precio_hora: 40000, activo: true },
            ],
        },
    }));

    const salas = await sincronizarSalas();

    assert.equal(salas.length, 2);
    const salaA = salas.find((sala) => String(sala.id_remoto) === '3');
    assert.ok(salaA);
    // La fila que ya existia conserva su id local (las referencias no se rompen).
    assert.equal(salaA.id, 1);
    assert.equal(salaA.nombre, 'Sala A');
    // La sala que solo existe en Supabase entra con un id local nuevo.
    const salaC = salas.find((sala) => String(sala.id_remoto) === '1');
    assert.ok(salaC);
    assert.equal(salaC.nombre, 'Sala C');
    // La sala del seed que no esta en Supabase se retira.
    assert.equal(salas.find((sala) => String(sala.nombre) === 'Cabina B'), undefined);
    assert.equal((leer('salas') as unknown[]).length, 2);
});
