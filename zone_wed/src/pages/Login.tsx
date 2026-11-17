// CAPA: Presentación
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    Eye,
    EyeOff,
    Loader2,
    LockKeyhole,
    LogIn,
    Mail,
    ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import AuthLayout, { authBoton, authCampo, authEtiqueta } from '../components/AuthLayout.tsx';
import type { ChangeEvent, FormEvent } from 'react';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { usuario, cargando: cargandoSesion, iniciarSesion, cerrarSesion } = useAuth();
    const [formulario, setFormulario] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const destino = location.state?.from;
    const rutaDestino = destino
        ? `${destino.pathname ?? ''}${destino.search ?? ''}${destino.hash ?? ''}`
        : '/menu-principal';

    if (cargandoSesion) {
        return <main className="grid min-h-screen place-items-center bg-bg text-sutil">Cargando sesión...</main>;
    }

    if (usuario && !aviso) {
        return <Navigate to={rutaDestino} replace />;
    }

    const manejarCambio = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    };

    const manejarSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setAviso('');
        setCargando(true);

        try {
            const autenticado = await iniciarSesion(formulario.email, formulario.password);
            if (!autenticado) {
                throw new Error('Revisa tu correo y contraseña.');
            }

            if (autenticado.debeCambiarPassword) {
                setAviso('Tu cuenta usa una contraseña temporal. Debes cambiarla antes de continuar.');
                return;
            }

            navigate(rutaDestino, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message || 'No se pudo iniciar sesión.' : 'No se pudo iniciar sesión.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <AuthLayout
            titulo="Iniciar sesión"
            subtitulo="Ingresa con tu correo y contraseña para acceder al centro operativo del estudio."
        >
            <form onSubmit={manejarSubmit} className="grid gap-4">
                {aviso ? (
                    <div
                        className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/[0.08] px-4 py-3 text-sm text-texto"
                        role="status"
                    >
                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent-soft" aria-hidden="true" />
                        <div>
                            <p>{aviso}</p>
                            <button
                                type="button"
                                onClick={async () => {
                                    await cerrarSesion();
                                    setAviso('');
                                }}
                                className="mt-2 font-bold text-accent underline decoration-accent/40 underline-offset-2 transition hover:text-accent-soft"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                ) : null}

                <div>
                    <label htmlFor="login-email" className={authEtiqueta}>
                        Correo electrónico
                    </label>
                    <div className="relative">
                        <Mail
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sutil"
                            aria-hidden="true"
                        />
                        <input
                            id="login-email"
                            type="email"
                            name="email"
                            value={formulario.email}
                            onChange={manejarCambio}
                            placeholder="tu@correo.com"
                            autoComplete="email"
                            className={`${authCampo} pl-11`}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="login-password" className={authEtiqueta}>
                        Contraseña
                    </label>
                    <div className="relative">
                        <LockKeyhole
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sutil"
                            aria-hidden="true"
                        />
                        <input
                            id="login-password"
                            type={mostrarPassword ? 'text' : 'password'}
                            name="password"
                            value={formulario.password}
                            onChange={manejarCambio}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className={`${authCampo} pl-11 pr-12`}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setMostrarPassword((valor) => !valor)}
                            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            aria-pressed={mostrarPassword}
                            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-sutil transition hover:bg-white/[0.06] hover:text-texto focus:outline-none focus:ring-2 focus:ring-accent/30"
                        >
                            {mostrarPassword ? (
                                <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                                <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="-mt-1 text-right">
                    <Link
                        className="text-xs font-semibold text-accent transition hover:text-accent-soft"
                        to="/olvide-password"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                {error ? (
                    <div
                        className="flex items-start gap-2.5 rounded-2xl border border-peligro/35 bg-peligro/10 px-4 py-3 text-sm text-peligro"
                        role="alert"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <p>{error}</p>
                    </div>
                ) : null}

                <button type="submit" disabled={cargando} className={authBoton} aria-busy={cargando}>
                    {cargando ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                        <LogIn className="h-4 w-4" aria-hidden="true" />
                    )}
                    {cargando ? 'Ingresando...' : 'Ingresar al estudio'}
                </button>
            </form>

            <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                <p className="text-sm text-sutil">
                    ¿No tienes cuenta?{' '}
                    <Link
                        className="font-bold text-accent transition hover:text-accent-soft"
                        to="/register"
                        state={location.state}
                    >
                        Crear cuenta
                    </Link>
                </p>
                <Link
                    className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-surface/40 px-4 text-sm font-semibold text-texto transition hover:border-accent/60 hover:text-accent"
                    to="/"
                >
                    Volver al inicio
                </Link>
            </div>
        </AuthLayout>
    );
}
