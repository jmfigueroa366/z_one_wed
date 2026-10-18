// Conexión a Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? '';
const supabaseLlave = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? '';

// Simula una consulta encadenable (select().order()... ) que se puede
// esperar con await, igual que el cliente real de Supabase.
function crearConsulta(dataInicial = [], esUnico = false) {
    const respuesta = { data: esUnico ? null : dataInicial, error: null };
    const promesa = Promise.resolve(respuesta);
    const consulta = {
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
        maybeSingle() { return crearConsulta(null, true); },
        single() { return crearConsulta(null, true); },
        then(cuandoListo, cuandoFalla) { return promesa.then(cuandoListo, cuandoFalla); },
        catch(cuandoFalla) { return promesa.catch(cuandoFalla); },
        finally(alTerminar) { return promesa.finally(alTerminar); },
    };
    return consulta;
}

// Si faltan las variables de entorno (entornos de test o sin .env),
// exportamos un cliente mínimo para evitar errores al importar los módulos.
export const supabase = (supabaseUrl && supabaseLlave)
    ? createClient(supabaseUrl, supabaseLlave)
    : {
        from() {
            return crearConsulta();
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
                return Promise.resolve({ data: { session: null } });
            },
            onAuthStateChange() {
                return { data: { subscription: { unsubscribe() {} } } };
            },
        },
    };

    // Hay credenciales reales de Supabase
export const haySupabase = Boolean(supabaseUrl && supabaseLlave);