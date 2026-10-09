// CAPA: Presentación
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout, { authBoton, authCampo, authEtiqueta } from '../components/AuthLayout.jsx';

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

    const manejarSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setCargando(true);

        try {
            await registrarUsuario({
                ...formulario,
            });
            navigate('/login', { replace: true, state: location.state });
        } catch (err) {
            setError(err.message || 'No se pudo registrar el usuario.');
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
                <label className="block">
                    <span className={authEtiqueta}>Nombre</span>
                    <input
                        type="text"
                        name="nombre"
                        value={formulario.nombre}
                        onChange={manejarCambio}
                        placeholder="Tu nombre"
                        className={authCampo}
                        required
                    />
                </label>

                <label className="block">
                    <span className={authEtiqueta}>Email</span>
                    <input
                        type="email"
                        name="email"
                        value={formulario.email}
                        onChange={manejarCambio}
                        placeholder="tucorreo@ejemplo.com"
                        autoComplete="email"
                        className={authCampo}
                        required
                    />
                </label>

                <label className="block">
                    <span className={authEtiqueta}>Tipo de cuenta</span>
                    <select name="rol" value={formulario.rol} onChange={manejarCambio} className={authCampo} required>
                        <option value="cliente">Cliente</option>
                        <option value="colaborador">Colaborador</option>
                    </select>
                </label>

                <label className="block">
                    <span className={authEtiqueta}>Contraseña</span>
                    <input
                        type="password"
                        name="password"
                        value={formulario.password}
                        onChange={manejarCambio}
                        placeholder="••••••••"
                        autoComplete="new-password"
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
                    {cargando ? 'Creando...' : 'Crear cuenta'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-sutil">
                ¿Ya tienes cuenta?{' '}
                <Link className="font-bold text-accent transition hover:text-accent-soft" to="/login" state={location.state}>
                    Inicia sesión
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
