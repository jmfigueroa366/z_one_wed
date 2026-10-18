// Conexión a Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL ?? '';
const supabaseLlave = import.meta.env?.VITE_SUPABASE_ANON_KEY ?? '';

// Si faltan las variables de entorno (entornos de test o sin .env),
// exportamos un cliente mínimo para evitar errores al importar los módulos.
export const supabase = (supabaseUrl && supabaseLlave)
    ? createClient(supabaseUrl, supabaseLlave)
    : {
        from() {
            return {
                select() {
                    return Promise.resolve({ data: [], error: null });
                },
                insert() {
                    return Promise.resolve({ data: [], error: null });
                },
                update() {
                    return Promise.resolve({ data: [], error: null });
                },
                delete() {
                    return Promise.resolve({ data: [], error: null });
                },
                eq() {
                    return this;
                },
                order() {
                    return this;
                },
                maybeSingle() {
                    return Promise.resolve({ data: null, error: null });
                },
                single() {
                    return Promise.resolve({ data: null, error: null });
                },
            };
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
