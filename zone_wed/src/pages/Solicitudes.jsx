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
import '../styles/solicitudes.css';

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
        <main className="workspace-content operations-page" data-page="solicitudes">
            <header className="page-heading operations-heading">
                <p className="workspace-eyebrow">RESERVAS DEL ESTUDIO</p>
                <h1>Solicitudes</h1>
                <p>Revisa las solicitudes de cabinas y gestiona su negociación, confirmación o rechazo.</p>
            </header>

            <section className="operations-summary" aria-label="Resumen de solicitudes">
                <article><span>Total de solicitudes</span><strong>{solicitudes.length}</strong></article>
                <article><span>Por gestionar</span><strong>{solicitudes.filter((item) => ['solicitud', 'en_negociacion'].includes(item.estado)).length}</strong></article>
                <article><span>Confirmadas</span><strong>{solicitudes.filter((item) => item.estado === 'confirmada').length}</strong></article>
            </section>

            {mensaje && <p className="operations-feedback" role="status">{mensaje}</p>}
            {error && <p className="operations-feedback operations-feedback-error" role="alert">{error}</p>}

            <section className="operations-panel" aria-labelledby="requests-list-title">
                <div className="operations-panel-heading">
                    <div>
                        <p className="workspace-eyebrow">BANDEJA DE SOLICITUDES</p>
                        <h2 id="requests-list-title">Reservas recibidas</h2>
                    </div>
                </div>

                <div className="operations-filters" aria-label="Filtrar solicitudes">
                    {[
                        ['abiertas', 'Por gestionar'],
                        ['todas', 'Todas'],
                        ['confirmada', 'Confirmadas'],
                        ['rechazada', 'Rechazadas'],
                        ['expirada', 'Expiradas'],
                    ].map(([estado, etiqueta]) => (
                        <button
                            className={filtroEstado === estado ? 'operations-filter is-active' : 'operations-filter'}
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            type="button"
                        >
                            {etiqueta}
                        </button>
                    ))}
                </div>

                {solicitudesFiltradas.length ? (
                    <div className="request-list">
                        {solicitudesFiltradas.map((solicitud) => {
                            const sala = salas.find((item) => String(item.id) === String(solicitud.sala_id));
                            const estimado = estimadoSala(sala, solicitud.franja);
                            const puedeGestionar = ['solicitud', 'en_negociacion'].includes(solicitud.estado);

                            return (
                                <article className="request-card" key={solicitud.id}>
                                    <div className="request-card-main">
                                        <div className="request-card-heading">
                                            <div>
                                                <p className="workspace-eyebrow">{formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || 'Fecha pendiente'}</p>
                                                <h3>{nombreSolicitante(solicitud)}</h3>
                                            </div>
                                            <span className={`operations-status status-${solicitud.estado}`}>
                                                {etiquetaEstado(solicitud.estado)}
                                            </span>
                                        </div>
                                        <div className="request-details">
                                            <span><strong>Sala</strong>{obtenerSala(solicitud.sala_id)}</span>
                                            <span><strong>Tipo</strong>{etiquetaTipo(solicitud.tipo)}</span>
                                            <span><strong>Horario</strong>{solicitud.franja || 'Por coordinar'}</span>
                                            {nombreCancionDe(solicitud) && (
                                                <span><strong>Canción</strong>{nombreCancionDe(solicitud)}</span>
                                            )}
                                            {(solicitud.partes ?? []).length > 0 && (
                                                <span><strong>Partes</strong>{solicitud.partes.join(', ')}</span>
                                            )}
                                            {estimado !== null && (
                                                <span><strong>Estimado de sala</strong>{formatearMoneda(estimado)}</span>
                                            )}
                                        </div>
                                        {puedeGestionar && (
                                            <div className="request-actions" aria-label={`Acciones para solicitud de ${nombreSolicitante(solicitud)}`}>
                                                <button
                                                    className="request-action request-action-primary"
                                                    disabled={actualizando === solicitud.id}
                                                    onClick={() => cambiarEstado(solicitud.id, 'confirmada')}
                                                    type="button"
                                                >
                                                    Confirmar
                                                </button>
                                                {solicitud.estado === 'solicitud' && (
                                                    <button
                                                        className="request-action"
                                                        disabled={actualizando === solicitud.id}
                                                        onClick={() => cambiarEstado(solicitud.id, 'en_negociacion')}
                                                        type="button"
                                                    >
                                                        Enviar a negociación
                                                    </button>
                                                )}
                                                <button
                                                    className="request-action request-action-danger"
                                                    disabled={actualizando === solicitud.id}
                                                    onClick={() => cambiarEstado(solicitud.id, 'rechazada')}
                                                    type="button"
                                                >
                                                    Rechazar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="operations-empty">No hay solicitudes en esta categoría.</p>
                )}
            </section>
        </main>
    );
}

export default function Solicitudes() {
    const { usuario } = useAuth();

    return esAdministrador(usuario) ? <BandejaSolicitudes /> : <MisSolicitudes />;
}