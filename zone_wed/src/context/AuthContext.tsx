// CAPA: Presentaci�n
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthService } from '../services/authService.ts';
import type { EntradaUsuario, Usuario } from '../models/Usuario.ts';
import { refrescarDatosUsuario } from '../infrastructure/supabaseSync.ts';
import { Storage } from '../infrastructure/storage.ts';

interface ContextoAuth {
    usuario: Usuario | null;
    cargando: boolean;
    isAuthenticated: boolean;
    iniciarSesion: (email: string, password: string, rol?: string | null) => Promise<Usuario | null>;
    registrarUsuario: (data?: EntradaUsuario) => Promise<Usuario | boolean>;
    cerrarSesion: () => Promise<boolean>;
}

export const AuthContext = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let activo = true;
        AuthService.obtenerSesion()
            .then(async (sesion: Usuario | null) => {
                if (!activo) return;
                setUsuario(sesion);
                if (sesion) {
                    await refrescarDatosUsuario();
                }
            })
            .catch(() => {
            })
            .finally(() => {
                if (activo) {
                    setCargando(false);
                }
            });
        const desuscribir = AuthService.escucharSesion((evento: string) => {
            if (evento === 'SIGNED_OUT') {
                setUsuario(null);
                setCargando(false);
            } else if (evento === 'SIGNED_IN') {
                AuthService.obtenerSesion()
                    .then((sesion: Usuario | null) => setUsuario(sesion))
                    .catch(() => undefined);
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
        iniciarSesion: async (email: string, password: string, rol?: string | null) => {
            const usuarioAutenticado = await AuthService.iniciarSesion(email, password, rol);
            if (usuarioAutenticado) {
                setUsuario(usuarioAutenticado);
                try {
                    await refrescarDatosUsuario();
                } catch (error) {
                    console.warn('No se pudieron refrescar los datos tras iniciar sesi�n.', error);
                }
            }
            return usuarioAutenticado;
        },
        registrarUsuario: async (data: EntradaUsuario = {}) => {
            const resultado = await AuthService.registrarUsuario(data);
            setUsuario(null);
            return resultado;
        },
        cerrarSesion: async () => {
            const resultado = await AuthService.cerrarSesion();
            setUsuario(null);
            Storage.limpiarTodo();
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
