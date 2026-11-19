// CAPA: Presentación
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import anime from 'animejs';
import {
    Check,
    Clock,
    Coins,
    Hourglass,
    Sparkles,
    ThumbsUp,
    Users,
    Wallet,
    X,
    XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { esAdministrador } from '../config/roles.ts';
import { useApi } from '../hooks/useApi.ts';
import { cambiarEstadoSolicitud, listarSolicitudes, obtenerSolicitud } from '../api/solicitudesApi.ts';
import { adaptarSolicitud, adaptarSolicitudResumen } from '../api/adapters.ts';
import { etiquetaEstado, etiquetaInvitacion, etiquetaTipo } from '../utils/solicitudes.ts';
import type { Solicitud } from '../models/Solicitud.ts';
import { formatearFecha } from '../utils/helpers.ts';
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
    { clave: 'solicitada', titulo: 'Por aprobar', icono: Hourglass, punto: 'bg-aviso', borde: 'border-aviso/40', fondo: 'from-aviso/[0.09]', brillo: 'from-aviso/70', texto: 'text-aviso-soft' },
    { clave: 'por_autorizar', titulo: 'Esperando equipo', icono: Sparkles, punto: 'bg-accent', borde: 'border-accent/40', fondo: 'from-accent/[0.09]', brillo: 'from-accent/70', texto: 'text-accent-soft' },
    { clave: 'por_pagar', titulo: 'Por pagar', icono: Wallet, punto: 'bg-magenta', borde: 'border-magenta/40', fondo: 'from-magenta/[0.09]', brillo: 'from-magenta/70', texto: 'text-magenta' },
    { clave: 'confirmada', titulo: 'Confirmadas', icono: ThumbsUp, punto: 'bg-exito', borde: 'border-exito/40', fondo: 'from-exito/[0.09]', brillo: 'from-exito/70', texto: 'text-exito-soft' },
    { clave: 'rechazada', titulo: 'Rechazadas', icono: XCircle, punto: 'bg-peligro', borde: 'border-peligro/40', fondo: 'from-peligro/[0.09]', brillo: 'from-peligro/70', texto: 'text-peligro-soft' },
    { clave: 'cancelada', titulo: 'Canceladas', icono: XCircle, punto: 'bg-sutil', borde: 'border-border', fondo: 'from-white/[0.04]', brillo: 'from-white/40', texto: 'text-sutil' },
];

const FILTROS = [
    { clave: 'todas', titulo: 'Todas' },
    ...COLUMNAS.map((columna) => ({ clave: columna.clave, titulo: columna.titulo })),
];

const PASOS_FLUJO = ['Cliente pide', 'Tú apruebas', 'Equipo acepta', 'Cliente paga', 'Reserva confirmada'];

function pasoActual(estado: string): number {
    if (estado === 'solicitada') return 1;
    if (estado === 'por_autorizar') return 2;
    if (estado === 'por_pagar') return 3;
    if (estado === 'confirmada') return 4;
    return 0;
}

const TONOS_AVATAR = ['bg-secundario'];

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
    const boardRef = useRef<HTMLDivElement>(null);
    const [filtro, setFiltro] = useState<string>('todas');
    const [detalleId, setDetalleId] = useState<number | null>(null);
    const [ocupado, setOcupado] = useState<{ id: number; accion: 'aprobar' | 'rechazar' } | null>(null);
    const [mensaje, setMensaje] = useState('');
    const [errorAccion, setErrorAccion] = useState('');
    const { datos, error, cargando, recargar } = useApi(listarSolicitudes);

    const solicitudes = useMemo(
        () => (datos?.items ?? []).map(adaptarSolicitudResumen),
        [datos]
    );
    const salasPorId = useMemo(() => {
        const mapa = new Map<number, string | null>();
        (datos?.items ?? []).forEach((dto) => {
            if (dto.salaId != null) mapa.set(dto.salaId, dto.sala);
        });
        return mapa;
    }, [datos]);

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
    const obtenerSala = (id: number | string | null): string => salasPorId.get(Number(id)) ?? 'Sala no disponible';

    const abrirDetalle = (solicitud: Solicitud) => {
        if (solicitud.id == null) return;
        setDetalleId(Number(solicitud.id));
    };

    const cambiarEstado = async (solicitud: Solicitud, nuevo: 'por_autorizar' | 'rechazada') => {
        if (solicitud.id == null) return;
        const id = Number(solicitud.id);
        const accion = nuevo === 'por_autorizar' ? 'aprobar' : 'rechazar';
        setOcupado({ id, accion });
        setMensaje('');
        setErrorAccion('');
        try {
            await cambiarEstadoSolicitud(id, nuevo);
            setMensaje(accion === 'aprobar'
                ? 'Solicitud aprobada. Ahora espera la respuesta del equipo.'
                : 'Solicitud rechazada.');
            recargar();
        } catch (errorCambio) {
            setErrorAccion(errorCambio instanceof Error ? errorCambio.message : 'No se pudo cambiar el estado de la solicitud.');
        } finally {
            setOcupado(null);
        }
    };

    const porResponder = grupos.solicitada.length;
    const porAutorizar = grupos.por_autorizar.length;

    return (
        <main className="workspace-content" data-page="solicitudes">
            <header className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-surface-2/80 via-surface/60 to-surface/20 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-10 h-64 w-64 animate-aurora rounded-full bg-accent-soft/20 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-10 h-56 w-56 animate-aurora rounded-full bg-accent/20 blur-3xl" />
                <div className="relative">
                    <p className="workspace-eyebrow">RESERVAS DEL ESTUDIO</p>
                    <h1 className="mt-1 text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-[-0.04em]">
                        Solicitudes <span className="texto-degradado">del estudio</span>
                    </h1>
                    <p className="mt-2 max-w-2xl leading-relaxed text-sutil">
                        Cliente pide → tú apruebas → equipo acepta → cliente paga
                    </p>

                    {/* Flujo visual: explica el recorrido de una solicitud */}
                    <ol className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-sutil" aria-label="Flujo de una solicitud">
                        {PASOS_FLUJO.map((paso, indice, arreglo) => (
                            <li key={paso} className="flex items-center gap-2">
                                <span className="group flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 font-semibold text-texto-soft transition hover:border-accent/50 hover:bg-accent/10">
                                    <span className="grid h-5 w-5 place-items-center rounded-full bg-secundario text-[0.62rem] font-black text-texto shadow-sm shadow-secundario/30">{indice + 1}</span>
                                    {paso}
                                </span>
                                {indice < arreglo.length - 1 && <span aria-hidden="true" className="text-accent/50">→</span>}
                            </li>
                        ))}
                    </ol>
                </div>
            </header>

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

            {mensaje && (
                <p className="mt-5 rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">{mensaje}</p>
            )}

            {errorAccion && (
                <p className="mt-5 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">{errorAccion}</p>
            )}

            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen de solicitudes">
                <KpiSolicitudes icono={Sparkles} etiqueta="Total de solicitudes" valor={solicitudes.length} degradado="from-secundario/30 to-surface/30" acento="text-accent-soft" />
                <KpiSolicitudes icono={Hourglass} etiqueta="Por aprobar" valor={porResponder} degradado="from-aviso/25 to-surface/30" acento="text-aviso-soft" />
                <KpiSolicitudes icono={ThumbsUp} etiqueta="Esperando equipo" valor={porAutorizar} degradado="from-accent/25 to-surface/30" acento="text-accent-soft" />
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
                                    ? 'border-primario bg-primario text-texto shadow-sm shadow-primario/20'
                                    : 'border-border bg-white/[0.03] text-sutil hover:border-accent/40 hover:text-texto'
                            }`}
                        >
                            {opcion.titulo}
                            <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.62rem] ${activo ? 'bg-accent/25 text-accent-soft' : 'bg-white/[0.08]'}`}>{cantidad}</span>
                        </button>
                    );
                })}
            </div>

            {cargando ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Cargando solicitudes">
                    {[0, 1, 2, 3].map((indice) => (
                        <div key={indice} className="animate-pulse rounded-2xl border border-border bg-surface/60 p-4">
                            <div className="h-4 w-2/3 rounded bg-white/10" />
                            <div className="mt-3 h-3 w-1/2 rounded bg-white/[0.06]" />
                            <div className="mt-4 h-14 rounded-xl bg-white/[0.06]" />
                        </div>
                    ))}
                </div>
            ) : datos ? (
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
                                        return (
                                            <article
                                                key={solicitud.id}
                                                data-solicitud
                                                data-estado={solicitud.estado}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => abrirDetalle(solicitud)}
                                                onKeyDown={(evento) => {
                                                    if (evento.key === 'Enter' || evento.key === ' ') {
                                                        evento.preventDefault();
                                                        abrirDetalle(solicitud);
                                                    }
                                                }}
                                                className="tarjeta-brillo group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface/85 p-4 text-left shadow-sm shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent/60"
                                            >
                                                <span className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${columna.brillo} to-transparent`} aria-hidden="true" />
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tonoAvatar(nombreSolicitante(solicitud))} text-sm font-black text-texto shadow-md shadow-black/30`} aria-hidden="true">
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
                                                </div>

                                                {solicitud.estado === 'por_pagar' && (
                                                    <p className="mt-3 flex items-center gap-2 rounded-xl border border-magenta/30 bg-magenta/[0.08] px-3 py-2 text-xs text-magenta">
                                                        <Coins className="h-3.5 w-3.5 shrink-0 animate-glow" aria-hidden="true" />
                                                        Anticipo emitido. Esperando el pago del cliente.
                                                    </p>
                                                )}

                                                {solicitud.estado === 'solicitada' && (
                                                    <div
                                                        className="mt-3 flex flex-wrap gap-2"
                                                        onKeyDown={(evento) => evento.stopPropagation()}
                                                    >
                                                        <button
                                                            type="button"
                                                            className={BOTON_PRIMARIO}
                                                            disabled={ocupado !== null}
                                                            onClick={(evento) => {
                                                                evento.stopPropagation();
                                                                cambiarEstado(solicitud, 'por_autorizar');
                                                            }}
                                                        >
                                                            <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                                                            {ocupado?.id === Number(solicitud.id) && ocupado.accion === 'aprobar' ? 'Aprobando…' : 'Aprobar'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={BOTON_PELIGRO}
                                                            disabled={ocupado !== null}
                                                            onClick={(evento) => {
                                                                evento.stopPropagation();
                                                                cambiarEstado(solicitud, 'rechazada');
                                                            }}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                                                            {ocupado?.id === Number(solicitud.id) && ocupado.accion === 'rechazar' ? 'Rechazando…' : 'Rechazar'}
                                                        </button>
                                                    </div>
                                                )}

                                                <span className="mt-3 flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-accent-soft opacity-70 transition group-hover:opacity-100">
                                                    Ver detalle →
                                                </span>
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
            ) : null}

            {detalleId != null && (
                <DetalleSolicitud id={detalleId} onCerrar={() => setDetalleId(null)} />
            )}
        </main>
    );
}

function DetalleSolicitud({ id, onCerrar }: { id: number; onCerrar: () => void }) {
    const cargar = useCallback(() => obtenerSolicitud(id), [id]);
    const { datos, error, cargando, recargar } = useApi(cargar);
    const solicitud = useMemo(() => (datos ? adaptarSolicitud(datos) : null), [datos]);

    useEffect(() => {
        const cerrarConEscape = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') onCerrar();
        };
        window.addEventListener('keydown', cerrarConEscape);
        return () => window.removeEventListener('keydown', cerrarConEscape);
    }, [onCerrar]);

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

export default function Solicitudes() {
    const { usuario } = useAuth();

    return esAdministrador(usuario) ? <BandejaSolicitudes /> : <MisSolicitudes />;
}