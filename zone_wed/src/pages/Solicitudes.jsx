// CAPA: Presentación
import { useEffect, useMemo, useRef } from 'react';
import anime from 'animejs';
import { useAuth } from '../context/AuthContext.jsx';
import { esAdministrador } from '../config/roles.js';
import { useColaboradores } from '../hooks/useColaboradores.js';
import { useSalas } from '../hooks/useSalas.js';
import { useSolicitudes } from '../hooks/useSolicitudes.js';
import { CancionService } from '../services/cancionService.js';
import { etiquetaEstado, etiquetaInvitacion, etiquetaTipo, estimadoSala } from '../utils/solicitudes.js';
import { formatearFecha, formatearMoneda } from '../utils/helpers.js';
import MisSolicitudes from '../components/MisSolicitudes.jsx';
import { clasePillEstado } from '../styles/clases.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const COLUMNAS = [
    { clave: 'solicitada', titulo: 'Esperando respuestas', punto: 'bg-aviso', borde: 'border-aviso/40', fondo: 'from-aviso/[0.07]' },
    { clave: 'confirmada', titulo: 'Confirmadas', punto: 'bg-exito', borde: 'border-exito/40', fondo: 'from-exito/[0.07]' },
    { clave: 'rechazada', titulo: 'Rechazadas', punto: 'bg-peligro', borde: 'border-peligro/40', fondo: 'from-peligro/[0.07]' },
    { clave: 'cancelada', titulo: 'Canceladas', punto: 'bg-sutil', borde: 'border-border', fondo: 'from-white/[0.03]' },
];

function BandejaSolicitudes() {
    const [solicitudes] = useSolicitudes();
    const [colaboradores] = useColaboradores();
    const [salas] = useSalas();
    const boardRef = useRef(null);

    const canciones = useMemo(() => CancionService.listar(), [solicitudes]);

    const grupos = useMemo(() => {
        const base = { solicitada: [], confirmada: [], rechazada: [], cancelada: [] };
        [...solicitudes]
            .sort((a, b) => String(b.fecha_solicitud ?? b.fecha ?? '').localeCompare(String(a.fecha_solicitud ?? a.fecha ?? '')))
            .forEach((solicitud) => {
                const clave = base[solicitud.estado] ? solicitud.estado : 'cancelada';
                base[clave].push(solicitud);
            });
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

    const nombreSolicitante = (solicitud) => solicitud.solicitante_nombre ?? 'Cliente';
    const nombreColaborador = (id) =>
        colaboradores.find((colaborador) => String(colaborador.id) === String(id))?.nombre ?? `Colaborador #${id}`;
    const obtenerSala = (id) => salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';
    const nombreCancionDe = (solicitud) => {
        if (!solicitud.cancion_id) return null;
        return canciones.find((cancion) => String(cancion.id) === String(solicitud.cancion_id))?.nombre ?? 'Canción no encontrada';
    };

    const porResponder = grupos.solicitada.length;

    return (
        <main className="workspace-content" data-page="solicitudes">
            <header className="page-heading relative border-l-4 border-accent pl-4">
                <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-24 h-52 w-52 animate-aurora rounded-full bg-[#e34ba6]/15 blur-3xl" />
                <p className="workspace-eyebrow">RESERVAS DEL ESTUDIO</p>
                <h1>Solicitudes</h1>
                <p>Sigue el pulso de cada solicitud. El estado se confirma solo cuando todos los artistas y productores invitados aceptan.</p>
            </header>

            <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Resumen de solicitudes">
                <article className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#5b418f]/40 to-surface/40 p-4">
                    <span className="text-sm text-sutil">Total de solicitudes</span>
                    <strong className="mt-1 block text-3xl font-black text-texto-soft">{solicitudes.length}</strong>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-aviso/20 to-surface/40 p-4">
                    <span className="text-sm text-sutil">Esperando respuestas</span>
                    <strong className="mt-1 block text-3xl font-black text-aviso-soft">{porResponder}</strong>
                </article>
                <article className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-exito/20 to-surface/40 p-4">
                    <span className="text-sm text-sutil">Confirmadas</span>
                    <strong className="mt-1 block text-3xl font-black text-exito-soft">{grupos.confirmada.length}</strong>
                </article>
            </section>

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
                                        const detalles = [
                                            ['Solicitante', nombreSolicitante(solicitud)],
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
                                                        <h3 className="mt-0.5 truncate text-sm font-bold text-texto-soft">{solicitud.titulo || etiquetaTipo(solicitud.tipo)}</h3>
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

                                                {(solicitud.colaboradores ?? []).length > 0 && (
                                                    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`Colaboradores de ${solicitud.titulo || etiquetaTipo(solicitud.tipo)}`}>
                                                        {(solicitud.colaboradores ?? []).map((invitacion) => (
                                                            <li key={`${solicitud.id}-${invitacion.colaborador_id}`} className={clasePillEstado(invitacion.estado)}>
                                                                {nombreColaborador(invitacion.colaborador_id)} · {etiquetaInvitacion(invitacion.estado)}
                                                            </li>
                                                        ))}
                                                    </ul>
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