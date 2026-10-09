// CAPA: Presentación
import { useMemo, useState } from 'react';
import { useColaboradores } from '../hooks/useColaboradores.js';
import { useSalas } from '../hooks/useSalas.js';
import { useSesiones } from '../hooks/useSesiones.js';
import { useSolicitudes } from '../hooks/useSolicitudes.js';
import { formatearFecha } from '../utils/helpers.js';
import { clasePillEstado, ETIQUETA, TARJETA_RESUMEN } from '../styles/clases.js';
import '../styles/tailwind.css';

const ETIQUETAS_ESTADO = {
    confirmada: 'Confirmada',
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    completada: 'Completada',
    cancelada: 'Cancelada',
};

const FILTRO_BASE = 'rounded-full border px-3.5 py-2 text-xs font-semibold transition';
const FILTRO_ACTIVO = `${FILTRO_BASE} border-accent/60 bg-accent/20 text-white`;
const FILTRO_INACTIVO = `${FILTRO_BASE} border-border bg-white/[0.035] text-sutil hover:text-texto`;

function nombreColaborador(id, colaboradores) {
    return colaboradores.find((colaborador) => String(colaborador.id) === String(id))?.nombre ?? 'Sin asignar';
}

export default function Agenda() {
    const [sesiones] = useSesiones();
    const [solicitudes] = useSolicitudes();
    const [salas] = useSalas();
    const [colaboradores] = useColaboradores();
    const reservasConfirmadas = useMemo(
        () => solicitudes.filter((solicitud) => solicitud.estado === 'confirmada'),
        [solicitudes]
    );
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [filtroFecha, setFiltroFecha] = useState('');

    const eventosAgenda = useMemo(() => [
        ...sesiones.map((sesion) => ({
            ...sesion,
            eventoId: `sesion-${sesion.id}`,
            tipo: 'Sesión',
        })),
        ...reservasConfirmadas.map((solicitud) => {
            const horario = String(solicitud.franja ?? '').match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
            return {
                ...solicitud,
                id: solicitud.id,
                eventoId: `solicitud-${solicitud.id}`,
                titulo: `Reserva confirmada · ${nombreColaborador(solicitud.colaborador_id, colaboradores)}`,
                hora_inicio: horario?.[1] ?? '',
                hora_fin: horario?.[2] ?? '',
                estado: 'confirmada',
                tipo: 'Reserva aprobada',
            };
        }),
    ], [sesiones, reservasConfirmadas, colaboradores]);

    const sesionesFiltradas = useMemo(() => [...eventosAgenda]
        .filter((sesion) => filtroEstado === 'todas' || sesion.estado === filtroEstado)
        .filter((sesion) => !filtroFecha || sesion.fecha === filtroFecha)
        .sort((a, b) => {
            const fechaA = `${a.fecha ?? ''}T${a.hora_inicio ?? ''}`;
            const fechaB = `${b.fecha ?? ''}T${b.hora_inicio ?? ''}`;
            return fechaA.localeCompare(fechaB);
        }), [eventosAgenda, filtroEstado, filtroFecha]);

    const obtenerSala = (id) =>
        salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';

    return (
        <main className="workspace-content" data-page="agenda">
            <header className="page-heading border-l-4 border-accent pl-4">
                <p className="workspace-eyebrow">PLANIFICACIÓN DEL ESTUDIO</p>
                <h1>Agenda de sesiones</h1>
                <p>Consulta los horarios, las salas y el equipo asignado a cada sesión.</p>
            </header>

            <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Resumen de agenda">
                <article className={TARJETA_RESUMEN}><span className="text-sm text-sutil">Actividades en agenda</span><strong className="text-2xl font-black text-texto-soft">{eventosAgenda.length}</strong></article>
                <article className={TARJETA_RESUMEN}><span className="text-sm text-sutil">Confirmadas</span><strong className="text-2xl font-black text-exito-soft">{eventosAgenda.filter((sesion) => sesion.estado === 'confirmada').length}</strong></article>
                <article className={TARJETA_RESUMEN}><span className="text-sm text-sutil">Completadas</span><strong className="text-2xl font-black text-accent-soft">{sesiones.filter((sesion) => sesion.estado === 'completada').length}</strong></article>
            </section>

            <section className="mt-6 rounded-3xl border border-border bg-surface/70 p-6" aria-labelledby="agenda-list-title">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="workspace-eyebrow">PROGRAMACIÓN</p>
                        <h2 id="agenda-list-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                            Sesiones y reservas confirmadas
                        </h2>
                    </div>
                    <label className="grid gap-1.5">
                        <span className={ETIQUETA}>Buscar por fecha</span>
                        <input
                            className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm text-texto outline-none transition [color-scheme:dark] focus:border-accent focus:ring-2 focus:ring-accent/40"
                            aria-label="Filtrar agenda por fecha"
                            type="date"
                            value={filtroFecha}
                            onChange={(event) => setFiltroFecha(event.target.value)}
                        />
                    </label>
                </div>

                <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar por estado">
                    {[
                        ['todas', 'Todas'],
                        ['pendiente', 'Pendientes'],
                        ['confirmada', 'Confirmadas'],
                        ['en_proceso', 'En proceso'],
                        ['completada', 'Completadas'],
                        ['cancelada', 'Canceladas'],
                    ].map(([estado, etiqueta]) => (
                        <button
                            className={filtroEstado === estado ? FILTRO_ACTIVO : FILTRO_INACTIVO}
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            type="button"
                        >
                            {etiqueta}
                        </button>
                    ))}
                    {filtroFecha && (
                        <button
                            className={`${FILTRO_BASE} border-peligro/40 bg-peligro/10 text-peligro-soft hover:bg-peligro/20`}
                            onClick={() => setFiltroFecha('')}
                            type="button"
                        >
                            Limpiar fecha
                        </button>
                    )}
                </div>

                {sesionesFiltradas.length ? (
                    <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
                        <table className="w-full min-w-[720px] border-collapse text-sm">
                            <thead>
                                <tr className="bg-white/[0.03] text-left">
                                    {['Fecha y hora', 'Sesión', 'Sala', 'Artista / productor', 'Estado'].map((titulo) => (
                                        <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-sutil" key={titulo}>{titulo}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sesionesFiltradas.map((sesion) => (
                                    <tr className="border-t border-border/70" key={sesion.eventoId}>
                                        <td className="px-4 py-3 align-top">
                                            <strong className="block text-texto-soft">{formatearFecha(sesion.fecha, { weekday: 'short', day: 'numeric' }) || 'Fecha pendiente'}</strong>
                                            <span className="text-xs text-sutil">{sesion.hora_inicio ?? 'Hora pendiente'}{sesion.hora_fin ? ` – ${sesion.hora_fin}` : ''}</span>
                                        </td>
                                        <td className="px-4 py-3 align-top text-texto">
                                            <span className="mb-1 block text-xs font-bold text-accent-soft">{sesion.tipo}</span>
                                            {sesion.titulo || 'Sesión sin título'}
                                        </td>
                                        <td className="px-4 py-3 align-top text-sutil">{obtenerSala(sesion.sala_id)}</td>
                                        <td className="px-4 py-3 align-top text-sutil">{nombreColaborador(sesion.colaborador_id, colaboradores)}</td>
                                        <td className="px-4 py-3 align-top">
                                            <span className={clasePillEstado(sesion.estado)}>{ETIQUETAS_ESTADO[sesion.estado] ?? sesion.estado}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="py-4 text-center text-sutil">No hay sesiones que coincidan con esos filtros.</p>
                )}
            </section>
        </main>
    );
}
