// CAPA: Presentación
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '../services/authService.ts';
import type { EntradaUsuario, Usuario } from '../models/Usuario.ts';
zone_wed/src/context/AuthContext.jsx

interface ContextoAuth {
    usuario: Usuario | null;
    cargando: boolean;
    isAuthenticated: boolean;
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

        //Al abrir la app, recupera la sesión del usuario guardada por Supabase
        AuthService.obtenerSesion().then((sesion) => {
            if (activo) {
                setUsuario(sesion);
                setCargando(false);
            }
        });

        //Si Supabase cierra la sesión, actualiza el estado del usuario
        const desuscribir = AuthService.escucharSesion((evento) => {
            if (evento === 'SIGNED_OUT') {
                setUsuario(null);
                setCargando(false);
            }
        });

        return () => {
            activo = false;
            if (typeof desuscribir === 'function') {
                desuscribir();
            }
        };
    }, []);

    const value = useMemo<ContextoAuth>(() => ({
        usuario,
        cargando,
        isAuthenticated: Boolean(usuario),
        iniciarSesion: async (email: string, password: string, rol: string | null = null) => {
            const usuarioAutenticado = await AuthService.iniciarSesion(email, password, rol);
            setUsuario(usuarioAutenticado);
            return usuarioAutenticado;
        },
        registrarUsuario: async (data: EntradaUsuario = {}) => {
            const usuarioRegistrado = await AuthService.registrarUsuario(data);
zone_wed/src/context/AuthContext.jsx
            setUsuario(null);
            return resultado;
        },
        cerrarSesion: async () => {
            const resultado = await AuthService.cerrarSesion();
            setUsuario(null);
            return resultado;
        },
    }), [usuario, cargando]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider.');
    }
    return context;
}
