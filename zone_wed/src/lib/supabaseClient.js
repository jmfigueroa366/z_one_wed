import { createClient } from '@supabase/supabase-js';

//direccion y llave de supabase de .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseLlave = import.meta.env.VITE_SUPABASE_ANON_KEY;

//por si no encuentra la url o la llave
if (!supabaseUrl || !supabaseLlave) {
    throw new Error('No se encontró la URL o la llave de Supabase en el archivo.env');
}

//Conexión a supabase y la deja disponible para React
export const supabase = createClient(supabaseUrl, supabaseLlave);
