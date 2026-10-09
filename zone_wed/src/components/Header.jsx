// CAPA: Presentación
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { RUTAS } from '../config/rutas.js';
import Notificaciones from './Notificaciones.jsx';

export default function Header() {
    const navigate = useNavigate();
    const { usuario, cerrarSesion } = useAuth();

    const manejarCierreSesion = async () => {
        await cerrarSesion();
        navigate(RUTAS.LOGIN, { replace: true });
    };

    return (
        <header className="workspace-header">
            <div>
                <p className="workspace-eyebrow">Z-ONE · ESTUDIO</p>
                <p className="workspace-user">{usuario?.nombre ?? 'Usuario'}</p>
            </div>
            <div className="workspace-header-actions">
                <Notificaciones />
                <button className="workspace-logout" type="button" onClick={manejarCierreSesion}>
                    Cerrar sesión
                </button>
            </div>
        </header>
    );
}
