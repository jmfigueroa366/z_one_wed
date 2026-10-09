// CAPA: Presentación
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { RUTAS } from '../config/rutas.js';
import Notificaciones from './Notificaciones.jsx';
import '../styles/tailwind.css';

export default function Header() {
    const navigate = useNavigate();
    const { usuario, cerrarSesion } = useAuth();

    const manejarCierreSesion = async () => {
        await cerrarSesion();
        navigate(RUTAS.LOGIN, { replace: true });
    };

    return (
        <header className="flex min-h-[82px] items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-8">
            <div>
                <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-accent">Z-ONE · ESTUDIO</p>
                <p className="font-semibold text-texto-soft">{usuario?.nombre ?? 'Usuario'}</p>
            </div>
            <div className="flex items-center gap-2.5">
                <Notificaciones />
                <button
                    className="rounded-xl border border-border bg-white/[0.04] px-3.5 py-2 text-sm font-semibold text-texto transition hover:border-accent/60"
                    type="button"
                    onClick={manejarCierreSesion}
                >
                    Cerrar sesión
                </button>
            </div>
        </header>
    );
}
