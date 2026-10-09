// CAPA: Presentación
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthService } from '../services/authService.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const sesion = AuthService.obtenerSesion();
        setUsuario(sesion);
        setCargando(false);
    }, []);

    const value = useMemo(() => ({
        usuario,
        cargando,
        isAuthenticated: Boolean(usuario),
        iniciarSesion: async (...args) => {
            const usuarioAutenticado = await AuthService.iniciarSesion(...args);
            setUsuario(usuarioAutenticado);
            return usuarioAutenticado;
        },
        registrarUsuario: async (...args) => {
            const usuarioRegistrado = await AuthService.registrarUsuario(...args);
            setUsuario(null);
            return usuarioRegistrado;
        },
        cerrarSesion: async () => {
            const resultado = AuthService.cerrarSesion();
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
