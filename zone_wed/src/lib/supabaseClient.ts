// CAPA: Infraestructura
// Conexión a Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? '';
const supabaseLlave = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? '';

interface RespuestaConsulta<T> {
    data: T;
    error: { message: string } | null;
}

interface Consulta<T> extends PromiseLike<RespuestaConsulta<T>> {
    select(...args: unknown[]): Consulta<T>;
    insert(...args: unknown[]): Consulta<T>;
    update(...args: unknown[]): Consulta<T>;
    delete(...args: unknown[]): Consulta<T>;
    upsert(...args: unknown[]): Consulta<T>;
    eq(...args: unknown[]): Consulta<T>;
    neq(...args: unknown[]): Consulta<T>;
    in(...args: unknown[]): Consulta<T>;
    order(...args: unknown[]): Consulta<T>;
    limit(...args: unknown[]): Consulta<T>;
    range(...args: unknown[]): Consulta<T>;
    maybeSingle(): Consulta<T | null>;
    single(): Consulta<T | null>;
    catch(cuandoFalla?: (motivo: unknown) => unknown): Promise<RespuestaConsulta<T> | unknown>;
    finally(alTerminar?: (() => void) | null): Promise<RespuestaConsulta<T>>;
}

// Simula una consulta encadenable (select().order()... ) que se puede
// esperar con await, igual que el cliente real de Supabase.
function crearConsulta<T>(dataInicial: T, esUnico = false): Consulta<T> {
    const respuesta: RespuestaConsulta<T> = { data: esUnico ? (null as T) : dataInicial, error: null };
    const promesa: PromiseLike<RespuestaConsulta<T>> = {
        then(cuandoListo) { return Promise.resolve(respuesta).then(cuandoListo); },
    };
    const consulta: Consulta<T> = {
        select() { return consulta; },
        insert() { return consulta; },
        update() { return consulta; },
        delete() { return consulta; },
        upsert() { return consulta; },
        eq() { return consulta; },
        neq() { return consulta; },
        in() { return consulta; },
        order() { return consulta; },
        limit() { return consulta; },
        range() { return consulta; },
        maybeSingle() { return crearConsulta<T | null>(null as T | null, true); },
        single() { return crearConsulta<T | null>(null as T | null, true); },
        then(cuandoListo) { return promesa.then(cuandoListo); },
        catch(cuandoFalla) { return Promise.resolve(respuesta).catch(cuandoFalla); },
        finally(alTerminar) { return Promise.resolve(respuesta).finally(alTerminar); },
    };
    return consulta;
}

interface ClienteMinimo {
    from(tabla: string): Consulta<unknown[]>;
    rpc(nombre: string, args?: unknown): Promise<RespuestaConsulta<unknown>>;
    auth: {
        signInWithPassword(credenciales: { email: string; password: string }): Promise<RespuestaConsulta<{ user: unknown }>>;
        signUp(credenciales: { email: string; password: string; options?: unknown }): Promise<RespuestaConsulta<{ user: unknown }>>;
        signOut(): Promise<{ error: { message: string } | null }>;
        getSession(): Promise<RespuestaConsulta<{ session: { user: unknown } | null }>>;
        onAuthStateChange(callback: (evento: string, sesion: unknown) => void): { data: { subscription: { unsubscribe(): void } } };
    };
}

// Si faltan las variables de entorno (entornos de test o sin .env),
// exportamos un cliente mínimo para evitar errores al importar los módulos.
const clienteFalso: ClienteMinimo = {
    from() {
        return crearConsulta<unknown[]>([]);
    },
    rpc() {
        return Promise.resolve({ data: null, error: null });
    },
    auth: {
        signInWithPassword() {
            return Promise.resolve({ data: { user: null }, error: { message: 'Entorno de test' } });
        },
        signUp() {
            return Promise.resolve({ data: { user: null }, error: null });
        },
        signOut() {
            return Promise.resolve({ error: null });
        },
        getSession() {
            return Promise.resolve({ data: { session: null }, error: null });
        },
        onAuthStateChange() {
            return { data: { subscription: { unsubscribe() {} } } };
        },
    },
};

export const supabase = (supabaseUrl && supabaseLlave)
    ? createClient(supabaseUrl, supabaseLlave)
    : clienteFalso;

export type ClienteSupabase = typeof supabase;

// Hay credenciales reales de Supabase
export const haySupabase = Boolean(supabaseUrl && supabaseLlave);
