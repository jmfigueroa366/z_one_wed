// CAPA: Presentación
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiGet, apiPost, EVENTO_SESION_EXPIRADA } from '../api/apiClient.ts';
import type { EntradaUsuario, Usuario } from '../models/Usuario.ts';
import { refrescarDatosUsuario } from '../infrastructure/supabaseSync.ts';
import { Storage } from '../infrastructure/storage.ts';

// Forma real que devuelve la API (GET /auth/me y POST /auth/login|registro).
interface UsuarioApi {
    id: string;
    email: string;
    nombre: string;
    rol: string;
    debeCambiarPassword: boolean;
    permisos: string[];
    clienteId: string | null;
    colaboradorId: string | null;
    perfilColaborador: string | null;
}

interface SesionApi {
    usuario: UsuarioApi;
    accesoExpiraEn: string;
}

function mapearUsuario(dto: UsuarioApi): Usuario {
    return {
        id: dto.id,
        nombre: dto.nombre || dto.email,
        email: dto.email,
        rol: dto.rol,
        perfil: dto.perfilColaborador ?? null,
        activo: true,
        debeCambiarPassword: Boolean(dto.debeCambiarPassword),
        permisos: dto.permisos ?? [],
        clienteId: dto.clienteId ?? null,
        colaboradorId: dto.colaboradorId ?? null,
    };
}

interface ContextoAuth {
    usuario: Usuario | null;
    cargando: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<Usuario>;
    iniciarSesion: (email: string, password: string, rol?: string | null) => Promise<Usuario | null>;
    registrarUsuario: (data?: EntradaUsuario) => Promise<Usuario>;
    cerrarSesion: () => Promise<boolean>;
}

export const AuthContext = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let activo = true;

        const alExpirarSesion = () => {
            if (activo) setUsuario(null);
        };

        window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirarSesion);

        const restaurarSesion = async () => {
            try {
                const dto = await apiGet<UsuarioApi>('/auth/me');

                if (!activo) return;

                setUsuario(mapearUsuario(dto));
                // Sincronización de datos de Supabase, independiente de la sesión de la API.
                void refrescarDatosUsuario().catch(() => undefined);
            } catch {
                if (activo) setUsuario(null);
            } finally {
                if (activo) setCargando(false);
            }
        };

        void restaurarSesion();

        return () => {
            activo = false;
            window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirarSesion);
        };
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const sesion = await apiPost<SesionApi>('/auth/login', {
            email: email.trim(),
            password,
        });
        const autenticado = mapearUsuario(sesion.usuario);
        setUsuario(autenticado);
        void refrescarDatosUsuario().catch(() => undefined);
        return autenticado;
    }, []);

    const iniciarSesion = useCallback(async (email: string, password: string, rol?: string | null) => {
        const autenticado = await login(email, password);
        if (rol && autenticado.rol !== rol) {
            await apiPost('/auth/logout').catch(() => undefined);
            setUsuario(null);
            throw new Error('La cuenta no corresponde al tipo seleccionado.');
        }
        return autenticado;
    }, [login]);

    const registrarUsuario = useCallback(async (data: EntradaUsuario = {}) => {
        const sesion = await apiPost<SesionApi>('/auth/registro', {
            Nombre: String(data.nombre ?? '').trim(),
            Email: String(data.email ?? '').trim(),
            Password: String(data.password ?? ''),
        });
        const autenticado = mapearUsuario(sesion.usuario);
        setUsuario(autenticado);
        void refrescarDatosUsuario().catch(() => undefined);
        return autenticado;
    }, []);

    const cerrarSesion = useCallback(async () => {
        try {
            await apiPost('/auth/logout');
        } catch {
            // Aunque falle la red, limpiamos la sesión local.
        }
        setUsuario(null);
        Storage.limpiarTodo();
        return true;
    }, []);

    const value = useMemo<ContextoAuth>(() => ({
        usuario,
        cargando,
        isAuthenticated: Boolean(usuario),
        login,
        iniciarSesion,
        registrarUsuario,
        cerrarSesion,
    }), [usuario, cargando, login, iniciarSesion, registrarUsuario, cerrarSesion]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider.');
    }
    return context;
}
