// CAPA: Presentación
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { RUTAS } from '../config/rutas.js';
import Notificaciones from './Notificaciones.jsx';
import '../styles/tailwind.css';

export default function Header({ onAbrirMenu }) {
    const navigate = useNavigate();
    const { usuario, cerrarSesion } = useAuth();

    const manejarCierreSesion = async () => {
        await cerrarSesion();
        navigate(RUTAS.LOGIN, { replace: true });
    };

    return (
        <header className="flex min-h-[82px] items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onAbrirMenu}
                    aria-label="Abrir menú"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-white/[0.04] text-texto transition hover:border-accent/50 lg:hidden"
                >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="min-w-0">
                    <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-accent">Z-ONE · ESTUDIO</p>
                    <p className="truncate font-semibold text-texto-soft">{usuario?.nombre ?? 'Usuario'}</p>
                </div>
            </div>
            <div className="flex items-center gap-2.5">
                <Notificaciones />
                <button
                    className="hidden rounded-xl border border-border bg-white/[0.04] px-3.5 py-2 text-sm font-semibold text-texto transition hover:border-accent/60 sm:block"
                    type="button"
                    onClick={manejarCierreSesion}
                >
                    Cerrar sesión
                </button>
            </div>
        </header>
    );
}

