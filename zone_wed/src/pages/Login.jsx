// CAPA: Presentación
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/login.css';

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
        return <main className="estado-cargando">Cargando sesión...</main>;
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
        <main className="login-page">
            <section className="login-card">
                <div className="login-brand" aria-label="Z-One branding">
                    <span className="brand-mark">Z</span>
                    <span>ONE</span>
                </div>

                <h1>Iniciar sesión</h1>
                <p className="subtitle">Selecciona tu tipo de cuenta para acceder a tu espacio.</p>

                <form onSubmit={manejarSubmit} className="login-form">
                    <label>
                        <span>Tipo de cuenta</span>
                        <select
                            name="rol"
                            value={formulario.rol}
                            onChange={manejarCambio}
                            required
                        >
                            <option value="">Selecciona tu rol</option>
                            <option value="administrador">Administrador</option>
                            <option value="cliente">Cliente</option>
                            <option value="colaborador">Colaborador</option>
                        </select>
                    </label>

                    <label>
                        <span>Email</span>
                        <input
                            type="email"
                            name="email"
                            value={formulario.email}
                            onChange={manejarCambio}
                            placeholder="admin@z-one.com"
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label>
                        <span>Contraseña</span>
                        <input
                            type="password"
                            name="password"
                            value={formulario.password}
                            onChange={manejarCambio}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </label>

                    {error ? <p className="error-message">{error}</p> : null}

                    <button type="submit" disabled={cargando}>
                        {cargando ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <p className="login-footer">
                    ¿No tienes cuenta? <Link to="/register" state={location.state}>Crear cuenta</Link>
                </p>
                <Link className="auth-home-button" to="/">
                    Volver al menú principal
                </Link>
            </section>
        </main>
    );
}
