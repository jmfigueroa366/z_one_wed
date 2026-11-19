// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { NAVEGACION, RUTAS } from '../config/rutas.ts';
import { ROLES } from '../config/roles.ts';
import Notificaciones from './Notificaciones.tsx';
import '../styles/tailwind.css';

interface HeaderProps {
    onAbrirMenu: () => void;
}

const ITEMS_NAVEGACION = NAVEGACION.flatMap((seccion) => seccion.items);

const ETIQUETA_POR_ROL: Record<string, Record<string, string>> = {
    [RUTAS.SOLICITUDES]: { [ROLES.ADMINISTRADOR]: 'Solicitudes', otro: 'Mis solicitudes' },
    [RUTAS.SESIONES]: { [ROLES.ADMINISTRADOR]: 'Sesiones', otro: 'Mis sesiones' },
};

const NOMBRE_ROL: Record<string, string> = {
    [ROLES.ADMINISTRADOR]: 'Administrador',
    [ROLES.COLABORADOR]: 'Colaborador',
    [ROLES.CLIENTE]: 'Cliente',
};

function iniciales(nombre = '') {
    return String(nombre)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join('')
        .toUpperCase() || 'ZN';
}

export default function Header({ onAbrirMenu }: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { usuario, cerrarSesion } = useAuth();
    const [cuentaAbierta, setCuentaAbierta] = useState(false);
    const cuentaRef = useRef<HTMLDivElement | null>(null);
    const botonCuentaRef = useRef<HTMLButtonElement | null>(null);

    const tituloPagina = useMemo(() => {
        const item = ITEMS_NAVEGACION.find((enlace) => enlace.ruta === location.pathname);
        if (!item) return null;
        const variantes = ETIQUETA_POR_ROL[item.ruta];
        return variantes
            ? (variantes[usuario?.rol ?? ''] ?? variantes.otro)
            : item.etiqueta;
    }, [location.pathname, usuario?.rol]);

    useEffect(() => {
        if (!cuentaAbierta) return undefined;

        const cerrarFuera = (evento: PointerEvent) => {
            const objetivo = evento.target as Node | null;
            if (!objetivo) return;
            if (cuentaRef.current?.contains(objetivo) || botonCuentaRef.current?.contains(objetivo)) return;
            setCuentaAbierta(false);
        };

        const cerrarConEscape = (evento: KeyboardEvent) => {
            if (evento.key !== 'Escape') return;
            setCuentaAbierta(false);
            botonCuentaRef.current?.focus();
        };

        document.addEventListener('pointerdown', cerrarFuera, true);
        document.addEventListener('keydown', cerrarConEscape);
        return () => {
            document.removeEventListener('pointerdown', cerrarFuera, true);
            document.removeEventListener('keydown', cerrarConEscape);
        };
    }, [cuentaAbierta]);

    const manejarCierreSesion = async () => {
        setCuentaAbierta(false);
        await cerrarSesion();
        navigate(RUTAS.LOGIN, { replace: true });
    };

    return (
        <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5">
                <button
                    type="button"
                    onClick={onAbrirMenu}
                    aria-label="Abrir menú"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-white/[0.04] text-texto transition hover:border-accent/50 lg:hidden"
                >
                    <Menu className="h-4 w-4" aria-hidden="true" />
                </button>
                {tituloPagina && (
                    <p className="truncate text-sm font-semibold tracking-tight text-texto-soft">{tituloPagina}</p>
                )}
            </div>

            <div className="flex items-center gap-1.5">
                <Notificaciones />

                <div ref={cuentaRef} className="relative">
                    <button
                        ref={botonCuentaRef}
                        type="button"
                        onClick={() => setCuentaAbierta((abierta) => !abierta)}
                        aria-label={cuentaAbierta ? 'Cerrar menú de cuenta' : 'Abrir menú de cuenta'}
                        aria-haspopup="menu"
                        aria-expanded={cuentaAbierta}
                        aria-controls="menu-cuenta"
                        className="grid h-9 w-9 place-items-center rounded-full bg-secundario text-xs font-black text-texto ring-1 ring-white/10 transition hover:ring-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                    >
                        {iniciales(usuario?.nombre)}
                    </button>

                    {cuentaAbierta && (
                        <div
                            id="menu-cuenta"
                            role="menu"
                            aria-label="Menú de cuenta"
                            className="animate-rise absolute right-0 top-[calc(100%+8px)] z-50 w-64 origin-top-right overflow-hidden rounded-2xl border border-border bg-surface/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl motion-reduce:animate-none"
                        >
                            <div className="border-b border-border px-3 py-3">
                                <p className="truncate text-sm font-semibold text-texto-soft">{usuario?.nombre ?? 'Usuario'}</p>
                                <p className="mt-0.5 text-xs text-sutil">{NOMBRE_ROL[usuario?.rol ?? ''] ?? 'Usuario'}</p>
                            </div>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={manejarCierreSesion}
                                className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-sutil transition hover:bg-peligro/10 hover:text-peligro-soft"
                            >
                                <LogOut className="h-4 w-4" aria-hidden="true" />
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
