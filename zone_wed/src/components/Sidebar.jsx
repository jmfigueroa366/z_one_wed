// CAPA: Presentación
import { useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    Home,
    Music2,
    CalendarDays,
    Inbox,
    Radio,
    FolderKanban,
    Mic2,
    SlidersHorizontal,
    LayoutGrid,
    BarChart3,
    ShieldCheck,
    Bot,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    X,
} from 'lucide-react';
import { NAVEGACION, RUTAS, rutasPermitidasPorRol } from '../config/rutas.js';
import { ROLES } from '../config/roles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSolicitudes } from '../hooks/useSolicitudes.js';
import '../styles/tailwind.css';

const ICONOS = {
    Home,
    Music2,
    CalendarDays,
    Inbox,
    Radio,
    FolderKanban,
    Mic2,
    SlidersHorizontal,
    LayoutGrid,
    BarChart3,
    ShieldCheck,
    Bot,
    Settings,
};

const ETIQUETA_POR_ROL = {
    [RUTAS.SOLICITUDES]: { [ROLES.ADMINISTRADOR]: 'Solicitudes', otro: 'Mis solicitudes' },
    [RUTAS.SESIONES]: { [ROLES.ADMINISTRADOR]: 'Sesiones', otro: 'Mis sesiones' },
};

const NOMBRE_ROL = {
    [ROLES.ADMINISTRADOR]: 'Administrador',
    [ROLES.COLABORADOR]: 'Colaborador',
    [ROLES.COORDINADOR]: 'Coordinador',
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

export default function Sidebar({ colapsado, onAlternar, movilAbierto, onCerrarMovil }) {
    const { usuario, cerrarSesion } = useAuth();
    const navigate = useNavigate();
    const [solicitudes] = useSolicitudes();
    const rutasPermitidas = rutasPermitidasPorRol(usuario?.rol);

    const pendientes = useMemo(() => {
        if (!usuario) return 0;
        const enGestion = (solicitud) => ['solicitud', 'en_negociacion'].includes(solicitud.estado);
        if (usuario.rol === ROLES.ADMINISTRADOR) {
            return solicitudes.filter(enGestion).length;
        }
        return solicitudes.filter(
            (solicitud) => String(solicitud.usuario_id) === String(usuario.id) && enGestion(solicitud)
        ).length;
    }, [usuario, solicitudes]);

    const secciones = useMemo(
        () => NAVEGACION.map((seccion) => ({
            ...seccion,
            items: seccion.items
                .filter((item) => rutasPermitidas.includes(item.ruta))
                .map((item) => {
                    const variantes = ETIQUETA_POR_ROL[item.ruta];
                    const etiqueta = variantes ? (variantes[usuario?.rol] ?? variantes.otro) : item.etiqueta;
                    return { ...item, etiqueta, badge: item.badge === 'pendientes' ? pendientes : 0 };
                }),
        })).filter((seccion) => seccion.items.length > 0),
        [rutasPermitidas, usuario, pendientes]
    );

    const manejarSalir = async () => {
        onCerrarMovil?.();
        await cerrarSesion();
        navigate(RUTAS.LOGIN, { replace: true });
    };

    return (
        <>
            {movilAbierto && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={onCerrarMovil}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-[#0d0a17]/95 p-4 backdrop-blur transition-transform duration-300 lg:static lg:z-auto lg:w-full lg:translate-x-0 lg:bg-[#0d0a17]/80 ${
                    movilAbierto ? 'translate-x-0' : '-translate-x-full'
                } ${colapsado ? 'lg:px-3' : ''}`}
            >
                <div className="flex items-center justify-between gap-2">
                    <Link
                        className="flex items-center gap-2.5 rounded-xl focus-visible:ring-2 focus-visible:ring-accent/60"
                        to={RUTAS.MENU_PRINCIPAL}
                        aria-label="Z-ONE inicio"
                        onClick={onCerrarMovil}
                    >
                        <span className={`text-2xl font-extrabold leading-none tracking-tight text-texto-soft ${colapsado ? 'lg:hidden' : ''}`}>
                            <span className="text-magenta">Z</span>-ONE
                        </span>
                        <span className={`hidden text-2xl font-extrabold leading-none tracking-tight text-texto-soft ${colapsado ? 'lg:inline-block' : ''}`}>
                            <span className="text-magenta">Z</span>
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={onAlternar}
                        aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
                        aria-pressed={colapsado}
                        className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-white/[0.04] text-sutil transition hover:border-accent/50 hover:text-texto lg:grid"
                    >
                        {colapsado ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </button>

                    <button
                        type="button"
                        onClick={onCerrarMovil}
                        aria-label="Cerrar menú"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-white/[0.04] text-sutil transition hover:border-accent/50 hover:text-texto lg:hidden"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <nav aria-label="Navegación principal" className="mt-5 flex-1 overflow-y-auto pr-1">
                    {secciones.map((seccion) => (
                        <div key={seccion.titulo} className="mb-4">
                            <p className={`px-3 pb-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-sutil ${colapsado ? 'lg:hidden' : ''}`}>
                                {seccion.titulo}
                            </p>
                            <ul className="flex flex-col gap-1">
                                {seccion.items.map((item) => {
                                    const Icono = ICONOS[item.icono] ?? Home;
                                    return (
                                        <li key={item.ruta}>
                                            <NavLink
                                                to={item.ruta}
                                                title={item.etiqueta}
                                                onClick={onCerrarMovil}
                                                className={({ isActive }) =>
                                                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${colapsado ? 'lg:justify-center lg:px-2' : ''} ${
                                                        isActive
                                                            ? 'bg-gradient-to-r from-[#7f55e2]/60 to-[#d73f9a]/40 text-white shadow-lg shadow-black/20'
                                                            : 'text-[#c8c1d7] hover:bg-white/5 hover:text-white'
                                                    }`
                                                }
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        {isActive && (
                                                            <span
                                                                aria-hidden="true"
                                                                className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-gradient-to-b from-[#9365f2] to-[#e34ba6]"
                                                            />
                                                        )}
                                                        <Icono className="h-5 w-5 shrink-0" aria-hidden="true" />
                                                        <span className={`truncate ${colapsado ? 'lg:hidden' : ''}`}>{item.etiqueta}</span>
                                                        {item.badge > 0 && (
                                                            <>
                                                                <span className={`ml-auto rounded-full bg-magenta px-2 py-0.5 text-[0.65rem] font-bold text-white ${colapsado ? 'lg:hidden' : ''}`}>
                                                                    {item.badge}
                                                                </span>
                                                                {colapsado && (
                                                                    <span
                                                                        aria-hidden="true"
                                                                        className="absolute right-1.5 top-1.5 hidden h-2.5 w-2.5 rounded-full bg-magenta lg:block"
                                                                    />
                                                                )}
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </NavLink>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="mt-4 border-t border-border pt-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white/[0.03] p-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-sm font-black text-white">
                            {iniciales(usuario?.nombre)}
                        </span>
                        <div className={`min-w-0 flex-1 ${colapsado ? 'lg:hidden' : ''}`}>
                            <p className="truncate text-sm font-bold text-texto-soft">{usuario?.nombre ?? 'Usuario'}</p>
                            <p className="truncate text-xs text-sutil">{NOMBRE_ROL[usuario?.rol] ?? 'Usuario'}</p>
                        </div>
                        <button
                            type="button"
                            onClick={manejarSalir}
                            aria-label="Cerrar sesión"
                            title="Cerrar sesión"
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-white/[0.04] text-sutil transition hover:border-peligro/50 hover:text-peligro-soft ${colapsado ? 'lg:hidden' : ''}`}
                        >
                            <LogOut className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                    {colapsado && (
                        <button
                            type="button"
                            onClick={manejarSalir}
                            aria-label="Cerrar sesión"
                            title="Cerrar sesión"
                            className="mt-2 hidden w-full place-items-center rounded-xl border border-border bg-white/[0.04] py-2 text-sutil transition hover:border-peligro/50 hover:text-peligro-soft lg:grid"
                        >
                            <LogOut className="h-4 w-4" aria-hidden="true" />
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
