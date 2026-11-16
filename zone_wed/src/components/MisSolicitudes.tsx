// CAPA: Presentación
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import anime from 'animejs';
import {
    CalendarClock,
    Check,
    Clock,
    Disc3,
    Mic,
    Music,
    SlidersHorizontal,
    Sparkles,
    Users,
    Wand2,
    X,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Contador, Ecualizador } from './Animados.tsx';
import FormularioSolicitud from './FormularioSolicitud.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { esCliente } from '../config/roles.ts';
import { useApi } from '../hooks/useApi.ts';
import { listarSolicitudes, obtenerSolicitud, responderInvitacionSolicitud } from '../api/solicitudesApi.ts';
import { adaptarSolicitud, adaptarSolicitudResumen } from '../api/adapters.ts';
import { TIPOS_SOLICITUD } from '../models/Solicitud.ts';
import type { Solicitud } from '../models/Solicitud.ts';
import { etiquetaEstado, etiquetaInvitacion, etiquetaTipo } from '../utils/solicitudes.ts';
import { formatearFecha } from '../utils/helpers.ts';
import { BOTON_PELIGRO, BOTON_PRIMARIO, clasePillEstado } from '../styles/clases.ts';
import '../styles/tailwind.css';

interface DatoProps {
    icono: LucideIcon;
    etiqueta: string;
    valor: ReactNode;
}

const TIPOS_META: Record<string, LucideIcon> = {
    [TIPOS_SOLICITUD.GRABACION]: Mic,
    [TIPOS_SOLICITUD.MEZCLA]: SlidersHorizontal,
    [TIPOS_SOLICITUD.MASTERIZACION]: Disc3,
    [TIPOS_SOLICITUD.ENSAYO]: Music,
    [TIPOS_SOLICITUD.PRODUCCION]: Wand2,
};

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ACENTO_ESTADO: Record<string, string> = {
    confirmada: '#7be0b0',
    solicitada: '#ffd166',
    por_autorizar: '#a477ff',
    por_pagar: '#f04fa6',
    rechazada: '#f2a4b1',
    cancelada: '#f2a4b1',
};
const acentoEstado = (estado: string): string => ACENTO_ESTADO[estado] ?? '#a477ff';

const ESTADOS_CANCELABLES = ['solicitada', 'por_autorizar', 'por_pagar'];

const SIGUIENTE_PASO: Record<string, string> = {
    solicitada: 'Esperando que el equipo invitado acepte.',
    por_autorizar: 'El equipo aceptó. El estudio debe autorizar la reserva.',
    por_pagar: 'El estudio autorizó. Paga el anticipo para confirmar tu sesión.',
    confirmada: 'Reserva confirmada. ¡Tu sesión está agendada!',
};

function Dato({ icono: Icono, etiqueta, valor }: DatoProps) {
    return (
        <span className="flex items-start gap-2.5">
            <Icono className="mt-0.5 h-4 w-4 shrink-0 text-accent-soft" aria-hidden="true" />
            <span className="grid gap-0.5">
                <strong className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">{etiqueta}</strong>
                <span className="text-sm text-texto">{valor}</span>
            </span>
        </span>
    );
}

export default function MisSolicitudes() {
    const { usuario } = useAuth();
    const cargarSolicitudes = useCallback(() => listarSolicitudes({ tamano: 100 }), []);
    const { datos, error, cargando, recargar } = useApi(cargarSolicitudes);
    const solicitudes = useMemo(() => (datos?.items ?? []).map(adaptarSolicitudResumen), [datos]);

    const [detalle, setDetalle] = useState<{ id: number; esInvitacion: boolean } | null>(null);

    const clienteId = usuario?.clienteId ?? null;
    const colaboradorId = usuario?.colaboradorId ?? null;

    const misSolicitudes = useMemo(() => {
        if (!clienteId) return [];
        return [...solicitudes]
            .filter((solicitud) => String(solicitud.usuario_id) === String(clienteId))
            .sort((a, b) => String(b.fecha_solicitud ?? b.fecha ?? '').localeCompare(String(a.fecha_solicitud ?? a.fecha ?? '')));
    }, [solicitudes, clienteId]);

    const invitacionesRecibidas = useMemo(
        () => [...solicitudes]
            .filter((solicitud) => String(solicitud.usuario_id) !== String(clienteId))
            .sort((a, b) => String(b.fecha_solicitud ?? b.fecha ?? '').localeCompare(String(a.fecha_solicitud ?? a.fecha ?? ''))),
        [solicitudes, clienteId]
    );

    const resumen = useMemo(() => ({
        total: misSolicitudes.length,
        activas: misSolicitudes.filter((solicitud) => ESTADOS_CANCELABLES.includes(solicitud.estado)).length,
        confirmadas: misSolicitudes.filter((solicitud) => solicitud.estado === 'confirmada').length,
    }), [misSolicitudes]);

    const historialRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const contenedor = historialRef.current;
        if (!contenedor || MENOS_MOVIMIENTO()) return undefined;
        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-solicitud]'),
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 480,
            delay: anime.stagger(70),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [misSolicitudes]);

    const abrirDetalle = (solicitud: Solicitud, esInvitacion: boolean) => {
        if (solicitud.id == null) return;
        setDetalle({ id: Number(solicitud.id), esInvitacion });
    };

    return (
        <main className="workspace-content" data-page="mis-solicitudes">
            {/* HERO */}
            <section
                className="relative overflow-hidden rounded-[2rem] border border-accent/25 p-6 sm:p-8"
                style={{
                    background:
                        'radial-gradient(ellipse at 88% 6%, rgba(227, 75, 166, 0.30), transparent 46%), radial-gradient(ellipse at 0% 100%, rgba(111, 75, 187, 0.36), transparent 50%), linear-gradient(120deg, rgba(111, 75, 187, 0.38), rgba(23, 19, 34, 0.97) 72%)',
                }}
            >
                <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-24 h-64 w-64 animate-aurora rounded-full bg-[#e34ba6]/25 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-16 h-56 w-56 animate-aurora rounded-full bg-[#9365f2]/25 blur-3xl [animation-delay:-6s]" />
                <CalendarClock aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden h-44 w-44 -translate-y-1/2 text-white/[0.05] xl:block" />

                <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="max-w-xl">
                        <p className="workspace-eyebrow flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> TU AGENDA DE ESTUDIO
                        </p>
                        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                            Reserva, produce, suena.
                        </h1>
                        <p className="mt-3 text-sm leading-7 text-sutil">
                            Consulta el avance de tus reservas y responde las invitaciones que recibas como artista o
                            productor. Cuando el equipo acepta y el estudio autoriza, podrás pagar el anticipo para
                            confirmar tu sesión.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-[84px] rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-texto-soft"><Contador valor={resumen.total} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Total</span>
                        </div>
                        <div className="min-w-[84px] rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-aviso-soft"><Contador valor={resumen.activas} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">En curso</span>
                        </div>
                        <div className="min-w-[84px] rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-exito-soft"><Contador valor={resumen.confirmadas} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Confirmadas</span>
                        </div>
                        <Ecualizador />
                    </div>
                </div>
            </section>

            {error && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={recargar}
                        className="rounded-lg border border-peligro/40 px-3 py-1.5 text-xs font-bold transition hover:bg-peligro/10"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {esCliente(usuario) && usuario?.clienteId && (
                <div className="mt-9">
                    <FormularioSolicitud onCreada={recargar} />
                </div>
            )}

            {/* INVITACIONES RECIBIDAS */}
            {colaboradorId && datos && invitacionesRecibidas.length > 0 && (
                <section className="mt-9" aria-labelledby="invitaciones-title">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="workspace-eyebrow">INVITACIONES</p>
                            <h2 id="invitaciones-title" className="mt-1 text-2xl font-bold tracking-tight text-texto-soft">Invitaciones recibidas</h2>
                        </div>
                        <span className="rounded-full border border-accent-soft/30 px-3 py-1.5 text-[0.68rem] font-extrabold tracking-[0.1em] text-accent-soft">
                            {String(invitacionesRecibidas.length).padStart(2, '0')} RECIBIDAS
                        </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {invitacionesRecibidas.map((solicitud) => {
                            const acento = acentoEstado(solicitud.estado);
                            const IconoTipo = TIPOS_META[solicitud.tipo] ?? Music;
                            return (
                                <button
                                    key={solicitud.id}
                                    type="button"
                                    onClick={() => abrirDetalle(solicitud, true)}
                                    className="group relative overflow-hidden rounded-2xl border bg-white/[0.02] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40"
                                    style={{ borderColor: `${acento}44` }}
                                >
                                    <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl" style={{ background: `${acento}22` }} />
                                    <div className="relative flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-surface-2" style={{ borderColor: `${acento}66` }} aria-hidden="true">
                                                <IconoTipo className="h-4 w-4" style={{ color: acento }} />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="truncate text-sm font-bold text-texto-soft">{solicitud.titulo || etiquetaTipo(solicitud.tipo)}</h3>
                                                <p className="mt-0.5 truncate text-xs text-sutil">
                                                    {etiquetaTipo(solicitud.tipo)} · {formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || 'Fecha pendiente'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={clasePillEstado(solicitud.estado)}>{etiquetaEstado(solicitud.estado)}</span>
                                    </div>
                                    <p className="relative mt-2.5 flex items-center gap-1.5 text-xs text-sutil">
                                        <Clock className="h-3 w-3 text-accent-soft" aria-hidden="true" />
                                        {solicitud.franja || 'Por coordinar'}
                                    </p>
                                    <span className="relative mt-2 flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-accent-soft opacity-70 transition group-hover:opacity-100">
                                        Ver invitación →
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* HISTORIAL */}
            <section className="mt-9" aria-labelledby="mis-solicitudes-title">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="workspace-eyebrow">HISTORIAL</p>
                        <h2 id="mis-solicitudes-title" className="mt-1 text-2xl font-bold tracking-tight text-texto-soft">Tus solicitudes</h2>
                    </div>
                    <span className="rounded-full border border-accent-soft/30 px-3 py-1.5 text-[0.68rem] font-extrabold tracking-[0.1em] text-accent-soft">
                        {String(resumen.total).padStart(2, '0')} REGISTRADAS
                    </span>
                </div>

                {cargando ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Cargando solicitudes">
                        {[0, 1, 2, 3].map((indice) => (
                            <div key={indice} className="animate-pulse rounded-2xl border border-border bg-surface/60 p-4">
                                <div className="h-4 w-2/3 rounded bg-white/10" />
                                <div className="mt-3 h-3 w-1/2 rounded bg-white/[0.06]" />
                                <div className="mt-4 h-14 rounded-xl bg-white/[0.06]" />
                            </div>
                        ))}
                    </div>
                ) : datos ? (
                    misSolicitudes.length ? (
                        <div ref={historialRef} className="relative grid gap-4">
                            <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-4 top-3 w-px bg-gradient-to-b from-accent/50 via-white/10 to-transparent" />
                            {misSolicitudes.map((solicitud) => {
                                const acento = acentoEstado(solicitud.estado);
                                const IconoTipo = TIPOS_META[solicitud.tipo] ?? Music;

                                return (
                                    <article data-solicitud className="relative pl-12" key={solicitud.id}>
                                        <span className="absolute left-0 top-5 grid h-8 w-8 place-items-center rounded-full border bg-surface-2" style={{ borderColor: `${acento}66` }} aria-hidden="true">
                                            <IconoTipo className="h-4 w-4" style={{ color: acento }} />
                                        </span>
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => abrirDetalle(solicitud, false)}
                                            onKeyDown={(evento) => {
                                                if (evento.key === 'Enter' || evento.key === ' ') {
                                                    evento.preventDefault();
                                                    abrirDetalle(solicitud, false);
                                                }
                                            }}
                                            className="group relative cursor-pointer overflow-hidden rounded-2xl border bg-white/[0.02] p-5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60"
                                            style={{ borderColor: `${acento}44` }}
                                        >
                                            <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full blur-2xl" style={{ background: `${acento}22` }} />
                                            <div className="relative flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <p className="workspace-eyebrow">{formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || 'Fecha pendiente'}</p>
                                                    <h3 className="mt-1 text-lg font-bold text-texto-soft">{solicitud.titulo || etiquetaTipo(solicitud.tipo)}</h3>
                                                </div>
                                                <span className={clasePillEstado(solicitud.estado)}>{etiquetaEstado(solicitud.estado)}</span>
                                            </div>
                                            <div className="relative mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                                                <Dato icono={Clock} etiqueta="Horario" valor={solicitud.franja || 'Por coordinar'} />
                                                <Dato icono={Music} etiqueta="Servicio" valor={etiquetaTipo(solicitud.tipo)} />
                                            </div>

                                            {SIGUIENTE_PASO[solicitud.estado] && (
                                                <p className="relative mt-3 flex items-center gap-2 text-xs text-sutil">
                                                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent-soft" aria-hidden="true" />
                                                    {SIGUIENTE_PASO[solicitud.estado]}
                                                </p>
                                            )}

                                            <span className="relative mt-3 flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-accent-soft opacity-70 transition group-hover:opacity-100">
                                                Ver detalle →
                                            </span>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-border bg-surface/40 px-4 py-10 text-center text-sm text-sutil">
                            Todavía no has creado solicitudes.
                        </p>
                    )
                ) : null}
            </section>

            {detalle && (
                <DetalleSolicitud
                    id={detalle.id}
                    colaboradorId={detalle.esInvitacion ? colaboradorId : null}
                    onCerrar={() => setDetalle(null)}
                    onRecargarLista={recargar}
                />
            )}
        </main>
    );
}

function DetalleSolicitud({ id, colaboradorId, onCerrar, onRecargarLista }: {
    id: number;
    colaboradorId?: string | null;
    onCerrar: () => void;
    onRecargarLista?: () => void;
}) {
    const cargar = useCallback(() => obtenerSolicitud(id), [id]);
    const { datos, error, cargando, recargar } = useApi(cargar);
    const solicitud = useMemo(() => (datos ? adaptarSolicitud(datos) : null), [datos]);
    const [ocupado, setOcupado] = useState<'aceptada' | 'rechazada' | null>(null);
    const [mensaje, setMensaje] = useState('');
    const [errorResponder, setErrorResponder] = useState('');

    useEffect(() => {
        const cerrarConEscape = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') onCerrar();
        };
        window.addEventListener('keydown', cerrarConEscape);
        return () => window.removeEventListener('keydown', cerrarConEscape);
    }, [onCerrar]);

    const invitacion = colaboradorId && datos
        ? datos.colaboradores.find((item) => String(item.colaboradorId) === String(colaboradorId)) ?? null
        : null;

    const responder = async (decision: 'aceptada' | 'rechazada') => {
        if (!colaboradorId) return;
        setOcupado(decision);
        setMensaje('');
        setErrorResponder('');
        try {
            await responderInvitacionSolicitud(id, colaboradorId, decision);
            setMensaje(decision === 'aceptada' ? 'Aceptaste la invitación.' : 'Rechazaste la invitación.');
            recargar();
            onRecargarLista?.();
        } catch (errorAccion) {
            setErrorResponder(errorAccion instanceof Error ? errorAccion.message : 'No se pudo responder la invitación.');
        } finally {
            setOcupado(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={onCerrar}
            role="presentation"
        >
            <div
                className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl"
                onClick={(evento) => evento.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Detalle de la solicitud"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[0.62rem] font-bold uppercase tracking-wider text-sutil">Detalle de la solicitud</p>
                        <h2 className="mt-1 truncate text-lg font-bold text-texto-soft">
                            {datos ? datos.titulo || etiquetaTipo(datos.tipo) : 'Solicitud'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onCerrar}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-white/[0.04] text-sutil transition hover:text-texto"
                        aria-label="Cerrar detalle"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>

                {cargando && (
                    <p className="mt-4 rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-sm text-sutil" role="status">
                        Cargando detalle de la solicitud…
                    </p>
                )}

                {error && (
                    <div className="mt-4 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={recargar}
                            className="mt-2 rounded-lg border border-peligro/40 px-3 py-1.5 text-xs font-bold transition hover:bg-peligro/10"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {datos && solicitud && (
                    <div className="mt-4 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={clasePillEstado(datos.estado)}>{etiquetaEstado(datos.estado)}</span>
                            <span className="text-xs font-semibold text-sutil">{etiquetaTipo(datos.tipo)}</span>
                        </div>

                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="text-[0.62rem] font-bold uppercase tracking-wider text-sutil">Cliente</dt>
                                <dd className="text-texto-soft">{datos.cliente || 'Cliente'}</dd>
                            </div>
                            <div>
                                <dt className="text-[0.62rem] font-bold uppercase tracking-wider text-sutil">Sala</dt>
                                <dd className="text-texto-soft">{datos.sala ?? 'Sala no disponible'}</dd>
                            </div>
                            <div>
                                <dt className="text-[0.62rem] font-bold uppercase tracking-wider text-sutil">Fecha deseada</dt>
                                <dd className="text-texto-soft">{formatearFecha(datos.fechaDeseada) || 'Pendiente'}</dd>
                            </div>
                            <div>
                                <dt className="text-[0.62rem] font-bold uppercase tracking-wider text-sutil">Franja</dt>
                                <dd className="text-texto-soft">{datos.franja || 'Por coordinar'}</dd>
                            </div>
                            {datos.cancion && (
                                <div>
                                    <dt className="text-[0.62rem] font-bold uppercase tracking-wider text-sutil">Canción</dt>
                                    <dd className="text-texto-soft">{datos.cancion}</dd>
                                </div>
                            )}
                            {datos.proyecto && (
                                <div>
                                    <dt className="text-[0.62rem] font-bold uppercase tracking-wider text-sutil">Proyecto</dt>
                                    <dd className="text-texto-soft">{datos.proyecto}</dd>
                                </div>
                            )}
                        </dl>

                        <div>
                            <p className="text-[0.62rem] font-bold uppercase tracking-wider text-sutil">Descripción</p>
                            <p className="mt-1 text-sm leading-relaxed text-texto-soft">{datos.descripcion || 'Sin descripción.'}</p>
                        </div>

                        {solicitud.partes.length > 0 && (
                            <div>
                                <p className="text-[0.62rem] font-bold uppercase tracking-wider text-sutil">Partes</p>
                                <p className="mt-1 text-sm text-texto-soft">{solicitud.partes.join(', ')}</p>
                            </div>
                        )}

                        <div>
                            <p className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-sutil">
                                <Users className="h-3.5 w-3.5" aria-hidden="true" /> Equipo
                            </p>
                            {datos.colaboradores.length > 0 ? (
                                <ul className="mt-2 flex flex-wrap gap-1.5">
                                    {datos.colaboradores.map((colaborador) => (
                                        <li key={colaborador.colaboradorId} className={clasePillEstado(colaborador.estado)}>
                                            {colaborador.nombre}
                                            <span className="ml-1.5 font-normal opacity-80">{etiquetaInvitacion(colaborador.estado)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-1 text-sm text-sutil">Sin colaboradores invitados.</p>
                            )}
                        </div>

                        {mensaje && (
                            <p className="rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">{mensaje}</p>
                        )}
                        {errorResponder && (
                            <p className="rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">{errorResponder}</p>
                        )}

                        {invitacion && (
                            <div className="border-t border-border/60 pt-3">
                                {invitacion.estado === 'pendiente' ? (
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            className={BOTON_PRIMARIO}
                                            disabled={ocupado !== null}
                                            onClick={() => responder('aceptada')}
                                        >
                                            <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                                            {ocupado === 'aceptada' ? 'Aceptando…' : 'Aceptar'}
                                        </button>
                                        <button
                                            type="button"
                                            className={BOTON_PELIGRO}
                                            disabled={ocupado !== null}
                                            onClick={() => responder('rechazada')}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                                            {ocupado === 'rechazada' ? 'Rechazando…' : 'Rechazar'}
                                        </button>
                                    </div>
                                ) : (
                                    <p className="flex items-center gap-2 text-xs text-sutil">
                                        Tu invitación:
                                        <span className={clasePillEstado(invitacion.estado)}>{etiquetaInvitacion(invitacion.estado)}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="grid gap-1 border-t border-border/60 pt-3 text-[0.68rem] text-sutil">
                            <span>Creada: {formatearFecha(datos.creadoEn.slice(0, 10)) || '—'}</span>
                            <span>Actualizada: {formatearFecha(datos.actualizadoEn.slice(0, 10)) || '—'}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
