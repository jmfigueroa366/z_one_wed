// CAPA: Presentación
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useColaboradores } from '../hooks/useColaboradores.js';
import { useSalas } from '../hooks/useSalas.js';
import { useSolicitudes } from '../hooks/useSolicitudes.js';
import { useProyectos } from '../hooks/useProyectos.js';
import { useCancionesDeUsuario } from '../hooks/useCanciones.js';
import { SolicitudService } from '../services/solicitudService.js';
import { TIPOS_SOLICITUD } from '../models/Solicitud.js';
import { etiquetaEstado, etiquetaTipo, estimadoSala } from '../utils/solicitudes.js';
import { formatearFecha, formatearMoneda } from '../utils/helpers.js';
import '../styles/tailwind.css';
import '../styles/solicitudes.css';

const FORM_INICIAL = {
    tipo: TIPOS_SOLICITUD.GRABACION,
    sala_id: '',
    fecha: '',
    hora_inicio: '09:00',
    hora_fin: '12:00',
    cancion_id: '',
};

function aMinutos(hora) {
    const partes = String(hora ?? '').split(':');
    if (partes.length < 2) return NaN;
    return Number(partes[0]) * 60 + Number(partes[1]);
}

const estilos = {
    campo: 'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-texto outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40',
    etiqueta: 'mb-1 block text-xs font-semibold uppercase tracking-wider text-sutil',
    parteActiva: 'rounded-full border border-accent bg-accent/20 px-3 py-1 text-sm font-medium text-texto transition',
    parteInactiva: 'rounded-full border border-border bg-surface-2 px-3 py-1 text-sm text-sutil transition hover:border-accent/50 hover:text-texto',
};

export default function MisSolicitudes() {
    const { usuario } = useAuth();
    const location = useLocation();
    const [solicitudes] = useSolicitudes();
    const [salas] = useSalas(true);
    const [colaboradores] = useColaboradores();
    const [proyectos] = useProyectos(usuario?.id);
    const [canciones] = useCancionesDeUsuario(usuario?.id);
    const [form, setForm] = useState(FORM_INICIAL);
    const [partesMarcadas, setPartesMarcadas] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const esGrabacion = form.tipo === TIPOS_SOLICITUD.GRABACION;
    const cancionSeleccionada = canciones.find((cancion) => String(cancion.id) === String(form.cancion_id));

    useEffect(() => {
        const previa = location.state?.grabacionPrevia;
        if (!previa?.cancion_id) return;

        const cancion = canciones.find((item) => String(item.id) === String(previa.cancion_id));
        setForm((previo) => ({
            ...previo,
            tipo: TIPOS_SOLICITUD.GRABACION,
            cancion_id: String(previa.cancion_id),
        }));
        setPartesMarcadas(cancion?.partes ?? []);
        window.history.replaceState({}, document.title);
    }, [location.state, canciones]);

    const colaborador = colaboradores.find((item) => String(item.usuario_id) === String(usuario?.id));

    const misSolicitudes = useMemo(() => [...solicitudes]
        .filter((solicitud) =>
            String(solicitud.usuario_id) === String(usuario?.id)
            || (colaborador && String(solicitud.colaborador_id) === String(colaborador.id)))
        .sort((a, b) => String(a.fecha ?? '').localeCompare(String(b.fecha ?? ''))),
    [solicitudes, usuario, colaborador]);

    const salaSeleccionada = salas.find((sala) => String(sala.id) === String(form.sala_id));
    const estimado = estimadoSala(salaSeleccionada, `${form.hora_inicio}-${form.hora_fin}`);

    const cambiarCampo = (campo, valor) => setForm((previo) => ({ ...previo, [campo]: valor }));

    const cambiarTipo = (tipo) => {
        if (tipo !== TIPOS_SOLICITUD.GRABACION) {
            setForm((previo) => ({ ...previo, tipo, cancion_id: '' }));
            setPartesMarcadas([]);
        } else {
            setForm((previo) => ({ ...previo, tipo }));
        }
    };

    const cambiarCancion = (cancionId) => {
        setForm((previo) => ({ ...previo, cancion_id: cancionId }));
        const cancion = canciones.find((item) => String(item.id) === String(cancionId));
        setPartesMarcadas(cancion?.partes ?? []);
    };

    const alternarParte = (parte) => {
        setPartesMarcadas((previo) =>
            previo.includes(parte) ? previo.filter((item) => item !== parte) : [...previo, parte]);
    };

    const proyectoDe = (cancionId) => {
        const cancion = canciones.find((item) => String(item.id) === String(cancionId));
        return proyectos.find((proyecto) => String(proyecto.id) === String(cancion?.proyecto_id));
    };

    const enviar = (evento) => {
        evento.preventDefault();
        setError('');
        setMensaje('');

        if (!form.sala_id) {
            setError('Elige la cabina para tu solicitud.');
            return;
        }
        if (!form.fecha) {
            setError('Elige la fecha de tu solicitud.');
            return;
        }

        const inicio = aMinutos(form.hora_inicio);
        const fin = aMinutos(form.hora_fin);
        if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin <= inicio) {
            setError('La franja horaria debe terminar después de comenzar.');
            return;
        }

        const cancionElegida = canciones.find((item) => String(item.id) === String(form.cancion_id));

        SolicitudService.crear({
            usuario_id: usuario?.id ?? null,
            solicitante_nombre: usuario?.nombre ?? null,
            colaborador_id: colaborador?.id ?? null,
            sala_id: Number(form.sala_id),
            fecha: form.fecha,
            franja: `${form.hora_inicio}-${form.hora_fin}`,
            tipo: form.tipo,
            cancion_id: cancionElegida ? cancionElegida.id : null,
            proyecto_id: proyectoDe(form.cancion_id)?.id ?? null,
            partes: esGrabacion && cancionElegida ? partesMarcadas : [],
        });
        setForm(FORM_INICIAL);
        setPartesMarcadas([]);
        setMensaje(`Solicitud de ${etiquetaTipo(form.tipo)} enviada. El estudio la revisará.`);
    };

    const obtenerSala = (id) =>
        salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';

    const nombreCancionDe = (solicitud) => {
        if (!solicitud.cancion_id) return null;
        return canciones.find((item) => String(item.id) === String(solicitud.cancion_id))?.nombre ?? 'Canción no encontrada';
    };

    return (
        <main className="workspace-content" data-page="mis-solicitudes">
            <header className="page-heading">
                <p className="workspace-eyebrow">RESERVAS DEL ESTUDIO</p>
                <h1>Mis solicitudes</h1>
                <p>Solicita una cabina para grabar, mezclar, masterizar, ensayar o producir. El administrador la confirmará.</p>
            </header>

            {mensaje && <p className="operations-feedback" role="status">{mensaje}</p>}
            {error && <p className="operations-feedback operations-feedback-error" role="alert">{error}</p>}

            <section className="mx-auto mb-8 max-w-3xl rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-black/20">
                <h2 className="mb-4 text-xl font-semibold text-texto">Nueva solicitud</h2>
                <form className="grid gap-5" onSubmit={enviar} aria-label="Crear solicitud de cabina">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="flex flex-col">
                            <span className={estilos.etiqueta}>Tipo de servicio</span>
                            <select
                                className={estilos.campo}
                                value={form.tipo}
                                onChange={(evento) => cambiarTipo(evento.target.value)}
                            >
                                {Object.values(TIPOS_SOLICITUD).map((tipo) => (
                                    <option key={tipo} value={tipo}>{etiquetaTipo(tipo)}</option>
                                ))}
                            </select>
                        </label>

                        <label className="flex flex-col">
                            <span className={estilos.etiqueta}>Cabina</span>
                            <select
                                className={estilos.campo}
                                value={form.sala_id}
                                onChange={(evento) => cambiarCampo('sala_id', evento.target.value)}
                            >
                                <option value="">Selecciona la cabina…</option>
                                {salas.map((sala) => (
                                    <option key={sala.id} value={sala.id}>
                                        {sala.nombre} — {formatearMoneda(sala.precio_hora)}/h
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {esGrabacion && (
                        <div className="grid gap-5">
                            <label className="flex flex-col">
                                <span className={estilos.etiqueta}>Canción a grabar</span>
                                <select
                                    className={estilos.campo}
                                    value={form.cancion_id}
                                    onChange={(evento) => cambiarCancion(evento.target.value)}
                                >
                                    <option value="">Grabación general (sin canción específica)</option>
                                    {canciones.map((cancion) => {
                                        const proyecto = proyectoDe(cancion.id);
                                        return (
                                            <option key={cancion.id} value={cancion.id}>
                                                {cancion.nombre}
                                                {proyecto ? ` — ${proyecto.nombre}` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </label>

                            {cancionSeleccionada && (cancionSeleccionada.partes ?? []).length > 0 && (
                                <fieldset>
                                    <legend className={estilos.etiqueta}>Partes a grabar (audio separado por parte)</legend>
                                    <div className="flex flex-wrap gap-2">
                                        {(cancionSeleccionada.partes ?? []).map((parte) => {
                                            const activa = partesMarcadas.includes(parte);
                                            return (
                                                <button
                                                    key={parte}
                                                    className={activa ? estilos.parteActiva : estilos.parteInactiva}
                                                    aria-pressed={activa}
                                                    onClick={() => alternarParte(parte)}
                                                    type="button"
                                                >
                                                    {parte}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-2 text-xs text-sutil">
                                        El estudio grabará un audio por cada parte marcada.
                                    </p>
                                </fieldset>
                            )}

                            {cancionSeleccionada && (cancionSeleccionada.partes ?? []).length === 0 && (
                                <p className="text-xs text-sutil">
                                    Esta canción no tiene partes definidas. Agréguelas en "Mis proyectos"
                                    si quieres dividir la grabación en audios por parte.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="grid gap-5 sm:grid-cols-3">
                        <label className="flex flex-col">
                            <span className={estilos.etiqueta}>Fecha</span>
                            <input
                                className={estilos.campo}
                                type="date"
                                value={form.fecha}
                                onChange={(evento) => cambiarCampo('fecha', evento.target.value)}
                            />
                        </label>
                        <label className="flex flex-col">
                            <span className={estilos.etiqueta}>Desde</span>
                            <input
                                className={estilos.campo}
                                type="time"
                                value={form.hora_inicio}
                                onChange={(evento) => cambiarCampo('hora_inicio', evento.target.value)}
                            />
                        </label>
                        <label className="flex flex-col">
                            <span className={estilos.etiqueta}>Hasta</span>
                            <input
                                className={estilos.campo}
                                type="time"
                                value={form.hora_fin}
                                onChange={(evento) => cambiarCampo('hora_fin', evento.target.value)}
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {estimado !== null ? (
                            <p className="text-sm text-sutil">
                                Estimado de la franja: <span className="font-semibold text-texto">{formatearMoneda(estimado)}</span>
                            </p>
                        ) : (
                            <p className="text-sm text-sutil">La franja te dará un estimado del costo.</p>
                        )}
                        <button
                            className="rounded-lg bg-accent px-5 py-2 font-semibold text-bg transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/50"
                            type="submit"
                        >
                            Enviar solicitud
                        </button>
                    </div>
                </form>
            </section>

            <section className="mx-auto max-w-3xl" aria-labelledby="mis-solicitudes-title">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="workspace-eyebrow">HISTORIAL</p>
                        <h2 id="mis-solicitudes-title" className="text-xl font-semibold text-texto">Tus solicitudes</h2>
                    </div>
                </div>

                {misSolicitudes.length ? (
                    <div className="request-list">
                        {misSolicitudes.map((solicitud) => {
                            const sala = salas.find((sala) => String(sala.id) === String(solicitud.sala_id));
                            const estimado = estimadoSala(sala, solicitud.franja);

                            return (
                                <article className="request-card" key={solicitud.id}>
                                    <div className="request-card-main">
                                        <div className="request-card-heading">
                                            <div>
                                                <p className="workspace-eyebrow">{formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || 'Fecha pendiente'}</p>
                                                <h3>{etiquetaTipo(solicitud.tipo)}</h3>
                                            </div>
                                            <span className={`operations-status status-${solicitud.estado}`}>
                                                {etiquetaEstado(solicitud.estado)}
                                            </span>
                                        </div>
                                        <div className="request-details">
                                            <span><strong>Sala</strong>{obtenerSala(solicitud.sala_id)}</span>
                                            <span><strong>Horario</strong>{solicitud.franja || 'Por coordinar'}</span>
                                            {nombreCancionDe(solicitud) && (
                                                <span><strong>Canción</strong>{nombreCancionDe(solicitud)}</span>
                                            )}
                                            {(solicitud.partes ?? []).length > 0 && (
                                                <span><strong>Partes</strong>{solicitud.partes.join(', ')}</span>
                                            )}
                                            {estimado !== null && (
                                                <span><strong>Estimado</strong>{formatearMoneda(estimado)}</span>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="mx-auto rounded-xl border border-dashed border-border bg-surface/50 px-6 py-8 text-center text-sutil">
                        No has enviado solicitudes todavía. Crea la primera arriba.
                    </p>
                )}
            </section>
        </main>
    );
}