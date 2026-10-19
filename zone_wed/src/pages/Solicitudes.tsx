// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import { Check, Coins, Music, Sparkles, Users, XCircle } from 'lucide-react';
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

const COLUMNAS = [
    { clave: 'solicitada', titulo: 'Esperando respuestas', punto: 'bg-aviso', borde: 'border-aviso/40', fondo: 'from-aviso/[0.07]' },
    { clave: 'por_autorizar', titulo: 'Por autorizar', punto: 'bg-accent', borde: 'border-accent/40', fondo: 'from-accent/[0.07]' },
    { clave: 'por_pagar', titulo: 'Por pagar', punto: 'bg-magenta', borde: 'border-magenta/40', fondo: 'from-magenta/[0.07]' },
    { clave: 'confirmada', titulo: 'Confirmadas', punto: 'bg-exito', borde: 'border-exito/40', fondo: 'from-exito/[0.07]' },
    { clave: 'rechazada', titulo: 'Rechazadas', punto: 'bg-peligro', borde: 'border-peligro/40', fondo: 'from-peligro/[0.07]' },
    { clave: 'cancelada', titulo: 'Canceladas', punto: 'bg-sutil', borde: 'border-border', fondo: 'from-white/[0.03]' },
];

const FILTROS = [
    { clave: 'todas', titulo: 'Todas' },
    ...COLUMNAS.map((columna) => ({ clave: columna.clave, titulo: columna.titulo })),
];

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
            <header className="page-heading relative border-l-4 border-accent pl-4">
                <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-24 h-52 w-52 animate-aurora rounded-full bg-[#e34ba6]/15 blur-3xl" />
                <p className="workspace-eyebrow">RESERVAS DEL ESTUDIO</p>
                <h1>Solicitudes</h1>
                <p>El cliente pide, el equipo acepta, tú autorizas y el cliente paga el anticipo para confirmar la reserva.</p>
            </header>

            {mensaje && <p className="mt-5 rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">{mensaje}</p>}
            {error && <p className="mt-5 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">{error}</p>}

            {/* Flujo visual: explica el recorrido de una solicitud */}
            <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-sutil" aria-label="Flujo de una solicitud">
                {['Cliente pide', 'Equipo acepta', 'Tú autorizas', 'Cliente paga', 'Reserva confirmada'].map((paso, indice, arreglo) => (
                    <li key={paso} className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1.5 font-semibold text-texto-soft">
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/20 text-[0.62rem] font-black text-accent-soft">{indice + 1}</span>
                            {paso}
                        </span>
                        {indice < arreglo.length - 1 && <span aria-hidden="true" className="text-accent/50">→</span>}
                    </li>
                ))}
            </ol>

            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen de solicitudes">
                <article className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#5b418f]/40 to-surface/40 p-4">
                    <span className="text-sm text-sutil">Total de solicitudes</span>
                    <strong className="mt-1 block text-3xl font-black text-texto-soft"><Contador valor={solicitudes.length} pad={2} /></strong>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-aviso/20 to-surface/40 p-4">
                    <span className="text-sm text-sutil">Esperando respuestas</span>
                    <strong className="mt-1 block text-3xl font-black text-aviso-soft"><Contador valor={porResponder} pad={2} /></strong>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent/20 to-surface/40 p-4">
                    <span className="text-sm text-sutil">Por autorizar</span>
                    <strong className="mt-1 block text-3xl font-black text-accent-soft"><Contador valor={porAutorizar} pad={2} /></strong>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-exito/20 to-surface/40 p-4">
                    <span className="text-sm text-sutil">Confirmadas</span>
                    <strong className="mt-1 block text-3xl font-black text-exito-soft"><Contador valor={grupos.confirmada.length} pad={2} /></strong>
                </article>
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
                                    ? 'border-accent/60 bg-accent/15 text-accent-soft'
                                    : 'border-border bg-white/[0.03] text-sutil hover:border-accent/40 hover:text-texto'
                            }`}
                        >
                            {opcion.titulo}
                            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white/[0.08] px-1.5 text-[0.62rem]">{cantidad}</span>
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
                            className={`flex w-[340px] shrink-0 flex-col rounded-[1.75rem] border ${columna.borde} bg-gradient-to-b ${columna.fondo} to-transparent p-3.5`}
                            aria-label={columna.titulo}
                        >
                            <header className="mb-3 flex items-center justify-between px-1">
                                <span className="flex items-center gap-2 text-sm font-bold text-texto-soft">
                                    <span className={`h-2.5 w-2.5 rounded-full ${columna.punto}`} />
                                    {columna.titulo}
                                </span>
                                <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-white/[0.06] px-2 text-xs font-bold text-sutil">{items.length}</span>
                            </header>

                            <div className="flex max-h-[68vh] min-h-[120px] flex-1 flex-col gap-3 overflow-y-auto pr-1">
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
                                                className="group rounded-2xl border border-border bg-surface/80 p-4 shadow-sm shadow-black/20 transition duration-300 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-wider text-sutil">
                                                            <Sparkles className="h-3 w-3 text-accent-soft" aria-hidden="true" />
                                                            {formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || 'Fecha pendiente'}
                                                        </p>
                                                        <h3 className="mt-1 truncate text-sm font-bold text-texto-soft">{solicitud.titulo || etiquetaTipo(solicitud.tipo)}</h3>
                                                        <p className="mt-0.5 truncate text-xs text-sutil">
                                                            <span className="font-semibold text-texto">{nombreSolicitante(solicitud)}</span> · {etiquetaTipo(solicitud.tipo)}
                                                        </p>
                                                    </div>
                                                    <span className={clasePillEstado(solicitud.estado)}>{etiquetaEstado(solicitud.estado)}</span>
                                                </div>

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
                                                    {estimado !== null && (
                                                        <p className="flex items-center gap-2 text-sutil">
                                                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-accent-soft" aria-hidden="true">
                                                                <Coins className="h-3.5 w-3.5" />
                                                            </span>
                                                            <span className="truncate">Estimado <strong className="font-bold text-texto-soft">{formatearMoneda(estimado)}</strong></span>
                                                        </p>
                                                    )}
                                                </div>

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
                                                            className={`${BOTON_PRIMARIO} flex-1`}
                                                            disabled={ocupado === solicitud.id}
                                                            onClick={() => autorizar(solicitud)}
                                                            type="button"
                                                        >
                                                            <Check className="mr-2 h-4 w-4" aria-hidden="true" /> Autorizar
                                                        </button>
                                                        <button
                                                            className={BOTON_PELIGRO}
                                                            disabled={ocupado === solicitud.id}
                                                            onClick={() => rechazar(solicitud)}
                                                            type="button"
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Rechazar
                                                        </button>
                                                    </div>
                                                )}

                                                {solicitud.estado === 'por_pagar' && (
                                                    <p className="mt-3 flex items-center gap-2 rounded-xl border border-magenta/30 bg-magenta/[0.08] px-3 py-2 text-xs text-magenta">
                                                        <Coins className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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