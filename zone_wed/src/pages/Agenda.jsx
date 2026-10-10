// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import { Clock, Mic, SlidersHorizontal } from 'lucide-react';
import { useColaboradores } from '../hooks/useColaboradores.js';
import { useSalas } from '../hooks/useSalas.js';
import { useSesiones } from '../hooks/useSesiones.js';
import { useSolicitudes } from '../hooks/useSolicitudes.js';
import { formatearFecha } from '../utils/helpers.js';
import { clasePillEstado } from '../styles/clases.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ETIQUETAS_ESTADO = {
    confirmada: 'Confirmada',
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    completada: 'Completada',
    cancelada: 'Cancelada',
};

const PUNTO = {
    confirmada: 'bg-exito',
    en_proceso: 'bg-exito',
    pendiente: 'bg-aviso',
    completada: 'bg-[#5393da]',
    cancelada: 'bg-peligro',
};

const FILTRO_BASE = 'rounded-full border px-3.5 py-2 text-xs font-semibold transition';
const FILTRO_ACTIVO = `${FILTRO_BASE} border-accent/60 bg-gradient-to-r from-[#9365f2]/40 to-[#e34ba6]/30 text-white`;
const FILTRO_INACTIVO = `${FILTRO_BASE} border-border bg-white/[0.035] text-sutil hover:border-accent/50 hover:text-texto`;

function fechaHoy() {
    const ahora = new Date();
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
}

function nombreColaborador(id, colaboradores) {
    return colaboradores.find((colaborador) => String(colaborador.id) === String(id))?.nombre ?? 'Sin asignar';
}

export default function Agenda() {
    const [sesiones] = useSesiones();
    const [solicitudes] = useSolicitudes();
    const [salas] = useSalas();
    const [colaboradores] = useColaboradores();
    const boardRef = useRef(null);
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [filtroFecha, setFiltroFecha] = useState('');
    const hoy = useMemo(() => fechaHoy(), []);

    const reservasConfirmadas = useMemo(
        () => solicitudes.filter((solicitud) => solicitud.estado === 'confirmada'),
        [solicitudes]
    );

    const eventosAgenda = useMemo(() => [
        ...sesiones.map((sesion) => ({ ...sesion, eventoId: `sesion-${sesion.id}`, tipo: 'Sesión' })),
        ...reservasConfirmadas.map((solicitud) => {
            const horario = String(solicitud.franja ?? '').match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
            return {
                ...solicitud,
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
        .sort((a, b) => `${a.fecha ?? ''}T${a.hora_inicio ?? ''}`.localeCompare(`${b.fecha ?? ''}T${b.hora_inicio ?? ''}`)),
    [eventosAgenda, filtroEstado, filtroFecha]);

    const dias = useMemo(() => {
        const mapa = new Map();
        sesionesFiltradas.forEach((evento) => {
            const clave = evento.fecha ?? 'sin-fecha';
            if (!mapa.has(clave)) mapa.set(clave, []);
            mapa.get(clave).push(evento);
        });
        return [...mapa.entries()];
    }, [sesionesFiltradas]);

    const proximo = useMemo(
        () => [...eventosAgenda]
            .filter((evento) => evento.fecha && evento.fecha >= hoy)
            .sort((a, b) => `${a.fecha}T${a.hora_inicio ?? ''}`.localeCompare(`${b.fecha}T${b.hora_inicio ?? ''}`))[0] ?? null,
        [eventosAgenda, hoy]
    );

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const board = boardRef.current;
        if (!board) return undefined;
        const animacion = anime({
            targets: board.querySelectorAll('[data-evento]'),
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 420,
            delay: anime.stagger(45),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [dias]);

    const obtenerSala = (id) =>
        salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';

    const resumen = [
        { etiqueta: 'Actividades en agenda', valor: eventosAgenda.length, tono: 'from-[#5b418f]/50', texto: 'text-texto-soft' },
        { etiqueta: 'Confirmadas', valor: eventosAgenda.filter((sesion) => sesion.estado === 'confirmada').length, tono: 'from-exito/25', texto: 'text-exito-soft' },
        { etiqueta: 'Completadas', valor: sesiones.filter((sesion) => sesion.estado === 'completada').length, tono: 'from-[#5393da]/25', texto: 'text-info' },
    ];

    return (
        <main className="workspace-content" data-page="agenda">
            <header className="page-heading relative border-l-4 border-accent pl-4">
                <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-24 h-52 w-52 animate-aurora rounded-full bg-[#9365f2]/18 blur-3xl" />
                <p className="workspace-eyebrow">PLANIFICACIÓN DEL ESTUDIO</p>
                <h1>Agenda de sesiones</h1>
                <p>Consulta los horarios, las salas y el equipo asignado a cada sesión.</p>
            </header>

            {proximo && (
                <section
                    className="relative mt-6 overflow-hidden rounded-[2rem] border border-accent/25 p-6 sm:p-8"
                    style={{
                        background:
                            'radial-gradient(ellipse at 90% 8%, rgba(240, 79, 166, 0.26), transparent 48%), linear-gradient(120deg, rgba(111, 75, 187, 0.36), rgba(23, 19, 34, 0.97) 72%)',
                    }}
                >
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 animate-aurora rounded-full bg-[#9365f2]/30 blur-3xl" />
                    <div className="relative flex flex-wrap items-center justify-between gap-5">
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="grid place-items-center rounded-3xl border border-white/10 bg-black/25 px-5 py-4 text-center">
                                <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-accent-soft">{proximo.fecha === hoy ? 'Hoy' : formatearFecha(proximo.fecha, { weekday: 'short' })}</span>
                                <strong className="text-3xl font-black leading-none text-texto-soft">{formatearFecha(proximo.fecha, { day: 'numeric' })}</strong>
                                <span className="text-[0.68rem] capitalize text-sutil">{formatearFecha(proximo.fecha, { month: 'long' })}</span>
                            </div>
                            <div>
                                <p className="workspace-eyebrow">PRÓXIMO EN AGENDA</p>
                                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-texto-soft">{proximo.titulo || 'Sesión sin título'}</h2>
                                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-sutil">
                                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {proximo.hora_inicio || '--:--'}{proximo.hora_fin ? ` – ${proximo.hora_fin}` : ''}</span>
                                    <span className="inline-flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> {obtenerSala(proximo.sala_id)}</span>
                                    <span className="inline-flex items-center gap-1.5"><Mic className="h-3.5 w-3.5" aria-hidden="true" /> {nombreColaborador(proximo.colaborador_id, colaboradores)}</span>
                                </div>
                            </div>
                        </div>
                        <span className={clasePillEstado(proximo.estado)}>{ETIQUETAS_ESTADO[proximo.estado] ?? proximo.estado}</span>
                    </div>
                </section>
            )}

            <section className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Resumen de agenda">
                {resumen.map((item) => (
                    <article
                        key={item.etiqueta}
                        className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${item.tono} to-surface/40 p-4`}
                    >
                        <span className="text-sm text-sutil">{item.etiqueta}</span>
                        <strong className={`text-3xl font-black ${item.texto}`}>{item.valor}</strong>
                    </article>
                ))}
            </section>

            <section className="mt-6 rounded-[2rem] border border-border bg-surface/60 p-5 backdrop-blur sm:p-6" aria-labelledby="agenda-list-title">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="workspace-eyebrow">PROGRAMACIÓN</p>
                        <h2 id="agenda-list-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                            Sesiones y reservas confirmadas
                        </h2>
                    </div>
                    <label className="grid gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-sutil">Buscar por fecha</span>
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

                {dias.length ? (
                    <div ref={boardRef} className="mt-5 flex snap-x gap-4 overflow-x-auto pb-3">
                        {dias.map(([fecha, items]) => {
                            const esHoy = fecha === hoy;
                            return (
                                <div
                                    key={fecha}
                                    className={`flex w-[280px] shrink-0 snap-start flex-col rounded-3xl border p-3.5 ${
                                        esHoy ? 'border-accent/50 bg-accent/[0.06]' : 'border-border bg-white/[0.02]'
                                    }`}
                                >
                                    <div className="mb-3 flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2">
                                        <div>
                                            <span className={`block text-[0.62rem] font-extrabold uppercase tracking-[0.14em] ${esHoy ? 'text-magenta' : 'text-sutil'}`}>
                                                {esHoy ? 'Hoy' : formatearFecha(fecha, { weekday: 'long' }) || 'Sin fecha'}
                                            </span>
                                            <strong className="text-sm font-bold text-texto-soft">
                                                {formatearFecha(fecha, { day: 'numeric', month: 'short' }) || '—'}
                                            </strong>
                                        </div>
                                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[0.06] text-xs font-bold text-sutil">{items.length}</span>
                                    </div>

                                    <div className="flex flex-1 flex-col gap-3">
                                        {items.map((evento) => (
                                            <article
                                                key={evento.eventoId}
                                                data-evento
                                                className="rounded-2xl border border-border bg-surface/70 p-3.5 transition hover:-translate-y-0.5 hover:border-accent/50"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold tabular-nums text-texto-soft">
                                                        {evento.hora_inicio || '--:--'}{evento.hora_fin ? `–${evento.hora_fin}` : ''}
                                                    </span>
                                                    <span className={`h-2 w-2 rounded-full ${PUNTO[evento.estado] ?? 'bg-sutil'}`} aria-hidden="true" />
                                                </div>
                                                <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-wider text-accent-soft">{evento.tipo}</p>
                                                <h3 className="mt-0.5 text-sm font-semibold leading-5 text-texto">{evento.titulo || 'Sesión sin título'}</h3>
                                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-sutil">
                                                    <span className="inline-flex items-center gap-1"><SlidersHorizontal className="h-3 w-3" aria-hidden="true" /> {obtenerSala(evento.sala_id)}</span>
                                                    <span className="inline-flex items-center gap-1"><Mic className="h-3 w-3" aria-hidden="true" /> {nombreColaborador(evento.colaborador_id, colaboradores)}</span>
                                                </div>
                                                <span className={`${clasePillEstado(evento.estado)} mt-3`}>{ETIQUETAS_ESTADO[evento.estado] ?? evento.estado}</span>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="mt-5 py-6 text-center text-sutil">No hay sesiones que coincidan con esos filtros.</p>
                )}
            </section>
        </main>
    );
}
