// CAPA: Presentación
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
                    <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-texto" role="status">
                        <p>{aviso}</p>
                        <button
                            type="button"
                            onClick={async () => {
                                await cerrarSesion();
                                setAviso('');
                            }}
                            className="mt-2 font-bold text-accent underline"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                ) : null}

                <label className="block">
                    <span className={authEtiqueta}>Email</span>
                    <input
                        type="email"
                        name="email"
                        value={formulario.email}
                        onChange={manejarCambio}
                        placeholder="Email"
                        autoComplete="email"
                        className={authCampo}
                        required
                    />
                </label>

                <label className="block">
                    <span className={authEtiqueta}>Contraseña</span>
                    <input
                        type="password"
                        name="password"
                        value={formulario.password}
                        onChange={manejarCambio}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className={authCampo}
                        required
                    />
                </label>

                <div className="-mt-1 text-right">
                    <Link className="text-xs font-semibold text-accent transition hover:text-accent-soft" to="/olvide-password">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                {error ? (
                    <p className="rounded-xl border border-peligro/40 bg-peligro/10 px-4 py-2.5 text-sm text-peligro" role="alert">
                        {error}
                    </p>
                ) : null}

                <button type="submit" disabled={cargando} className={authBoton}>
                    {cargando ? 'Ingresando...' : 'Ingresar al estudio'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-sutil">
                ¿No tienes cuenta?{' '}
                <Link className="font-bold text-accent transition hover:text-accent-soft" to="/register" state={location.state}>
                    Crear cuenta
                </Link>
            </p>
            <Link
                className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-surface/40 px-4 text-sm font-semibold text-texto transition hover:border-accent/60 hover:text-accent"
                to="/"
            >
                Volver al inicio
            </Link>
        </AuthLayout>
    );
}
