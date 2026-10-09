// CAPA: Presentación
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { RUTAS } from '../config/rutas.js';
import { esAdministrador, esColaborador, ROLES } from '../config/roles.js';
import { useSolicitudes } from '../hooks/useSolicitudes.js';
import { useSesiones } from '../hooks/useSesiones.js';
import { useSalas } from '../hooks/useSalas.js';
import { useColaboradores } from '../hooks/useColaboradores.js';
import { formatearFecha } from '../utils/helpers.js';
import { etiquetaEstado, etiquetaTipo } from '../utils/solicitudes.js';
import '../styles/tailwind.css';

function BellIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M10.3 21a1.8 1.8 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function hoyISO() {
    return new Date().toISOString().slice(0, 10);
}

export default function Notificaciones() {
    const { usuario } = useAuth();
    const [abierta, setAbierta] = useState(false);
    const [solicitudes] = useSolicitudes();
    const [sesiones] = useSesiones();
    const [salas] = useSalas();
    const [colaboradores] = useColaboradores();

    useEffect(() => {
        if (!abierta) return undefined;
        const cerrar = () => setAbierta(false);
        document.addEventListener('click', cerrar);
        return () => document.removeEventListener('click', cerrar);
    }, [abierta]);

    const items = useMemo(() => {
        if (!usuario) return [];

        const colaborador = colaboradores.find((item) => String(item.usuario_id) === String(usuario.id));
        const nombreSolicitante = (solicitud) =>
            solicitud.solicitante_nombre
            ?? colaboradores.find((item) => String(item.id) === String(solicitud.colaborador_id))?.nombre
            ?? 'Cliente';

        if (esAdministrador(usuario)) {
            const porGestionar = solicitudes
                .filter((solicitud) => ['solicitud', 'en_negociacion'].includes(solicitud.estado))
                .sort((a, b) => String(a.fecha ?? '').localeCompare(String(b.fecha ?? '')));
            return porGestionar.slice(0, 5).map((solicitud) => ({
                id: `solicitud-${solicitud.id}`,
                titulo: `${nombreSolicitante(solicitud)} · ${etiquetaTipo(solicitud.tipo)}`,
                detalle: `${formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || solicitud.fecha} · ${solicitud.franja || 'sin horario'} · ${etiquetaEstado(solicitud.estado)}`,
                ruta: RUTAS.SOLICITUDES,
            }));
        }

        const propias = solicitudes
            .filter((solicitud) =>
                String(solicitud.usuario_id) === String(usuario.id)
                || (colaborador && String(solicitud.colaborador_id) === String(colaborador.id)))
            .sort((a, b) => String(b.fecha ?? '').localeCompare(String(a.fecha ?? '')));

        const notificaciones = propias.slice(0, 5).map((solicitud) => ({
            id: `solicitud-${solicitud.id}`,
            titulo: etiquetaTipo(solicitud.tipo),
            detalle: `${etiquetaEstado(solicitud.estado)} · ${formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || solicitud.fecha} · ${solicitud.franja || 'sin horario'}`,
            ruta: RUTAS.SOLICITUDES,
        }));

        if (esColaborador(usuario)) {
            const proximas = sesiones
                .filter((sesion) =>
                    String(sesion.colaborador_id) === String(colaborador?.id)
                    && String(sesion.fecha ?? '') >= hoyISO()
                    && sesion.estado !== 'cancelada')
                .sort((a, b) => String(a.fecha ?? '').localeCompare(String(b.fecha ?? '')))
                .slice(0, 3)
                .map((sesion) => ({
                    id: `sesion-${sesion.id}`,
                    titulo: sesion.titulo,
                    detalle: `${formatearFecha(sesion.fecha, { weekday: 'short', day: 'numeric' }) || sesion.fecha} · ${sesion.hora_inicio}-${sesion.hora_fin} · ${salas.find((sala) => String(sala.id) === String(sesion.sala_id))?.nombre ?? 'Sala'}`,
                    ruta: RUTAS.AGENDA,
                }));
            notificaciones.push(...proximas);
        }

        return notificaciones;
    }, [usuario, solicitudes, sesiones, salas, colaboradores]);

    const rolTitulo = {
        [ROLES.ADMINISTRADOR]: 'Solicitudes por gestionar',
        [ROLES.COLABORADOR]: 'Mis solicitudes y sesiones',
        [ROLES.CLIENTE]: 'Mis solicitudes',
    };

    return (
        <div className="relative">
            <button
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2 text-texto transition hover:border-accent/60 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
                onClick={(evento) => {
                    evento.stopPropagation();
                    setAbierta((previo) => !previo);
                }}
                type="button"
                aria-label="Notificaciones"
                aria-haspopup="true"
                aria-expanded={abierta}
            >
                <BellIcon />
                {items.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-magenta px-1 text-[10px] font-bold text-bg">
                        {items.length}
                    </span>
                )}
            </button>

            {abierta && (
                <div
                    className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-xl shadow-black/40"
                    onClick={(evento) => evento.stopPropagation()}
                >
                    <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-texto">{rolTitulo[usuario?.rol] ?? 'Notificaciones'}</p>
                    </div>
                    {items.length ? (
                        <ul className="max-h-80 overflow-y-auto py-1">
                            {items.map((item) => (
                                <li key={item.id}>
                                    <Link
                                        className="block px-4 py-2.5 transition hover:bg-accent/10"
                                        to={item.ruta}
                                        onClick={() => setAbierta(false)}
                                    >
                                        <p className="text-sm font-medium text-texto">{item.titulo}</p>
                                        <p className="text-xs text-sutil">{item.detalle}</p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="px-4 py-6 text-center text-sm text-sutil">Sin novedades por ahora.</p>
                    )}
                </div>
            )}
        </div>
    );
}