// CAPA: Presentación
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout, { authBoton, authCampo, authEtiqueta } from '../components/AuthLayout.jsx';

const CUENTAS_DEMO = [
    { email: 'admin@z-one.com', clave: 'admin123', rol: 'Administrador' },
    { email: 'lua@z-one.com', clave: 'colab123', rol: 'Colaborador' },
    { email: 'cliente@z-one.com', clave: 'cliente123', rol: 'Cliente' },
];

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { usuario, cargando: cargandoSesion, iniciarSesion } = useAuth();
    const [formulario, setFormulario] = useState({ email: '', password: '', rol: '' });
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
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

    const manejarCambio = (event) => {
        const { name, value } = event.target;
        setFormulario((anterior) => ({ ...anterior, [name]: value }));
    };

    const completarDemo = (cuenta) => {
        setFormulario({ email: cuenta.email, password: cuenta.clave, rol: cuenta.rol.toLowerCase() });
        setError('');
    };

    const manejarSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setCargando(true);

        try {
            const usuario = await iniciarSesion(formulario.email, formulario.password, formulario.rol);
            if (!usuario) {
                throw new Error('Revisa tus credenciales y el tipo de cuenta seleccionado.');
            }

            navigate(rutaDestino, { replace: true });
        } catch (err) {
            setError(err.message || 'No se pudo iniciar sesión.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <AuthLayout
            titulo="Iniciar sesión"
            subtitulo="Selecciona tu tipo de cuenta para acceder al centro operativo del estudio."
        >
            <form onSubmit={manejarSubmit} className="grid gap-4">
                <label className="block">
                    <span className={authEtiqueta}>Tipo de cuenta</span>
                    <select name="rol" value={formulario.rol} onChange={manejarCambio} className={authCampo} required>
                        <option value="">Selecciona tu rol</option>
                        <option value="administrador">Administrador</option>
                        <option value="cliente">Cliente</option>
                        <option value="colaborador">Colaborador</option>
                    </select>
                </label>

                <label className="block">
                    <span className={authEtiqueta}>Email</span>
                    <input
                        type="email"
                        name="email"
                        value={formulario.email}
                        onChange={manejarCambio}
                        placeholder="admin@z-one.com"
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

                {error ? (
                    <p className="rounded-xl border border-peligro/40 bg-peligro/10 px-4 py-2.5 text-sm text-peligro" role="alert">
                        {error}
                    </p>
                ) : null}

                <button type="submit" disabled={cargando} className={authBoton}>
                    {cargando ? 'Ingresando...' : 'Ingresar al estudio'}
                </button>
            </form>

            <div className="mt-6 rounded-xl border border-border/70 bg-surface/40 p-4">
                <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-sutil">Acceso de demostración</p>
                <ul className="grid gap-1.5">
                    {CUENTAS_DEMO.map((cuenta) => (
                        <li key={cuenta.email}>
                            <button
                                type="button"
                                onClick={() => completarDemo(cuenta)}
                                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-sutil transition hover:bg-accent/10 hover:text-texto"
                            >
                                <span className="font-semibold text-texto">{cuenta.email}</span>
                                <span>{cuenta.rol}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

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
