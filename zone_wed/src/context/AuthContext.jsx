// CAPA: Presentación
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthService } from '../services/authService.js';
import { refrescarDatosUsuario } from '../infrastructure/supabaseSync.js';
import { Storage } from '../infrastructure/storage.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let activo = true;

        //Al abrir la app, recupera la sesión del usuario guardada por Supabase
        AuthService.obtenerSesion()
            .then(async (sesion) => {
                if (!activo) {
                    return;
                }
                setUsuario(sesion);
                if (sesion) {
                    await refrescarDatosUsuario();
                }
            })
            .catch(() => {
                //Sin sesión guardada o falló la red: seguimos en la pantalla de login.
            })
            .finally(() => {
                if (activo) {
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

    const value = useMemo(() => ({
        usuario,
        cargando,
        isAuthenticated: Boolean(usuario),
        iniciarSesion: async (...args) => {
            const usuarioAutenticado = await AuthService.iniciarSesion(...args);
            if (usuarioAutenticado) {
                setUsuario(usuarioAutenticado);
                try {
                    await refrescarDatosUsuario();
                } catch (error) {
                    console.warn('No se pudieron refrescar los datos tras iniciar sesión.', error);
                }
            }
            return usuarioAutenticado;
        },
        registrarUsuario: async (...args) => {
            const resultado = await AuthService.registrarUsuario(...args);
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
