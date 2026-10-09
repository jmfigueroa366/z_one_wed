// CAPA: Presentación
import { useMemo, useState } from 'react';
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
import { BOTON_PELIGRO, BOTON_PRIMARIO, clasePillEstado, TARJETA_RESUMEN } from '../styles/clases.js';
import '../styles/tailwind.css';

const FILTRO_BASE = 'rounded-full border px-3.5 py-2 text-xs font-semibold transition';
const FILTRO_ACTIVO = `${FILTRO_BASE} border-accent/60 bg-accent/20 text-white`;
const FILTRO_INACTIVO = `${FILTRO_BASE} border-border bg-white/[0.035] text-sutil hover:text-texto`;
const BOTON_NEGOCIAR =
    'inline-flex min-h-[40px] items-center justify-center rounded-xl border border-aviso/40 bg-aviso/10 px-4 text-sm font-semibold text-aviso-soft transition hover:bg-aviso/20';

function BandejaSolicitudes() {
    const [solicitudes] = useSolicitudes();
    const [colaboradores] = useColaboradores();
    const [salas] = useSalas();
    const [filtroEstado, setFiltroEstado] = useState('abiertas');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [actualizando, setActualizando] = useState(null);

    const canciones = useMemo(() => CancionService.listar(), [solicitudes]);

    const solicitudesFiltradas = useMemo(() => [...solicitudes]
        .filter((solicitud) => {
            if (filtroEstado === 'abiertas') return ['solicitud', 'en_negociacion'].includes(solicitud.estado);
            return filtroEstado === 'todas' || solicitud.estado === filtroEstado;
        })
        .sort((a, b) => String(a.fecha ?? '').localeCompare(String(b.fecha ?? ''))),
    [solicitudes, filtroEstado]);

    const obtenerColaborador = (id) =>
        colaboradores.find((colaborador) => String(colaborador.id) === String(id))?.nombre ?? 'Sin colaborador asignado';

    const obtenerSala = (id) =>
        salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';

    const nombreSolicitante = (solicitud) =>
        solicitud.solicitante_nombre ?? obtenerColaborador(solicitud.colaborador_id);

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

    return (
        <main className="workspace-content" data-page="solicitudes">
            <header className="page-heading border-l-4 border-accent pl-4">
                <p className="workspace-eyebrow">RESERVAS DEL ESTUDIO</p>
                <h1>Solicitudes</h1>
                <p>Revisa las solicitudes de cabinas y gestiona su negociación, confirmación o rechazo.</p>
            </header>

            <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Resumen de solicitudes">
                <article className={TARJETA_RESUMEN}><span className="text-sm text-sutil">Total de solicitudes</span><strong className="text-2xl font-black text-texto-soft">{solicitudes.length}</strong></article>
                <article className={TARJETA_RESUMEN}><span className="text-sm text-sutil">Por gestionar</span><strong className="text-2xl font-black text-aviso-soft">{solicitudes.filter((item) => ['solicitud', 'en_negociacion'].includes(item.estado)).length}</strong></article>
                <article className={TARJETA_RESUMEN}><span className="text-sm text-sutil">Confirmadas</span><strong className="text-2xl font-black text-exito-soft">{solicitudes.filter((item) => item.estado === 'confirmada').length}</strong></article>
            </section>

            {mensaje && (
                <p className="mt-4 rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">{mensaje}</p>
            )}
            {error && (
                <p className="mt-4 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">{error}</p>
            )}

            <section className="mt-6 rounded-3xl border border-border bg-surface/70 p-6" aria-labelledby="requests-list-title">
                <div>
                    <p className="workspace-eyebrow">BANDEJA DE SOLICITUDES</p>
                    <h2 id="requests-list-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                        Reservas recibidas
                    </h2>
                </div>

                <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar solicitudes">
                    {[
                        ['abiertas', 'Por gestionar'],
                        ['todas', 'Todas'],
                        ['confirmada', 'Confirmadas'],
                        ['rechazada', 'Rechazadas'],
                        ['expirada', 'Expiradas'],
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
                </div>

                {solicitudesFiltradas.length ? (
                    <div className="mt-5 grid gap-4">
                        {solicitudesFiltradas.map((solicitud) => {
                            const sala = salas.find((item) => String(item.id) === String(solicitud.sala_id));
                            const estimado = estimadoSala(sala, solicitud.franja);
                            const puedeGestionar = ['solicitud', 'en_negociacion'].includes(solicitud.estado);
                            const detalles = [
                                ['Sala', obtenerSala(solicitud.sala_id)],
                                ['Tipo', etiquetaTipo(solicitud.tipo)],
                                ['Horario', solicitud.franja || 'Por coordinar'],
                            ];
                            if (nombreCancionDe(solicitud)) detalles.push(['Canción', nombreCancionDe(solicitud)]);
                            if ((solicitud.partes ?? []).length > 0) detalles.push(['Partes', solicitud.partes.join(', ')]);
                            if (estimado !== null) detalles.push(['Estimado de sala', formatearMoneda(estimado)]);

                            return (
                                <article className="rounded-2xl border border-border bg-white/[0.02] p-5" key={solicitud.id}>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="workspace-eyebrow">{formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || 'Fecha pendiente'}</p>
                                            <h3 className="mt-1 text-lg font-bold text-texto-soft">{nombreSolicitante(solicitud)}</h3>
                                        </div>
                                        <span className={clasePillEstado(solicitud.estado)}>
                                            {etiquetaEstado(solicitud.estado)}
                                        </span>
                                    </div>

                                    <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {detalles.map(([etiqueta, valor]) => (
                                            <div className="grid gap-0.5" key={etiqueta}>
                                                <dt className="text-xs font-bold uppercase tracking-wider text-sutil">{etiqueta}</dt>
                                                <dd className="text-sm text-texto">{valor}</dd>
                                            </div>
                                        ))}
                                    </dl>

                                    {puedeGestionar && (
                                        <div className="mt-5 flex flex-wrap gap-2" aria-label={`Acciones para solicitud de ${nombreSolicitante(solicitud)}`}>
                                            <button
                                                className={`${BOTON_PRIMARIO} min-h-[40px]`}
                                                disabled={actualizando === solicitud.id}
                                                onClick={() => cambiarEstado(solicitud.id, 'confirmada')}
                                                type="button"
                                            >
                                                Confirmar
                                            </button>
                                            {solicitud.estado === 'solicitud' && (
                                                <button
                                                    className={BOTON_NEGOCIAR}
                                                    disabled={actualizando === solicitud.id}
                                                    onClick={() => cambiarEstado(solicitud.id, 'en_negociacion')}
                                                    type="button"
                                                >
                                                    Enviar a negociación
                                                </button>
                                            )}
                                            <button
                                                className={BOTON_PELIGRO}
                                                disabled={actualizando === solicitud.id}
                                                onClick={() => cambiarEstado(solicitud.id, 'rechazada')}
                                                type="button"
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="py-4 text-center text-sutil">No hay solicitudes en esta categoría.</p>
                )}
            </section>
        </main>
    );
}

export default function Solicitudes() {
    const { usuario } = useAuth();

    return esAdministrador(usuario) ? <BandejaSolicitudes /> : <MisSolicitudes />;
}
