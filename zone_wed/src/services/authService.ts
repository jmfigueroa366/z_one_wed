// CAPA: Aplicación
import { Crypto } from '../infrastructure/crypto.ts';
import { Session } from '../infrastructure/session.ts';
import { usuarioRepo } from '../repositories/usuarioRepo.ts';
import { crearUsuario } from '../models/Usuario.ts';
import type { EntradaUsuario, Usuario } from '../models/Usuario.ts';
import { validarRegistro } from '../utils/validators.ts';
zone_wed/src/services/authService.js

//Toma usuario de Auth
async function construirUsuario(usuarioAuth) {
    if (!usuarioAuth) {
        return null;
    }

    const { data: fila, error } = await supabase
        .from('usuarios')
        .select('id, email, rol, activo')
        .eq('id', usuarioAuth.id)
        .maybeSingle();

        if (error || !fila || fila.activo === false) {
            return null;
        }

        let nombre = fila.email;
        let perfil = null;

        if (fila.rol === 'colaborador') {
            const { data: colaborador } = await supabase
                .from('colaboradores')
                .select('perfil, nombre_artistico, nombre_real')
                .eq('usuario_id', fila.id)
                .maybeSingle();

            if (colaborador) {
                perfil = colaborador.perfil ?? null;
                nombre = colaborador.nombre_artistico || colaborador.nombre_real || nombre;
            }
        } else if (fila.rol === 'cliente') {
            const { data: cliente } = await supabase
                .from('clientes')
                .select('nombre')
                .eq('usuario_id', fila.id)
                .maybeSingle();

                if (cliente && cliente.nombre) {
                    nombre = cliente.nombre;
                }
        }

    return {
        id: fila.id,
        email: fila.email,
        rol: fila.rol,
        perfil,
        nombre,
    activo: fila.activo,
    };
}

export const AuthService = {
    async iniciarSesion(email: string, password: string, rol: string | null = null): Promise<Usuario | null> {
        const usuarios = usuarioRepo.listar();
        const usuario = usuarios.find((item) => String(item.email).toLowerCase() === String(email).trim().toLowerCase());
zone_wed/src/services/authService.js

        const { data, error } = await supabase.auth.signInWithPassword({
            email: correo,
            password: String(password ?? ''),
        });

        if (error || !data || !data.user) {
            return null;
        }

        const usuario = await construirUsuario(data.user);

        if (!usuario || (rol && usuario.rol !== rol)) {
            await supabase.auth.signOut();
            return null;
        }

        return usuario;
    },

    async registrarUsuario(data: EntradaUsuario = {}): Promise<Usuario> {
        const email = String(data?.email ?? '').trim();
        const password = String(data?.password ?? '');
        const nombre = String(data?.nombre ?? '').trim();
        const rol = String(data?.rol ?? 'cliente');
zone_wed/src/services/authService.js

        const errores = validarRegistro({ nombre, email, password });
        if (Object.keys(errores).length > 0) {
            throw new Error(Object.values(errores)[0]);
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { nombre } },
        });

        if (error) {
            throw new Error(error.message);
        }

        return true;
    },

    // Recupera la sesión guardada por Supabase al abrir la app.
    async obtenerSesion() {
        const { data } = await supabase.auth.getSession();
        const usuarioAuth = data?.session?.user;

        if (!usuarioAuth) {
            return null;
        }

        const usuario = await construirUsuario(usuarioAuth);

        if (!usuario) {
            await supabase.auth.signOut();
            return null;
        }

        return usuario;
    },

    async cerrarSesion() {
        await supabase.auth.signOut();
        return true;
    },

    // Avisa cuando Supabase cierra la sesión (por ejemplo, en otra pestaña).
    escucharSesion(callback) {
        const { data } = supabase.auth.onAuthStateChange((evento, sesion) => {
            callback(evento, sesion);
        });

        return () => {
            if (data && data.subscription) {
                data.subscription.unsubscribe();
            }
        };
    },
};

export default AuthService;