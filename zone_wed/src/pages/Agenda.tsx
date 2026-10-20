// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import { Clock, Mic, SlidersHorizontal, Users } from 'lucide-react';
import { FondoHero } from '../components/Animados.tsx';
import { useColaboradores } from '../hooks/useColaboradores.ts';
import { useSalas } from '../hooks/useSalas.ts';
import { useSesiones } from '../hooks/useSesiones.ts';
import { useSolicitudes } from '../hooks/useSolicitudes.ts';
import { useSpotlight } from '../hooks/useSpotlight.ts';
import { formatearFecha } from '../utils/helpers.ts';
import { aMinutos } from '../utils/solicitudes.ts';
import { clasePillEstado } from '../styles/clases.ts';
import type { Colaborador } from '../models/Colaborador.ts';

import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ETIQUETAS_ESTADO = {
    solicitada: 'Solicitada',
    confirmada: 'Confirmada',
    completada: 'Completada',
    cancelada: 'Cancelada',
};

const PUNTO = {
    solicitada: 'bg-aviso',
    confirmada: 'bg-exito',
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

function nombreColaborador(id: string | number | null | undefined, colaboradores: Array<{ id: number | string; nombre: string }>) {
    return colaboradores.find((colaborador) => String(colaborador.id) === String(id))?.nombre ?? 'Sin asignar';
}

interface EventoBase {
    hora_inicio?: string;
    hora_fin?: string;
}

function minutosDeEvento(evento: EventoBase) {
    const inicio = aMinutos(evento.hora_inicio ?? '');
    const fin = aMinutos(evento.hora_fin ?? '');
    if (!Number.isFinite(inicio) || !Number.isFinite(fin)) return 0;
    return Math.max(0, fin - inicio);
}

function iniciales(nombre: string | null | undefined) {
    return String(nombre ?? '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0] ?? '')
        .join('')
        .toLocaleUpperCase();
}

interface EventoInv {
    colaborador_id?: string | number | null;
    colaboradores?: Array<{ colaborador_id: string | number }>;
}

function involucraA(evento: EventoInv, colaboradorId: string | number) {
    if (String(evento.colaborador_id) === String(colaboradorId)) return true;
    return Array.isArray(evento.colaboradores)
        && evento.colaboradores.some((invitacion) => String(invitacion.colaborador_id) === String(colaboradorId));
}

interface SolicitudColab {
    colaboradores?: Array<{ colaborador_id: string | number }>;
}

interface EventoAgenda {
    eventoId: string;
    titulo: string;
    tipo: string;
    estado: string;
    fecha: string | null;
    hora_inicio: string | null;
    hora_fin: string | null;
    sala_id: number | null;
}

function nombresDeSolicitud(solicitud: SolicitudColab, colaboradores: Array<{ id: number | string; nombre: string }>) {
    const nombres = (solicitud.colaboradores ?? [])
        .map((invitacion) => colaboradores.find((colaborador) => String(colaborador.id) === String(invitacion.colaborador_id))?.nombre)
        .filter(Boolean) as string[];
    return nombres.length ? nombres.join(', ') : 'Sin asignar';
}

export default function Agenda() {
    const [sesiones] = useSesiones();
    const [solicitudes] = useSolicitudes();
    const [salas] = useSalas();
    const [colaboradores] = useColaboradores();
    const boardRef = useRef<HTMLDivElement | null>(null);
    const [heroRef, seguirSpotlight] = useSpotlight<HTMLDivElement>();
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [filtroFecha, setFiltroFecha] = useState('');
    const hoy = useMemo(() => fechaHoy(), []);

    const reservasConfirmadas = useMemo(
        () => solicitudes.filter((solicitud) => solicitud.estado === 'confirmada'),
        [solicitudes]
    );

    const solicitudIdsConSesion = useMemo(() => {
        const ids = sesiones
            .map((sesion) => sesion.solicitud_id)
            .filter((id) => id !== null && id !== undefined)
            .map((id) => String(id));
        return new Set(ids);
    }, [sesiones]);

    const eventosAgenda = useMemo<EventoAgenda[]>(() => [
        ...sesiones.map((sesion) => ({ ...sesion, eventoId: `sesion-${sesion.id}`, tipo: 'Sesión' })),
        ...reservasConfirmadas
            .filter((solicitud) => !solicitudIdsConSesion.has(String(solicitud.id)))
            .map((solicitud) => {
                const horario = String(solicitud.franja ?? '').match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
                return {
                    ...solicitud,
                    eventoId: `solicitud-${solicitud.id}`,
                    titulo: solicitud.titulo || `Reserva confirmada · ${nombresDeSolicitud(solicitud as SolicitudColab, colaboradores as unknown as Array<{ id: string | number; nombre: string }>)}`,
                    hora_inicio: horario?.[1] ?? '',
                    hora_fin: horario?.[2] ?? '',
                    estado: 'confirmada',
                    tipo: 'Reserva aprobada',
                };
            }),
    ], [sesiones, reservasConfirmadas, solicitudIdsConSesion, colaboradores]);

    const sesionesFiltradas = useMemo(() => [...eventosAgenda]
        .filter((sesion) => filtroEstado === 'todas' || sesion.estado === filtroEstado)
        .filter((sesion) => !filtroFecha || sesion.fecha === filtroFecha)
        .sort((a, b) => `${a.fecha ?? ''}T${a.hora_inicio ?? ''}`.localeCompare(`${b.fecha ?? ''}T${b.hora_inicio ?? ''}`)),
    [eventosAgenda, filtroEstado, filtroFecha]);

    const dias = useMemo(() => {
        const mapa = new Map<string, EventoAgenda[]>();
        sesionesFiltradas.forEach((evento) => {
            const clave = evento.fecha ?? 'sin-fecha';
            if (!mapa.has(clave)) mapa.set(clave, []);
            mapa.get(clave)!.push(evento);
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
            targets: board.querySelectorAll<HTMLElement>('[data-evento]'),
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 420,
            delay: anime.stagger(45),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [dias]);

    const obtenerSala = (id: string | number | null | undefined) =>
        salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';

    const equipoDe = (evento: EventoInv) =>
        Array.isArray(evento.colaboradores)
                    ? nombresDeSolicitud(evento as SolicitudColab, colaboradores as unknown as Array<{ id: string | number; nombre: string }>)
                    : nombreColaborador(evento.colaborador_id, colaboradores as unknown as Array<{ id: string | number; nombre: string }>)

    const ocupacion = useMemo(() => {
        const filas = (colaboradores as Colaborador[])
            .filter((colaborador) => colaborador.activo !== false)
            .map((colaborador) => {
                const eventos = eventosAgenda.filter(
                    (evento) => evento.estado !== 'cancelada' && involucraA(evento as EventoInv, colaborador.id as string | number)
                );
                const horas = eventos.reduce((suma, evento) => suma + minutosDeEvento(evento as EventoBase), 0) / 60;
                return { colaborador, sesiones: eventos.length, horas: Math.round(horas * 10) / 10 };
            })
            .sort((a, b) => b.horas - a.horas || (a.colaborador.nombre || '').localeCompare(b.colaborador.nombre || ''));
        const maxHoras = Math.max(1, ...filas.map((fila) => fila.horas));
        const totalHoras = filas.reduce((suma, fila) => suma + fila.horas, 0);
        const libres = filas.filter((fila) => fila.horas === 0).length;
        return { filas, maxHoras, totalHoras: Math.round(totalHoras * 10) / 10, libres };
    }, [colaboradores, eventosAgenda]);

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
                    ref={heroRef}
                    onMouseMove={seguirSpotlight}
                    className="group/hero relative mt-6 overflow-hidden rounded-[2rem] border border-accent/25 p-6 sm:p-8"
                    style={{
                        background:
                            'radial-gradient(ellipse at 90% 8%, rgba(240, 79, 166, 0.26), transparent 48%), linear-gradient(120deg, rgba(111, 75, 187, 0.36), rgba(23, 19, 34, 0.97) 72%)',
                    }}
                >
                    <FondoHero acento="#9365f2" />
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
                                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-texto-soft">
                                    <span className="texto-degradado">{proximo.titulo || 'Sesión sin título'}</span>
                                </h2>
                                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-sutil">
                                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {proximo.hora_inicio || '--:--'}{proximo.hora_fin ? ` – ${proximo.hora_fin}` : ''}</span>
                                    <span className="inline-flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> {obtenerSala(proximo.sala_id)}</span>
                                    <span className="inline-flex items-center gap-1.5"><Mic className="h-3.5 w-3.5" aria-hidden="true" /> {equipoDe(proximo as EventoInv)}</span>
                                </div>
                            </div>
                        </div>
                        <span className={clasePillEstado(proximo.estado)}>{ETIQUETAS_ESTADO[proximo.estado as keyof typeof ETIQUETAS_ESTADO] ?? proximo.estado}</span>
                    </div>
                </section>
            )}

            <section className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Resumen de agenda">
                {resumen.map((item) => (
                    <article
                        key={item.etiqueta}
                        className={`tarjeta-brillo relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${item.tono} to-surface/40 p-4`}
                    >
                        <span className="text-sm text-sutil">{item.etiqueta}</span>
                        <strong className={`text-3xl font-black ${item.texto}`}>{item.valor}</strong>
                    </article>
                ))}
            </section>

            <section className="mt-6 rounded-[2rem] border border-border bg-surface/60 p-5 backdrop-blur sm:p-6" aria-labelledby="agenda-staff-title">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="workspace-eyebrow">OCUPACIÓN DEL PERSONAL</p>
                        <h2 id="agenda-staff-title" className="mt-1 flex items-center gap-2 text-xl font-bold tracking-tight text-texto-soft">
                            <Users className="h-5 w-5 text-accent-soft" aria-hidden="true" /> Carga del equipo
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent-soft">
                            {ocupacion.totalHoras} h agendadas
                        </span>
                        <span className="rounded-full border border-exito/40 bg-exito/10 px-3 py-1.5 text-xs font-bold text-exito-soft">
                            {ocupacion.libres} libres
                        </span>
                    </div>
                </div>

                {ocupacion.filas.length ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {ocupacion.filas.map(({ colaborador, sesiones, horas }) => {
                            const pct = Math.round((horas / ocupacion.maxHoras) * 100);
                            const libre = horas === 0;
                            const cargado = pct >= 70;
                            const acento = libre ? '#6b6480' : cargado ? '#f04fa6' : '#a477ff';
                            return (
                                <article
                                    key={colaborador.id}
                                    className="tarjeta-brillo relative overflow-hidden rounded-2xl border border-border bg-white/[0.02] p-4 transition hover:-translate-y-0.5 hover:border-accent/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-black text-white"
                                            style={{ background: `linear-gradient(135deg, ${acento}, #5b418f)` }}
                                            aria-hidden="true"
                                        >
                                            {iniciales(colaborador.nombre)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold text-texto-soft">{colaborador.nombre}</p>
                                            <p className="truncate text-xs text-sutil">{colaborador.especialidad ?? 'Equipo del estudio'}</p>
                                        </div>
                                        <span
                                            className="shrink-0 rounded-full border px-2 py-0.5 text-[0.62rem] font-bold"
                                            style={{ borderColor: `${acento}66`, background: `${acento}1f`, color: '#f2effb' }}
                                        >
                                            {libre ? 'Libre' : cargado ? 'Alta' : 'Media'}
                                        </span>
                                    </div>
                                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                                        <span
                                            className="block h-full rounded-full transition-all duration-700"
                                            style={{ width: `${Math.max(pct, libre ? 4 : 10)}%`, background: `linear-gradient(90deg, ${acento}, #e34ba6)` }}
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-sutil">
                                        <span>{sesiones} {sesiones === 1 ? 'actividad' : 'actividades'}</span>
                                        <span className="font-bold" style={{ color: libre ? undefined : acento }}>{horas} h</span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="mt-5 text-sutil">Aún no hay personal registrado en el estudio.</p>
                )}
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
                        ['solicitada', 'Solicitadas'],
                        ['confirmada', 'Confirmadas'],
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
                                                className="tarjeta-brillo rounded-2xl border border-border bg-surface/70 p-3.5 transition hover:-translate-y-0.5 hover:border-accent/50"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold tabular-nums text-texto-soft">
                                                        {evento.hora_inicio || '--:--'}{evento.hora_fin ? `–${evento.hora_fin}` : ''}
                                                    </span>
                                                    <span className={`h-2 w-2 rounded-full ${PUNTO[evento.estado as keyof typeof PUNTO] ?? 'bg-sutil'}`} aria-hidden="true" />
                                                </div>
                                                <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-wider text-accent-soft">{evento.tipo}</p>
                                                <h3 className="mt-0.5 text-sm font-semibold leading-5 text-texto">{evento.titulo || 'Sesión sin título'}</h3>
                                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-sutil">
                                                    <span className="inline-flex items-center gap-1"><SlidersHorizontal className="h-3 w-3" aria-hidden="true" /> {obtenerSala(evento.sala_id)}</span>
                                                    <span className="inline-flex items-center gap-1"><Mic className="h-3 w-3" aria-hidden="true" /> {equipoDe(evento as EventoInv)}</span>
                                                </div>
                                                <span className={`${clasePillEstado(evento.estado)} mt-3`}>{ETIQUETAS_ESTADO[evento.estado as keyof typeof ETIQUETAS_ESTADO] ?? evento.estado}</span>
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
