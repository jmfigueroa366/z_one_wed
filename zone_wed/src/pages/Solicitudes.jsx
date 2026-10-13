// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import { useAuth } from '../context/AuthContext.jsx';
import { esAdministrador } from '../config/roles.js';
import { useColaboradores } from '../hooks/useColaboradores.js';
import { useSalas } from '../hooks/useSalas.js';
import { useSolicitudes } from '../hooks/useSolicitudes.js';
import { SolicitudService } from '../services/solicitudService.js';
import { CancionService } from '../services/cancionService.js';
import { etiquetaEstado, etiquetaTipo, estimadoSala } from '../utils/solicitudes.js';
import { formatearFecha, formatearMoneda } from '../utils/helpers.js';
import MisSolicitudes from '../components/MisSolicitudes.jsx';
import { BOTON_PELIGRO, BOTON_PRIMARIO, clasePillEstado } from '../styles/clases.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const BOTON_NEGOCIAR =
    'inline-flex min-h-[40px] items-center justify-center rounded-xl border border-aviso/40 bg-aviso/10 px-4 text-sm font-semibold text-aviso-soft transition hover:bg-aviso/20';

const COLUMNAS = [
    { clave: 'solicitud', titulo: 'Por gestionar', punto: 'bg-aviso', borde: 'border-aviso/40', fondo: 'from-aviso/[0.07]' },
    { clave: 'en_negociacion', titulo: 'En negociación', punto: 'bg-info', borde: 'border-[#9ecbff]/40', fondo: 'from-[#9ecbff]/[0.07]' },
    { clave: 'confirmada', titulo: 'Confirmadas', punto: 'bg-exito', borde: 'border-exito/40', fondo: 'from-exito/[0.07]' },
    { clave: 'cerradas', titulo: 'Cerradas', punto: 'bg-peligro', borde: 'border-peligro/40', fondo: 'from-peligro/[0.07]' },
];

function columnaDe(estado) {
    if (estado === 'solicitud') return 'solicitud';
    if (estado === 'en_negociacion') return 'en_negociacion';
    if (estado === 'confirmada') return 'confirmada';
    return 'cerradas';
}

function BandejaSolicitudes() {
    const [solicitudes] = useSolicitudes();
    const [colaboradores] = useColaboradores();
    const [salas] = useSalas();
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [actualizando, setActualizando] = useState(null);
    const boardRef = useRef(null);

    const canciones = useMemo(() => CancionService.listar(), [solicitudes]);

    const grupos = useMemo(() => {
        const base = { solicitud: [], en_negociacion: [], confirmada: [], cerradas: [] };
        [...solicitudes]
            .sort((a, b) => String(a.fecha ?? '').localeCompare(String(b.fecha ?? '')))
            .forEach((solicitud) => base[columnaDe(solicitud.estado)].push(solicitud));
        return base;
    }, [solicitudes]);

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const board = boardRef.current;
        if (!board) return undefined;
        const animacion = anime({
            targets: board.querySelectorAll('[data-solicitud]'),
            opacity: [0, 1],
            translateY: [16, 0],
            duration: 420,
            delay: anime.stagger(40),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [solicitudes]);

    const obtenerColaborador = (id) =>
        colaboradores.find((colaborador) => String(colaborador.id) === String(id))?.nombre ?? 'Sin colaborador asignado';
    const obtenerSala = (id) => salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';
    const nombreSolicitante = (solicitud) => solicitud.solicitante_nombre ?? obtenerColaborador(solicitud.colaborador_id);
    const nombreCancionDe = (solicitud) => {
        if (!solicitud.cancion_id) return null;
        return canciones.find((cancion) => String(cancion.id) === String(solicitud.cancion_id))?.nombre ?? 'Canción no encontrada';
    };

    const cambiarEstado = (id, estado) => {
        setError('');
        setMensaje('');
        setActualizando(id);
        try {
            const solicitudActualizada = SolicitudService.actualizarEstado(id, estado);
            if (!solicitudActualizada) {
                throw new Error('No se encontró la solicitud. Actualiza la página e inténtalo de nuevo.');
            }
            setMensaje(`Solicitud actualizada: ${etiquetaEstado(estado)}.`);
        } catch (errorActualizacion) {
            setError(errorActualizacion instanceof Error ? errorActualizacion.message : 'No se pudo actualizar la solicitud.');
        } finally {
            setActualizando(null);
        }
    };

    const porGestionar = grupos.solicitud.length + grupos.en_negociacion.length;

    return (
        <main className="workspace-content" data-page="solicitudes">
            <header className="page-heading relative border-l-4 border-accent pl-4">
                <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-24 h-52 w-52 animate-aurora rounded-full bg-[#e34ba6]/15 blur-3xl" />
                <p className="workspace-eyebrow">RESERVAS DEL ESTUDIO</p>
                <h1>Solicitudes</h1>
                <p>Revisa las solicitudes de cabinas y muévelas por el flujo de negociación, confirmación o rechazo.</p>
            </header>

            <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Resumen de solicitudes">
                <article className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#5b418f]/40 to-surface/40 p-4">
                    <span className="text-sm text-sutil">Total de solicitudes</span>
                    <strong className="mt-1 block text-3xl font-black text-texto-soft">{solicitudes.length}</strong>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-aviso/20 to-surface/40 p-4">
                    <span className="text-sm text-sutil">Por gestionar</span>
                    <strong className="mt-1 block text-3xl font-black text-aviso-soft">{porGestionar}</strong>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-exito/20 to-surface/40 p-4">
                    <span className="text-sm text-sutil">Confirmadas</span>
                    <strong className="mt-1 block text-3xl font-black text-exito-soft">{grupos.confirmada.length}</strong>
                </article>
            </section>

            {mensaje && (
                <p className="mt-4 rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">{mensaje}</p>
            )}
            {error && (
                <p className="mt-4 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">{error}</p>
            )}

            <div ref={boardRef} className="mt-6 grid gap-4 lg:grid-cols-4">
                {COLUMNAS.map((columna) => {
                    const items = grupos[columna.clave];
                    return (
                        <section
                            key={columna.clave}
                            className={`flex flex-col rounded-[1.75rem] border ${columna.borde} bg-gradient-to-b ${columna.fondo} to-transparent p-3.5`}
                            aria-label={columna.titulo}
                        >
                            <header className="mb-3 flex items-center justify-between px-1">
                                <span className="flex items-center gap-2 text-sm font-bold text-texto-soft">
                                    <span className={`h-2.5 w-2.5 rounded-full ${columna.punto}`} />
                                    {columna.titulo}
                                </span>
                                <span className="grid h-7 min-w-7 place-items-center rounded-lg bg-white/[0.06] px-2 text-xs font-bold text-sutil">{items.length}</span>
                            </header>

                            <div className="flex flex-1 flex-col gap-3 lg:max-h-[68vh] lg:overflow-y-auto lg:pr-1">
                                {items.length ? (
                                    items.map((solicitud) => {
                                        const sala = salas.find((item) => String(item.id) === String(solicitud.sala_id));
                                        const estimado = estimadoSala(sala, solicitud.franja);
                                        const gestionable = columna.clave === 'solicitud' || columna.clave === 'en_negociacion';
                                        const detalles = [
                                            ['Sala', obtenerSala(solicitud.sala_id)],
                                            ['Tipo', etiquetaTipo(solicitud.tipo)],
                                            ['Horario', solicitud.franja || 'Por coordinar'],
                                        ];
                                        if (nombreCancionDe(solicitud)) detalles.push(['Canción', nombreCancionDe(solicitud)]);
                                        if ((solicitud.partes ?? []).length > 0) detalles.push(['Partes', solicitud.partes.join(', ')]);
                                        if (estimado !== null) detalles.push(['Estimado', formatearMoneda(estimado)]);

                                        return (
                                            <article
                                                key={solicitud.id}
                                                data-solicitud
                                                className="rounded-2xl border border-border bg-surface/80 p-4 transition hover:-translate-y-0.5 hover:border-accent/50"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-[0.66rem] font-bold uppercase tracking-wider text-sutil">
                                                            {formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || 'Fecha pendiente'}
                                                        </p>
                                                        <h3 className="mt-0.5 truncate text-sm font-bold text-texto-soft">{nombreSolicitante(solicitud)}</h3>
                                                    </div>
                                                    <span className={clasePillEstado(solicitud.estado)}>{etiquetaEstado(solicitud.estado)}</span>
                                                </div>

                                                <dl className="mt-3 grid gap-2">
                                                    {detalles.map(([etiqueta, valor]) => (
                                                        <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-1.5 text-sm last:border-0 last:pb-0" key={etiqueta}>
                                                            <dt className="shrink-0 text-xs text-sutil">{etiqueta}</dt>
                                                            <dd className="min-w-0 truncate text-right text-xs font-medium text-texto">{valor}</dd>
                                                        </div>
                                                    ))}
                                                </dl>

                                                {gestionable && (
                                                    <div className="mt-4 flex flex-wrap gap-2" aria-label={`Acciones para solicitud de ${nombreSolicitante(solicitud)}`}>
                                                        <button
                                                            className={`${BOTON_PRIMARIO} min-h-[36px] flex-1`}
                                                            disabled={actualizando === solicitud.id}
                                                            onClick={() => cambiarEstado(solicitud.id, 'confirmada')}
                                                            type="button"
                                                        >
                                                            Confirmar
                                                        </button>
                                                        <button
                                                            className={BOTON_PELIGRO}
                                                            disabled={actualizando === solicitud.id}
                                                            onClick={() => cambiarEstado(solicitud.id, 'rechazada')}
                                                            type="button"
                                                        >
                                                            Rechazar
                                                        </button>
                                                        {columna.clave === 'solicitud' && (
                                                            <button
                                                                className={`${BOTON_NEGOCIAR} min-h-[36px] w-full`}
                                                                disabled={actualizando === solicitud.id}
                                                                onClick={() => cambiarEstado(solicitud.id, 'en_negociacion')}
                                                                type="button"
                                                            >
                                                                Enviar a negociación
                                                            </button>
                                                        )}
                                                    </div>
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
