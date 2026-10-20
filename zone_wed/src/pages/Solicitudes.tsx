// CAPA: Presentación
import { useEffect, useMemo, useRef, useState, type ComponentType, type MouseEvent } from 'react';
import anime from 'animejs';
import {
    Check,
    Clock,
    Coins,
    Hourglass,
    Music,
    Sparkles,
    ThumbsUp,
    Users,
    Wallet,
    XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { esAdministrador } from '../config/roles.ts';
import { useColaboradores } from '../hooks/useColaboradores.ts';
import { useSalas } from '../hooks/useSalas.ts';
import { useSolicitudes } from '../hooks/useSolicitudes.ts';
import { CancionService } from '../services/cancionService.ts';
import { SolicitudService } from '../services/solicitudService.ts';
import { etiquetaEstado, etiquetaInvitacion, etiquetaTipo, estimadoSala } from '../utils/solicitudes.ts';
import type { Solicitud } from '../models/Solicitud.ts';
import { formatearFecha, formatearMoneda } from '../utils/helpers.ts';
import MisSolicitudes from '../components/MisSolicitudes.tsx';
import { Contador } from '../components/Animados.tsx';
import { BOTON_PELIGRO, BOTON_PRIMARIO, clasePillEstado } from '../styles/clases.ts';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface ColumnaKanban {
    clave: string;
    titulo: string;
    icono: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    punto: string;
    borde: string;
    fondo: string;
    brillo: string;
    texto: string;
}

const COLUMNAS: ColumnaKanban[] = [
    { clave: 'solicitada', titulo: 'Esperando respuestas', icono: Hourglass, punto: 'bg-aviso', borde: 'border-aviso/40', fondo: 'from-aviso/[0.09]', brillo: 'from-aviso/70', texto: 'text-aviso-soft' },
    { clave: 'por_autorizar', titulo: 'Por autorizar', icono: Sparkles, punto: 'bg-accent', borde: 'border-accent/40', fondo: 'from-accent/[0.09]', brillo: 'from-accent/70', texto: 'text-accent-soft' },
    { clave: 'por_pagar', titulo: 'Por pagar', icono: Wallet, punto: 'bg-magenta', borde: 'border-magenta/40', fondo: 'from-magenta/[0.09]', brillo: 'from-magenta/70', texto: 'text-magenta' },
    { clave: 'confirmada', titulo: 'Confirmadas', icono: ThumbsUp, punto: 'bg-exito', borde: 'border-exito/40', fondo: 'from-exito/[0.09]', brillo: 'from-exito/70', texto: 'text-exito-soft' },
    { clave: 'rechazada', titulo: 'Rechazadas', icono: XCircle, punto: 'bg-peligro', borde: 'border-peligro/40', fondo: 'from-peligro/[0.09]', brillo: 'from-peligro/70', texto: 'text-peligro-soft' },
    { clave: 'cancelada', titulo: 'Canceladas', icono: XCircle, punto: 'bg-sutil', borde: 'border-border', fondo: 'from-white/[0.04]', brillo: 'from-white/40', texto: 'text-sutil' },
];

const FILTROS = [
    { clave: 'todas', titulo: 'Todas' },
    ...COLUMNAS.map((columna) => ({ clave: columna.clave, titulo: columna.titulo })),
];

const PASOS_FLUJO = ['Cliente pide', 'Equipo acepta', 'Tú autorizas', 'Cliente paga', 'Reserva confirmada'];

function pasoActual(estado: string): number {
    if (estado === 'solicitada') return 1;
    if (estado === 'por_autorizar') return 2;
    if (estado === 'por_pagar') return 3;
    if (estado === 'confirmada') return 4;
    return 0;
}

const TONOS_AVATAR = [
    'from-[#9365f2] to-[#e34ba6]',
    'from-[#f04fa6] to-[#ffd166]',
    'from-[#7be0b0] to-[#9ecbff]',
    'from-[#9ecbff] to-[#a477ff]',
    'from-[#ffd166] to-[#ff8a8a]',
];

function iniciales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

function tonoAvatar(nombre: string): string {
    let suma = 0;
    for (const letra of nombre) suma += letra.charCodeAt(0);
    return TONOS_AVATAR[suma % TONOS_AVATAR.length];
}

function animarRipple(evento: MouseEvent<HTMLButtonElement>) {
    if (MENOS_MOVIMIENTO()) return;
    const boton = evento.currentTarget;
    const circulo = document.createElement('span');
    const dimension = Math.max(boton.clientWidth, boton.clientHeight);
    const rect = boton.getBoundingClientRect();
    circulo.className = 'pointer-events-none absolute rounded-full bg-white/30 [transform:scale(0)]';
    circulo.style.width = `${dimension}px`;
    circulo.style.height = `${dimension}px`;
    circulo.style.left = `${evento.clientX - rect.left - dimension / 2}px`;
    circulo.style.top = `${evento.clientY - rect.top - dimension / 2}px`;
    boton.appendChild(circulo);
    anime({
        targets: circulo,
        scale: [0, 2.4],
        opacity: [0.55, 0],
        duration: 620,
        easing: 'easeOutCubic',
        complete: () => circulo.remove(),
    });
}

function KpiSolicitudes({ icono: Icono, etiqueta, valor, degradado, acento }: {
    icono: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    etiqueta: string;
    valor: number;
    degradado: string;
    acento: string;
}) {
    return (
        <article className={`tarjeta-brillo group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${degradado} p-4`}>
            <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-sutil">{etiqueta}</span>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/70 bg-black/20 transition group-hover:scale-110 ${acento}`} aria-hidden="true">
                    <Icono className="h-4 w-4" />
                </span>
            </div>
            <strong className={`mt-2 block text-3xl font-black ${acento}`}><Contador valor={valor} pad={2} /></strong>
        </article>
    );
}

function BandejaSolicitudes() {
    const { usuario } = useAuth();
    const [solicitudes] = useSolicitudes();
    const [colaboradores] = useColaboradores();
    const [salas] = useSalas();
    const boardRef = useRef<HTMLDivElement>(null);
    const [ocupado, setOcupado] = useState<number | null>(null);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState<string>('todas');

    const canciones = useMemo(() => CancionService.listar(), [solicitudes]);

    const grupos = useMemo<Record<string, Solicitud[]>>(() => {
        const base: Record<string, Solicitud[]> = { solicitada: [], por_autorizar: [], por_pagar: [], confirmada: [], rechazada: [], cancelada: [] };
        [...solicitudes]
            .sort((a, b) => String(b.fecha_solicitud ?? b.fecha ?? '').localeCompare(String(a.fecha_solicitud ?? a.fecha ?? '')))
            .forEach((solicitud) => {
                const clave = base[solicitud.estado] ? solicitud.estado : 'cancelada';
                base[clave].push(solicitud);
            });
        return base;
    }, [solicitudes]);

    const columnasVisibles = useMemo(
        () => (filtro === 'todas' ? COLUMNAS : COLUMNAS.filter((columna) => columna.clave === filtro)),
        [filtro]
    );

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const board = boardRef.current;
        if (!board) return undefined;
        const animacion = anime({
            targets: board.querySelectorAll('[data-solicitud]'),
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 380,
            delay: anime.stagger(45),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [solicitudes, filtro]);

    const nombreSolicitante = (solicitud: Solicitud): string => solicitud.solicitante_nombre ?? 'Cliente';
    const nombreColaborador = (id: number | string | null): string =>
        colaboradores.find((colaborador) => String(colaborador.id) === String(id))?.nombre ?? `Colaborador #${id}`;
    const obtenerSala = (id: number | null): string => salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';
    const nombreCancionDe = (solicitud: Solicitud): string | null => {
        if (!solicitud.cancion_id) return null;
        return canciones.find((cancion) => String(cancion.id) === String(solicitud.cancion_id))?.nombre ?? 'Canción no encontrada';
    };

    const porResponder = grupos.solicitada.length;
    const porAutorizar = grupos.por_autorizar.length;

    const accion = (fn: () => unknown, solicitud: Solicitud, exito: string) => {
        setMensaje('');
        setError('');
        setOcupado(solicitud.id);
        try {
            fn();
            setMensaje(exito);
        } catch (fallo) {
            setError(fallo instanceof Error ? fallo.message : 'No se pudo completar la acción.');
        } finally {
            setOcupado(null);
        }
    };

    const autorizar = (solicitud: Solicitud) => accion(
        () => SolicitudService.autorizar(solicitud.id!, { rol: usuario?.rol }),
        solicitud,
        `Solicitud autorizada. Se emitió el anticipo para ${nombreSolicitante(solicitud)}.`
    );

    const rechazar = (solicitud: Solicitud) => accion(
        () => SolicitudService.rechazar(solicitud.id!, { rol: usuario?.rol }),
        solicitud,
        'Solicitud rechazada.'
    );

    return (
        <main className="workspace-content" data-page="solicitudes">
            <header className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-surface-2/80 via-surface/60 to-surface/20 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-10 h-64 w-64 animate-aurora rounded-full bg-[#e34ba6]/20 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-10 h-56 w-56 animate-aurora rounded-full bg-accent/20 blur-3xl" />
                <div className="relative">
                    <p className="workspace-eyebrow">RESERVAS DEL ESTUDIO</p>
                    <h1 className="mt-1 text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-[-0.04em]">
                        Solicitudes <span className="texto-degradado">del estudio</span>
                    </h1>
                    <p className="mt-2 max-w-2xl leading-relaxed text-sutil">
                        El cliente pide, el equipo acepta, tú autorizas y el cliente paga el anticipo para confirmar la reserva.
                    </p>

                    {/* Flujo visual: explica el recorrido de una solicitud */}
                    <ol className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-sutil" aria-label="Flujo de una solicitud">
                        {PASOS_FLUJO.map((paso, indice, arreglo) => (
                            <li key={paso} className="flex items-center gap-2">
                                <span className="group flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 font-semibold text-texto-soft transition hover:border-accent/50 hover:bg-accent/10">
                                    <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-accent to-magenta text-[0.62rem] font-black text-white shadow-sm shadow-accent/30">{indice + 1}</span>
                                    {paso}
                                </span>
                                {indice < arreglo.length - 1 && <span aria-hidden="true" className="text-accent/50">→</span>}
                            </li>
                        ))}
                    </ol>
                </div>
            </header>

            {mensaje && <p className="mt-5 rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">{mensaje}</p>}
            {error && <p className="mt-5 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">{error}</p>}

            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen de solicitudes">
                <KpiSolicitudes icono={Sparkles} etiqueta="Total de solicitudes" valor={solicitudes.length} degradado="from-[#5b418f]/45 to-surface/30" acento="text-accent-soft" />
                <KpiSolicitudes icono={Hourglass} etiqueta="Esperando respuestas" valor={porResponder} degradado="from-aviso/25 to-surface/30" acento="text-aviso-soft" />
                <KpiSolicitudes icono={ThumbsUp} etiqueta="Por autorizar" valor={porAutorizar} degradado="from-accent/25 to-surface/30" acento="text-accent-soft" />
                <KpiSolicitudes icono={Check} etiqueta="Confirmadas" valor={grupos.confirmada.length} degradado="from-exito/25 to-surface/30" acento="text-exito-soft" />
            </section>

            {/* Filtros por estado: evita apretar las 6 columnas en pantallas medianas */}
            <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por estado">
                {FILTROS.map((opcion) => {
                    const activo = filtro === opcion.clave;
                    const cantidad = opcion.clave === 'todas' ? solicitudes.length : grupos[opcion.clave].length;
                    return (
                        <button
                            key={opcion.clave}
                            type="button"
                            role="tab"
                            aria-selected={activo}
                            onClick={() => setFiltro(opcion.clave)}
                            className={`inline-flex min-h-[38px] items-center gap-2 rounded-full border px-3.5 text-xs font-bold transition ${
                                activo
                                    ? 'border-accent/60 bg-gradient-to-r from-accent/20 to-magenta/15 text-accent-soft shadow-sm shadow-accent/20'
                                    : 'border-border bg-white/[0.03] text-sutil hover:border-accent/40 hover:text-texto'
                            }`}
                        >
                            {opcion.titulo}
                            <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.62rem] ${activo ? 'bg-accent/25 text-accent-soft' : 'bg-white/[0.08]'}`}>{cantidad}</span>
                        </button>
                    );
                })}
            </div>

            <div
                ref={boardRef}
                className="mt-5 flex gap-4 overflow-x-auto pb-3 [scrollbar-color:theme(colors.accent/40)_transparent]"
            >
                {columnasVisibles.map((columna) => {
                    const items = grupos[columna.clave];
                    return (
                        <section
                            key={columna.clave}
                            className={`relative flex w-[340px] shrink-0 flex-col overflow-hidden rounded-[1.75rem] border ${columna.borde} bg-gradient-to-b ${columna.fondo} to-transparent pt-1`}
                            aria-label={columna.titulo}
                        >
                            <span className={`h-1 w-full rounded-full bg-gradient-to-r ${columna.brillo} to-transparent`} aria-hidden="true" />
                            <header className="mb-3 mt-2 flex items-center justify-between px-3.5">
                                <span className="flex items-center gap-2 text-sm font-bold text-texto-soft">
                                    <span className={`grid h-6 w-6 place-items-center rounded-lg border border-border/60 bg-black/20 ${columna.texto}`} aria-hidden="true">
                                        <columna.icono className="h-3.5 w-3.5" />
                                    </span>
                                    {columna.titulo}
                                </span>
                                <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-white/[0.06] px-2 text-xs font-bold text-sutil">
                                    <Contador valor={items.length} pad={2} />
                                </span>
                            </header>

                            <div className="flex max-h-[68vh] min-h-[120px] flex-1 flex-col gap-3 overflow-y-auto px-3.5 pb-3.5 pr-2">
                                {items.length ? (
                                    items.map((solicitud) => {
                                        const sala = salas.find((item) => String(item.id) === String(solicitud.sala_id));
                                        const estimado = estimadoSala(sala, solicitud.franja);
                                        const cancion = nombreCancionDe(solicitud);

                                        return (
                                            <article
                                                key={solicitud.id}
                                                data-solicitud
                                                data-estado={solicitud.estado}
                                                className="tarjeta-brillo group relative overflow-hidden rounded-2xl border border-border bg-surface/85 p-4 shadow-sm shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/15"
                                            >
                                                <span className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${columna.brillo} to-transparent`} aria-hidden="true" />
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tonoAvatar(nombreSolicitante(solicitud))} text-sm font-black text-white shadow-md shadow-black/30`} aria-hidden="true">
                                                            {iniciales(nombreSolicitante(solicitud))}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <h3 className="truncate text-sm font-bold text-texto-soft">{solicitud.titulo || etiquetaTipo(solicitud.tipo)}</h3>
                                                            <p className="mt-0.5 truncate text-xs text-sutil">
                                                                <span className="font-semibold text-texto">{nombreSolicitante(solicitud)}</span> · {etiquetaTipo(solicitud.tipo)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={clasePillEstado(solicitud.estado)}>{etiquetaEstado(solicitud.estado)}</span>
                                                </div>

                                                <p className="mt-2.5 flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-wider text-sutil">
                                                    <Clock className="h-3 w-3 text-accent-soft" aria-hidden="true" />
                                                    {formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || 'Fecha pendiente'}
                                                </p>

                                                {pasoActual(solicitud.estado) > 0 && (
                                                    <div className="mt-3" aria-label={`Progreso: paso ${pasoActual(solicitud.estado)} de 4`}>
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4].map((paso) => (
                                                                <span
                                                                    key={paso}
                                                                    className={`h-1.5 flex-1 rounded-full transition ${paso <= pasoActual(solicitud.estado) ? `bg-gradient-to-r ${columna.brillo} to-accent` : 'bg-white/[0.08]'}`}
                                                                    aria-hidden="true"
                                                                />
                                                            ))}
                                                        </div>
                                                        <p className="mt-1 text-[0.62rem] font-medium text-sutil">Paso {pasoActual(solicitud.estado)} de 4 · {PASOS_FLUJO[pasoActual(solicitud.estado)]}</p>
                                                    </div>
                                                )}

                                                <div className="mt-3 grid gap-1.5 text-xs">
                                                    <p className="flex items-center gap-2 text-sutil">
                                                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-accent-soft" aria-hidden="true">
                                                            <Check className="h-3.5 w-3.5" />
                                                        </span>
                                                        <span className="truncate">{obtenerSala(solicitud.sala_id)} · {solicitud.franja || 'Por coordinar'}</span>
                                                    </p>
                                                    {cancion && (
                                                        <p className="flex items-center gap-2 text-sutil">
                                                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-accent-soft" aria-hidden="true">
                                                                <Music className="h-3.5 w-3.5" />
                                                            </span>
                                                            <span className="truncate">{cancion}</span>
                                                        </p>
                                                    )}
                                                </div>

                                                {estimado !== null && (
                                                    <p className="mt-3 flex items-center justify-between rounded-xl border border-border/60 bg-black/20 px-3 py-2">
                                                        <span className="flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-wider text-sutil">
                                                            <Coins className="h-3.5 w-3.5 text-accent-soft" aria-hidden="true" /> Estimado
                                                        </span>
                                                        <strong className="text-sm font-black text-accent-soft">{formatearMoneda(estimado)}</strong>
                                                    </p>
                                                )}

                                                {(solicitud.colaboradores ?? []).length > 0 && (
                                                    <div className="mt-3 rounded-xl border border-border/60 bg-black/15 p-2.5">
                                                        <p className="mb-1.5 flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-wider text-sutil">
                                                            <Users className="h-3 w-3" aria-hidden="true" /> Equipo
                                                        </p>
                                                        <ul className="flex flex-wrap gap-1.5" aria-label={`Colaboradores de ${solicitud.titulo || etiquetaTipo(solicitud.tipo)}`}>
                                                            {(solicitud.colaboradores ?? []).map((invitacion) => (
                                                                <li key={`${solicitud.id}-${invitacion.colaborador_id}`} className={clasePillEstado(invitacion.estado)}>
                                                                    {nombreColaborador(invitacion.colaborador_id)}
                                                                    <span className="ml-1.5 font-normal opacity-80">{etiquetaInvitacion(invitacion.estado)}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {(solicitud.partes ?? []).length > 0 && (
                                                    <p className="mt-2 text-[0.68rem] text-sutil">
                                                        <span className="font-semibold text-texto-soft">Partes:</span> {solicitud.partes.join(', ')}
                                                    </p>
                                                )}

                                                {solicitud.estado === 'por_autorizar' && (
                                                    <div className="mt-3 flex gap-2">
                                                        <button
                                                            className={`${BOTON_PRIMARIO} relative flex-1 overflow-hidden`}
                                                            disabled={ocupado === solicitud.id}
                                                            onClick={(evento) => {
                                                                animarRipple(evento);
                                                                autorizar(solicitud);
                                                            }}
                                                            type="button"
                                                        >
                                                            <Check className="mr-2 h-4 w-4" aria-hidden="true" /> Autorizar
                                                        </button>
                                                        <button
                                                            className={`${BOTON_PELIGRO} relative overflow-hidden`}
                                                            disabled={ocupado === solicitud.id}
                                                            onClick={(evento) => {
                                                                animarRipple(evento);
                                                                rechazar(solicitud);
                                                            }}
                                                            type="button"
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Rechazar
                                                        </button>
                                                    </div>
                                                )}

                                                {solicitud.estado === 'por_pagar' && (
                                                    <p className="mt-3 flex items-center gap-2 rounded-xl border border-magenta/30 bg-magenta/[0.08] px-3 py-2 text-xs text-magenta">
                                                        <Coins className="h-3.5 w-3.5 shrink-0 animate-glow" aria-hidden="true" />
                                                        Anticipo emitido. Esperando el pago del cliente.
                                                    </p>
                                                )}
                                            </article>
                                        );
                                    })
                                ) : (
                                    <p className="rounded-2xl border border-dashed border-border/70 bg-black/10 px-3 py-6 text-center text-xs text-sutil">
                                        Sin solicitudes
                                    </p>
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>
        </main>
    );
}

export default function Solicitudes() {
    const { usuario } = useAuth();

    return esAdministrador(usuario) ? <BandejaSolicitudes /> : <MisSolicitudes />;
}