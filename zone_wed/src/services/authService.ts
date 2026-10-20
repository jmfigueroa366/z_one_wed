// CAPA: Aplicación
import { supabase, haySupabase } from '../lib/supabaseClient.ts';
import { Crypto } from '../infrastructure/crypto.ts';
import { Session } from '../infrastructure/session.ts';
import { usuarioRepo } from '../repositories/usuarioRepo.ts';
import { crearUsuario } from '../models/Usuario.ts';
import { validarRegistro } from '../utils/validators.ts';
import type { Usuario } from '../models/Usuario.ts';
import type { EntradaUsuario } from '../models/Usuario.ts';

interface FilaUsuario {
    id: number | null;
    email: string;
    rol: string;
    activo: boolean | null;
}

interface FilaColaborador {
    perfil: string | null;
    nombre_artistico: string | null;
    nombre_real: string | null;
}

interface FilaCliente {
    nombre: string | null;
}

// --- Autenticación con Supabase (cuando hay VITE_SUPABASE_URL/ANON_KEY) ---

async function construirUsuario(usuarioAuth: unknown): Promise<Usuario | null> {
    const auth = usuarioAuth as { id?: number | null } | null;
    if (!auth) return null;

    const { data: filaCruda, error } = await supabase
        .from('usuarios')
        .select('id, email, rol, activo')
        .eq('id', auth.id)
        .maybeSingle();

    const fila = filaCruda as FilaUsuario | null;
    if (error || !fila || fila.activo === false) return null;

    let nombre = fila.email;
    let perfil: string | null = null;

    if (fila.rol === 'colaborador') {
        const { data: colaboradorCrudo } = await supabase
            .from('colaboradores')
            .select('perfil, nombre_artistico, nombre_real')
            .eq('usuario_id', fila.id)
            .maybeSingle();
        const colaborador = colaboradorCrudo as FilaColaborador | null;
        if (colaborador) {
            perfil = colaborador.perfil ?? null;
            nombre = colaborador.nombre_artistico || colaborador.nombre_real || nombre;
        }
    } else if (fila.rol === 'cliente') {
        const { data: clienteCrudo } = await supabase
            .from('clientes')
            .select('nombre')
            .eq('usuario_id', fila.id)
            .maybeSingle();
        const cliente = clienteCrudo as FilaCliente | null;
        if (cliente && cliente.nombre) nombre = cliente.nombre;
    }

    return { id: fila.id, email: fila.email, rol: fila.rol, perfil, nombre, activo: fila.activo ?? true };
}

async function iniciarSesionSupabase(email: string, password: string, rol: string | null): Promise<Usuario | null> {
    const correo = String(email ?? '').trim().toLowerCase();
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
}

async function registrarUsuarioSupabase(datos: EntradaUsuario): Promise<Usuario | boolean> {
    const email = String(datos?.email ?? '').trim().toLowerCase();
    const password = String(datos?.password ?? '');
    const nombre = String(datos?.nombre ?? '').trim();

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
}

// --- Autenticación local (cuentas semilla, sin Supabase configurado) ---

async function iniciarSesionLocal(email: string, password: string, rol: string | null): Promise<Usuario | null> {
    const usuarios = usuarioRepo.listar();
    const usuario = usuarios.find(
        (item) => String(item.email).toLowerCase() === String(email).trim().toLowerCase()
    );

    if (!usuario || !usuario.password || (rol && usuario.rol !== rol)) {
        return null;
    }

    const passwordGuardada = String(usuario.password);
    const esPasswordHash = passwordGuardada.includes(':');
    const coincide = esPasswordHash
        ? await Crypto.verifyPassword(password, passwordGuardada)
        : password === passwordGuardada;

    if (!coincide) {
        return null;
    }

    if (!esPasswordHash && usuario.id !== null && usuario.id !== undefined) {
        const passwordHash = await Crypto.hashPassword(password);
        usuarioRepo.actualizar(usuario.id, { ...usuario, password: passwordHash });
    }

    const usuarioSesion = crearUsuario({ ...usuario, password: undefined });
    delete usuarioSesion.password;
    Session.guardar(usuarioSesion);
    return usuarioSesion;
}

async function registrarUsuarioLocal(data: EntradaUsuario): Promise<Usuario> {
    const email = String(data?.email ?? '').trim();
    const password = String(data?.password ?? '');
    const nombre = String(data?.nombre ?? '').trim();
    const rol = String(data?.rol ?? 'cliente');

    const errores = validarRegistro({ nombre, email, password });
    if (Object.keys(errores).length > 0) {
        throw new Error(Object.values(errores)[0]);
    }

    if (!['cliente', 'colaborador'].includes(rol)) {
        throw new Error('El tipo de cuenta debe ser Cliente o Colaborador.');
    }

    const usuarios = usuarioRepo.listar();
    const existente = usuarios.find(
        (usuario) => String(usuario.email).toLowerCase() === email.toLowerCase()
    );
    if (existente) {
        throw new Error('El email ya existe en la base de datos.');
    }

    const usuarioConHash = crearUsuario({
        ...data,
        nombre,
        email,
        password: await Crypto.hashPassword(password),
        rol,
        activo: data?.activo ?? true,
    });

    return usuarioRepo.crear(usuarioConHash);
}

export const AuthService = {
    async iniciarSesion(email: string, password: string, rol: string | null = null): Promise<Usuario | null> {
        if (haySupabase) {
            return iniciarSesionSupabase(email, password, rol);
        }
        return iniciarSesionLocal(email, password, rol);
    },

    async registrarUsuario(datos: EntradaUsuario = {}): Promise<Usuario | boolean> {
        if (haySupabase) {
            return registrarUsuarioSupabase(datos);
        }
        return registrarUsuarioLocal(datos);
    },

    async obtenerSesion(): Promise<Usuario | null> {
        if (haySupabase) {
            const { data } = await supabase.auth.getSession();
            const usuarioAuth = data?.session?.user;
            if (!usuarioAuth) return null;

            const usuario = await construirUsuario(usuarioAuth);
            if (!usuario) {
                await supabase.auth.signOut();
                return null;
            }
            return usuario;
        }
        return Session.obtener();
    },

    async cerrarSesion(): Promise<boolean> {
        if (haySupabase) {
            await supabase.auth.signOut();
            return true;
        }
        Session.cerrar();
        return true;
    },

    // Si no hay Supabase, observa los cambios de sesión en el mismo navegador.
    escucharSesion(callback: (evento: string, sesion: unknown) => void): () => void {
        if (haySupabase) {
            const { data } = supabase.auth.onAuthStateChange((evento, sesion) => callback(evento, sesion));
            return () => { data?.subscription?.unsubscribe(); };
        }

        const manejarAlmacenamiento = (evento: StorageEvent) => {
            if (evento.key && evento.key.endsWith('sesion')) {
                callback(evento.newValue ? 'SIGNED_IN' : 'SIGNED_OUT', Session.obtener());
            }
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', manejarAlmacenamiento);
            return () => window.removeEventListener('storage', manejarAlmacenamiento);
        }
        return () => {};
    },
};

export default AuthService;
