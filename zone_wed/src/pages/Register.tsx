// CAPA: Presentación
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ChevronDown,
    Eye,
    EyeOff,
    Loader2,
    LockKeyhole,
    Mail,
    ShieldCheck,
    User,
    UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import AuthLayout, { authBoton, authCampo, authEtiqueta, authSelect } from '../components/AuthLayout.tsx';
import { PASSWORD_MIN_LENGTH, validarPasswordSegura } from '../utils/validators.ts';

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const { usuario, cargando: cargandoSesion, registrarUsuario } = useAuth();
    const [formulario, setFormulario] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'cliente',
    });
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const destino = location.state?.from;
    const rutaDestino = destino
        ? `${destino.pathname ?? ''}${destino.search ?? ''}${destino.hash ?? ''}`
        : '/menu-principal';

    if (cargandoSesion) {
        return <main className="grid min-h-screen place-items-center bg-bg text-sutil">Cargando sesión...</main>;
    }

    if (usuario) {
        return <Navigate to={rutaDestino} replace />;
    }

    const manejarCambio = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    };

    const manejarSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setCargando(true);

        try {
            const erroresPassword = validarPasswordSegura(formulario.password, formulario.email, formulario.nombre);
            if (erroresPassword.length > 0) {
                setError(erroresPassword.join(' '));
                return;
            }

            const usuarioCreado = await registrarUsuario({
                ...formulario,
            });
            if (!usuarioCreado) {
                setError('No se pudo registrar el usuario. Revisa los datos e inténtalo de nuevo.');
                return;
            }
            navigate(rutaDestino, { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'No se pudo registrar el usuario.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <AuthLayout
            titulo="Crear cuenta"
            subtitulo="Regístrate para reservar salas, gestionar sesiones y dar forma a tus proyectos."
        >
            <form onSubmit={manejarSubmit} className="grid gap-4">
                <div>
                    <label htmlFor="register-nombre" className={authEtiqueta}>
                        Nombre completo
                    </label>
                    <div className="relative">
                        <User
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sutil"
                            aria-hidden="true"
                        />
                        <input
                            id="register-nombre"
                            type="text"
                            name="nombre"
                            value={formulario.nombre}
                            onChange={manejarCambio}
                            placeholder="Tu nombre"
                            autoComplete="name"
                            className={`${authCampo} pl-11`}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="register-email" className={authEtiqueta}>
                        Correo electrónico
                    </label>
                    <div className="relative">
                        <Mail
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sutil"
                            aria-hidden="true"
                        />
                        <input
                            id="register-email"
                            type="email"
                            name="email"
                            value={formulario.email}
                            onChange={manejarCambio}
                            placeholder="tucorreo@ejemplo.com"
                            autoComplete="email"
                            className={`${authCampo} pl-11`}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="register-rol" className={authEtiqueta}>
                        Tipo de cuenta
                    </label>
                    <div className="relative">
                        <ShieldCheck
                            className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-sutil"
                            aria-hidden="true"
                        />
                        <select
                            id="register-rol"
                            name="rol"
                            value={formulario.rol}
                            onChange={manejarCambio}
                            className={`${authSelect} pl-11`}
                            required
                        >
                            <option value="cliente">Cliente</option>
                        </select>
                        <ChevronDown
                            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sutil"
                            aria-hidden="true"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="register-password" className={authEtiqueta}>
                        Contraseña
                    </label>
                    <div className="relative">
                        <LockKeyhole
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sutil"
                            aria-hidden="true"
                        />
                        <input
                            id="register-password"
                            type={mostrarPassword ? 'text' : 'password'}
                            name="password"
                            value={formulario.password}
                            onChange={manejarCambio}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            aria-describedby="register-password-help"
                            className={`${authCampo} pl-11 pr-12`}
                            minLength={PASSWORD_MIN_LENGTH}
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
                    <p id="register-password-help" className="mt-1.5 text-[11px] leading-4 text-sutil">
                        Mínimo {PASSWORD_MIN_LENGTH} caracteres, con al menos una letra y un número.
                    </p>
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
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                    )}
                    {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
            </form>

            <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                <p className="text-sm text-sutil">
                    ¿Ya tienes cuenta?{' '}
                    <Link
                        className="font-bold text-accent transition hover:text-accent-soft"
                        to="/login"
                        state={location.state}
                    >
                        Inicia sesión
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
