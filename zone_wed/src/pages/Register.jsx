// CAPA: Presentación
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/register.css';

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
        <main className="register-page">
            <section className="register-card">
                <div className="login-brand" aria-label="Z-One branding">
                    <span className="brand-mark">Z</span>
                    <span>ONE</span>
                </div>

                <h1>Crear cuenta</h1>
                <p className="subtitle">Regístrate para reservar salas y gestionar sesiones.</p>

                <form onSubmit={manejarSubmit} className="register-form">
                    <label>
                        <span>Nombre</span>
                        <input
                            type="text"
                            name="nombre"
                            value={formulario.nombre}
                            onChange={manejarCambio}
                            placeholder="Tu nombre"
                            required
                        />
                    </label>

                    <label>
                        <span>Email</span>
                        <input
                            type="email"
                            name="email"
                            value={formulario.email}
                            onChange={manejarCambio}
                            placeholder="tucorreo@ejemplo.com"
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label>
                        <span>Tipo de cuenta</span>
                        <select
                            name="rol"
                            value={formulario.rol}
                            onChange={manejarCambio}
                            required
                        >
                            <option value="cliente">Cliente</option>
                            <option value="colaborador">Colaborador</option>
                        </select>
                    </label>

                    <label>
                        <span>Contraseña</span>
                        <input
                            type="password"
                            name="password"
                            value={formulario.password}
                            onChange={manejarCambio}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            required
                        />
                    </label>

                    {error ? <p className="error-message">{error}</p> : null}

                    <button type="submit" disabled={cargando}>
                        {cargando ? 'Creando...' : 'Registrar'}
                    </button>
                </form>

                <p className="login-footer">
                    ¿Ya tienes cuenta? <Link to="/login" state={location.state}>Inicia sesión</Link>
                </p>
                <Link className="auth-home-button" to="/">
                    Volver al menú principal
                </Link>
            </section>
        </main>
    );
}
