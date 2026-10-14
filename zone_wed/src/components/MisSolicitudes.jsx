// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import anime from 'animejs';
import {
    CalendarClock,
    Check,
    Clock,
    Coins,
    Disc3,
    Layers,
    MapPin,
    Mic,
    Music,
    Send,
    SlidersHorizontal,
    Sparkles,
    Users,
    Wand2,
    XCircle,
} from 'lucide-react';
import { Contador, Ecualizador } from './Animados.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { esCliente } from '../config/roles.js';
import { useColaboradores } from '../hooks/useColaboradores.js';
import { useSalas } from '../hooks/useSalas.js';
import { useSolicitudes } from '../hooks/useSolicitudes.js';
import { useSesiones } from '../hooks/useSesiones.js';
import { useProyectos } from '../hooks/useProyectos.js';
import { useCancionesDeUsuario } from '../hooks/useCanciones.js';
import { SolicitudService } from '../services/solicitudService.js';
import { TIPOS_SOLICITUD } from '../models/Solicitud.js';
import {
    aMinutos,
    etiquetaEstado,
    etiquetaInvitacion,
    etiquetaRol,
    etiquetaTipo,
    estimadoSala,
    franjasOcupadas,
    rolDeColaborador,
    seSolapan,
} from '../utils/solicitudes.js';
import { formatearFecha, formatearMoneda } from '../utils/helpers.js';
import { BOTON_PELIGRO, BOTON_PRIMARIO, CAMPO, ETIQUETA, clasePillEstado } from '../styles/clases.js';
import '../styles/tailwind.css';

const FORM_INICIAL = {
    tipo: TIPOS_SOLICITUD.GRABACION,
    titulo: '',
    descripcion: '',
    sala_id: '',
    fecha: '',
    hora_inicio: '09:00',
    hora_fin: '12:00',
    cancion_id: '',
};

const TIPOS_META = {
    [TIPOS_SOLICITUD.GRABACION]: { icono: Mic, ayuda: 'Voces e instrumentos' },
    [TIPOS_SOLICITUD.MEZCLA]: { icono: SlidersHorizontal, ayuda: 'Equilibrar pistas' },
    [TIPOS_SOLICITUD.MASTERIZACION]: { icono: Disc3, ayuda: 'Acabado final' },
    [TIPOS_SOLICITUD.ENSAYO]: { icono: Music, ayuda: 'Practicar en cabina' },
    [TIPOS_SOLICITUD.PRODUCCION]: { icono: Wand2, ayuda: 'Arreglos y dirección' },
};

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ACENTO_ESTADO = {
    confirmada: '#7be0b0',
    solicitada: '#ffd166',
    rechazada: '#f2a4b1',
    cancelada: '#f2a4b1',
};
const acentoEstado = (estado) => ACENTO_ESTADO[estado] ?? '#a477ff';

function Paso({ numero, titulo, icono: Icono }) {
    return (
        <div className="mb-4 flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-sm font-black text-accent-soft">
                {numero}
            </span>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-texto-soft">
                {Icono && <Icono className="h-4 w-4 text-accent-soft" aria-hidden="true" />}
                {titulo}
            </h3>
        </div>
    );
}

function Dato({ icono: Icono, etiqueta, valor }) {
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
    const location = useLocation();
    const [solicitudes] = useSolicitudes();
    const [salas] = useSalas(true);
    const [sesiones] = useSesiones();
    const [colaboradores] = useColaboradores(true);
    const [proyectos] = useProyectos(usuario?.id);
    const [canciones] = useCancionesDeUsuario(usuario?.id);
    const [form, setForm] = useState(FORM_INICIAL);
    const [partesMarcadas, setPartesMarcadas] = useState([]);
    const [colaboradoresElegidos, setColaboradoresElegidos] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [ocupado, setOcupado] = useState(null);

    const esClienteActual = esCliente(usuario);
    const esGrabacion = form.tipo === TIPOS_SOLICITUD.GRABACION;
    const cancionSeleccionada = canciones.find((cancion) => String(cancion.id) === String(form.cancion_id));
    const colaboradorActual = colaboradores.find((colaborador) => String(colaborador.usuario_id) === String(usuario?.id));

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

    const misSolicitudes = useMemo(() => [...solicitudes]
        .filter((solicitud) => String(solicitud.usuario_id) === String(usuario?.id))
        .sort((a, b) => String(b.fecha_solicitud ?? b.fecha ?? '').localeCompare(String(a.fecha_solicitud ?? a.fecha ?? ''))),
    [solicitudes, usuario]);

    const invitacionesPorResponder = useMemo(() => {
        if (!colaboradorActual) return [];
        return solicitudes.filter((solicitud) =>
            solicitud.estado === 'solicitada'
            && (solicitud.colaboradores ?? []).some((invitacion) =>
                String(invitacion.colaborador_id) === String(colaboradorActual.id)
                && invitacion.estado === 'pendiente'));
    }, [solicitudes, colaboradorActual]);

    const resumen = useMemo(() => ({
        total: misSolicitudes.length,
        activas: misSolicitudes.filter((solicitud) => solicitud.estado === 'solicitada').length,
        confirmadas: misSolicitudes.filter((solicitud) => solicitud.estado === 'confirmada').length,
    }), [misSolicitudes]);

    const historialRef = useRef(null);
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

    const salaSeleccionada = salas.find((sala) => String(sala.id) === String(form.sala_id));
    const franjaPropuesta = `${form.hora_inicio}-${form.hora_fin}`;
    const estimado = estimadoSala(salaSeleccionada, franjaPropuesta);

    const ocupadas = useMemo(
        () => franjasOcupadas({ fecha: form.fecha, salaId: form.sala_id, solicitudes, sesiones }),
        [form.fecha, form.sala_id, solicitudes, sesiones]
    );
    const franjasEnConflicto = ocupadas.filter((franja) => seSolapan(franja, franjaPropuesta));
    const tieneConflicto = Boolean(form.sala_id && form.fecha && franjasEnConflicto.length);

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

    const alternarColaborador = (id) => {
        setColaboradoresElegidos((previo) =>
            previo.includes(id) ? previo.filter((item) => item !== id) : [...previo, id]);
    };

    const proyectoDe = (cancionId) => {
        const cancion = canciones.find((item) => String(item.id) === String(cancionId));
        return proyectos.find((proyecto) => String(proyecto.id) === String(cancion?.proyecto_id));
    };

    const nombreColaborador = (id) =>
        colaboradores.find((colaborador) => String(colaborador.id) === String(id))?.nombre ?? `Colaborador #${id}`;

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
        if (colaboradoresElegidos.length === 0) {
            setError('Selecciona al menos un artista o productor.');
            return;
        }

        const inicio = aMinutos(form.hora_inicio);
        const fin = aMinutos(form.hora_fin);
        if (!Number.isFinite(inicio) || !Number.isFinite(fin) || fin <= inicio) {
            setError('La franja horaria debe terminar después de comenzar.');
            return;
        }
        if (tieneConflicto) {
            setError(`La cabina ya está ocupada el ${formatearFecha(form.fecha)} en: ${franjasEnConflicto.join(', ')}. Elige otra franja.`);
            return;
        }

        const cancionElegida = canciones.find((item) => String(item.id) === String(form.cancion_id));
        const invitados = colaboradoresElegidos.map((id) => {
            const colaborador = colaboradores.find((item) => String(item.id) === String(id));
            return { colaborador_id: Number(id), rol: rolDeColaborador(colaborador) };
        });

        try {
            SolicitudService.crear({
                usuario_id: usuario?.id ?? null,
                solicitante_nombre: usuario?.nombre ?? null,
                titulo: form.titulo.trim(),
                descripcion: form.descripcion.trim(),
                sala_id: Number(form.sala_id),
                fecha: form.fecha,
                franja: `${form.hora_inicio}-${form.hora_fin}`,
                tipo: form.tipo,
                cancion_id: cancionElegida ? cancionElegida.id : null,
                proyecto_id: proyectoDe(form.cancion_id)?.id ?? null,
                partes: esGrabacion && cancionElegida ? partesMarcadas : [],
                colaboradores: invitados,
            });
            setForm(FORM_INICIAL);
            setPartesMarcadas([]);
            setColaboradoresElegidos([]);
            setMensaje(`Solicitud de ${etiquetaTipo(form.tipo)} enviada. El estudio la revisará.`);
        } catch (errorCrear) {
            setError(errorCrear instanceof Error ? errorCrear.message : 'No se pudo enviar la solicitud.');
        }
    };

    const cancelar = (id) => {
        setError('');
        setMensaje('');
        setOcupado(id);
        try {
            SolicitudService.cancelar(id);
            setMensaje('Solicitud cancelada.');
        } catch (errorCancelar) {
            setError(errorCancelar instanceof Error ? errorCancelar.message : 'No se pudo cancelar la solicitud.');
        } finally {
            setOcupado(null);
        }
    };

    const responder = (solicitudId, colaboradorId, decision) => {
        setError('');
        setMensaje('');
        try {
            SolicitudService.responderInvitacion(solicitudId, colaboradorId, decision);
            setMensaje(decision === 'aceptada' ? 'Aceptaste la solicitud.' : 'Rechazaste la solicitud.');
        } catch (errorResponder) {
            setError(errorResponder instanceof Error ? errorResponder.message : 'No se pudo responder la solicitud.');
        }
    };

    const obtenerSala = (id) =>
        salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';

    const nombreCancionDe = (solicitud) => {
        if (!solicitud.cancion_id) return null;
        return canciones.find((item) => String(item.id) === String(solicitud.cancion_id))?.nombre ?? 'Canción no encontrada';
    };

    const pasoFecha = esGrabacion ? '06' : '05';

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
                            Pide tu cabina para grabar, mezclar, masterizar o ensayar. Elige a los artistas y productores; cuando todos acepten, se crea tu sesión.
                        </p>
                        {esClienteActual && (
                            <a
                                href="#nueva-reserva"
                                className="mt-6 inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-5 text-sm font-bold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:brightness-110"
                            >
                                <Send className="h-4 w-4" aria-hidden="true" /> Nueva reserva
                            </a>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="min-w-[84px] rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-texto-soft"><Contador valor={resumen.total} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Total</span>
                        </div>
                        <div className="min-w-[84px] rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-aviso-soft"><Contador valor={resumen.activas} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Solicitadas</span>
                        </div>
                        <div className="min-w-[84px] rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-exito-soft"><Contador valor={resumen.confirmadas} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Confirmadas</span>
                        </div>
                        <Ecualizador />
                    </div>
                </div>
            </section>

            {mensaje && <p className="mt-5 rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">{mensaje}</p>}
            {error && <p className="mt-5 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">{error}</p>}

            {/* INVITACIONES (colaborador) */}
            {invitacionesPorResponder.length > 0 && (
                <section className="mt-6" aria-labelledby="invitaciones-title">
                    <div className="mb-5">
                        <p className="workspace-eyebrow">TE INVITARON</p>
                        <h2 id="invitaciones-title" className="mt-1 text-2xl font-bold tracking-tight text-texto-soft">Invitaciones por responder</h2>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                        {invitacionesPorResponder.map((solicitud) => (
                            <article key={solicitud.id} className="rounded-2xl border border-aviso/30 bg-aviso/[0.06] p-5">
                                <p className="text-[0.66rem] font-bold uppercase tracking-wider text-sutil">
                                    {formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || 'Fecha pendiente'} · {solicitud.franja}
                                </p>
                                <h3 className="mt-1 text-lg font-bold text-texto-soft">{solicitud.titulo || etiquetaTipo(solicitud.tipo)}</h3>
                                <p className="mt-1 text-sm text-sutil">{obtenerSala(solicitud.sala_id)} · {etiquetaTipo(solicitud.tipo)}</p>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-sutil">
                                    {(solicitud.colaboradores ?? []).map((invitacion) => (
                                        <span key={invitacion.colaborador_id} className={clasePillEstado(invitacion.estado)}>
                                            {nombreColaborador(invitacion.colaborador_id)} · {etiquetaInvitacion(invitacion.estado)}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button className={`${BOTON_PRIMARIO} flex-1`} onClick={() => responder(solicitud.id, colaboradorActual.id, 'aceptada')} type="button">
                                        <Check className="mr-2 h-4 w-4" aria-hidden="true" /> Aceptar
                                    </button>
                                    <button className={BOTON_PELIGRO} onClick={() => responder(solicitud.id, colaboradorActual.id, 'rechazada')} type="button">
                                        <XCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Rechazar
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* FORMULARIO (cliente) */}
            {esClienteActual && (
                <section id="nueva-reserva" className="mt-6 scroll-mt-24 rounded-[2rem] border border-border bg-surface/60 p-6 shadow-lg shadow-black/20 backdrop-blur sm:p-8">
                    <div className="mb-7 flex items-center gap-3">
                        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-white shadow-lg shadow-accent/25">
                            <Send className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="workspace-eyebrow">NUEVA RESERVA</p>
                            <h2 className="text-2xl font-bold tracking-tight text-texto-soft">Arma tu sesión</h2>
                        </div>
                    </div>

                    <form className="grid gap-8" onSubmit={enviar} aria-label="Crear solicitud de cabina">
                        {/* 01 TIPO */}
                        <div>
                            <Paso numero="01" titulo="Tipo de servicio" icono={Sparkles} />
                            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label="Tipo de servicio">
                                {Object.values(TIPOS_SOLICITUD).map((tipo) => {
                                    const meta = TIPOS_META[tipo];
                                    const Icono = meta.icono;
                                    const activo = form.tipo === tipo;
                                    return (
                                        <button key={tipo} type="button" onClick={() => cambiarTipo(tipo)} aria-pressed={activo}
                                            className={`group flex flex-col gap-2 rounded-2xl border p-4 text-left transition ${activo ? 'border-accent/60 bg-gradient-to-br from-[#5b418f]/50 to-transparent shadow-lg shadow-accent/10' : 'border-border bg-white/[0.02] hover:-translate-y-0.5 hover:border-accent/40'}`}>
                                            <span className={`grid h-10 w-10 place-items-center rounded-xl ${activo ? 'bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-white' : 'bg-white/[0.05] text-accent-soft'}`}>
                                                <Icono className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                            <span className="text-sm font-bold text-texto-soft">{etiquetaTipo(tipo)}</span>
                                            <span className="text-xs text-sutil">{meta.ayuda}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 02 NOMBRE Y DESCRIPCION */}
                        <div>
                            <Paso numero="02" titulo="Nombre y detalles" icono={Music} />
                            <div className="grid gap-5 rounded-2xl border border-border bg-white/[0.02] p-5">
                                <label className="flex flex-col">
                                    <span className={ETIQUETA}>Nombre de la sesión</span>
                                    <input className={CAMPO} type="text" value={form.titulo}
                                        onChange={(evento) => cambiarCampo('titulo', evento.target.value)}
                                        placeholder="Ej. Grabación de voces — Sencillo 1" />
                                </label>
                                <label className="flex flex-col">
                                    <span className={ETIQUETA}>Descripción (opcional)</span>
                                    <textarea className={CAMPO} rows={3} value={form.descripcion}
                                        onChange={(evento) => cambiarCampo('descripcion', evento.target.value)}
                                        placeholder="Cuéntanos qué necesitas, instrumentos, referencias…" />
                                </label>
                            </div>
                        </div>

                        {/* 03 ARTISTAS Y PRODUCTORES */}
                        <div>
                            <Paso numero="03" titulo="Artistas y productores" icono={Users} />
                            <p className="mb-3 text-sm text-sutil">Elige con quién quieres la sesión. <strong className="text-texto-soft">Todos deben aceptar</strong> para confirmarla.</p>
                            {colaboradores.length ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Artistas y productores">
                                    {colaboradores.map((colaborador) => {
                                        const activo = colaboradoresElegidos.includes(String(colaborador.id));
                                        return (
                                            <button key={colaborador.id} type="button" aria-pressed={activo}
                                                onClick={() => alternarColaborador(String(colaborador.id))}
                                                className={`flex flex-col gap-1 rounded-2xl border p-4 text-left transition ${activo ? 'border-accent/60 bg-gradient-to-br from-[#5b418f]/50 to-transparent' : 'border-border bg-white/[0.02] hover:-translate-y-0.5 hover:border-accent/40'}`}>
                                                <span className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-bold text-texto-soft">{colaborador.nombre}</span>
                                                    {activo && <Check className="h-4 w-4 text-accent-soft" aria-hidden="true" />}
                                                </span>
                                                <span className="text-xs text-sutil">{etiquetaRol(rolDeColaborador(colaborador))} · {colaborador.especialidad}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="rounded-2xl border border-dashed border-border bg-surface/40 px-4 py-6 text-center text-sm text-sutil">No hay colaboradores disponibles.</p>
                            )}
                        </div>

                        {/* 04 CABINA */}
                        <div>
                            <Paso numero="04" titulo="Elige tu cabina" icono={MapPin} />
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Cabina">
                                {salas.map((sala) => {
                                    const activo = String(form.sala_id) === String(sala.id);
                                    return (
                                        <button key={sala.id} type="button" onClick={() => cambiarCampo('sala_id', String(sala.id))} aria-pressed={activo}
                                            className={`group relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-4 text-left transition ${activo ? 'border-accent/60 bg-gradient-to-br from-[#5b418f]/50 to-transparent' : 'border-border bg-white/[0.02] hover:-translate-y-0.5 hover:border-accent/40'}`}>
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-bold text-texto-soft">{sala.nombre}</span>
                                                <MapPin className={`h-4 w-4 shrink-0 ${activo ? 'text-magenta' : 'text-sutil'}`} aria-hidden="true" />
                                            </span>
                                            <span className="flex items-baseline gap-1 text-sutil">
                                                <strong className="text-lg font-extrabold text-texto-soft">{formatearMoneda(sala.precio_hora)}</strong>
                                                <span className="text-xs">/hora</span>
                                            </span>
                                            {activo && <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#e34ba6]/25 blur-2xl" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 05 CANCION (solo grabacion) */}
                        {esGrabacion && (
                            <div>
                                <Paso numero="05" titulo="Detalles de grabación" icono={Music} />
                                <div className="grid gap-5 rounded-2xl border border-border bg-white/[0.02] p-5">
                                    <label className="flex flex-col">
                                        <span className={ETIQUETA}>Canción a grabar</span>
                                        <select className={CAMPO} value={form.cancion_id} onChange={(evento) => cambiarCancion(evento.target.value)}>
                                            <option value="">Grabación general (sin canción específica)</option>
                                            {canciones.map((cancion) => {
                                                const proyecto = proyectoDe(cancion.id);
                                                return (
                                                    <option key={cancion.id} value={cancion.id}>
                                                        {cancion.nombre}{proyecto ? ` — ${proyecto.nombre}` : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </label>

                                    {cancionSeleccionada && (cancionSeleccionada.partes ?? []).length > 0 && (
                                        <fieldset>
                                            <legend className={ETIQUETA}>Partes a grabar (un audio por parte)</legend>
                                            <div className="flex flex-wrap gap-2">
                                                {(cancionSeleccionada.partes ?? []).map((parte) => {
                                                    const activa = partesMarcadas.includes(parte);
                                                    return (
                                                        <button key={parte} type="button" aria-pressed={activa} onClick={() => alternarParte(parte)}
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${activa ? 'border-accent/60 bg-gradient-to-r from-[#9365f2]/40 to-[#e34ba6]/30 text-white' : 'border-border bg-white/[0.03] text-sutil hover:border-accent/50 hover:text-texto'}`}>
                                                            <Layers className="h-3.5 w-3.5" aria-hidden="true" /> {parte}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </fieldset>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 05/06 FECHA Y HORARIO */}
                        <div>
                            <Paso numero={pasoFecha} titulo="Fecha y horario" icono={CalendarClock} />
                            <div className="grid gap-5 sm:grid-cols-3">
                                <label className="flex flex-col">
                                    <span className={ETIQUETA}>Fecha</span>
                                    <input className={CAMPO} type="date" value={form.fecha} onChange={(evento) => cambiarCampo('fecha', evento.target.value)} />
                                </label>
                                <label className="flex flex-col">
                                    <span className={ETIQUETA}>Desde</span>
                                    <input className={CAMPO} type="time" value={form.hora_inicio} onChange={(evento) => cambiarCampo('hora_inicio', evento.target.value)} />
                                </label>
                                <label className="flex flex-col">
                                    <span className={ETIQUETA}>Hasta</span>
                                    <input className={CAMPO} type="time" value={form.hora_fin} onChange={(evento) => cambiarCampo('hora_fin', evento.target.value)} />
                                </label>
                            </div>

                            {form.sala_id && form.fecha && (
                                <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-border bg-surface-2/60 px-4 py-3.5">
                                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sutil">
                                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                        Disponibilidad · {obtenerSala(form.sala_id)} · {formatearFecha(form.fecha)}
                                    </p>
                                    {ocupadas.length ? (
                                        <div className="flex flex-wrap gap-2">
                                            {ocupadas.map((franja) => {
                                                const chocando = seSolapan(franja, franjaPropuesta);
                                                return (
                                                    <span key={franja} className={`rounded-full px-2.5 py-1 text-xs ${chocando ? 'border border-peligro/40 bg-peligro/10 text-peligro' : 'border border-border bg-surface-3 text-sutil'}`}>
                                                        {franja} reservado
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-exito">Sin reservas ese día. Cabina despejada.</p>
                                    )}
                                    {tieneConflicto && (
                                        <p className="text-sm text-peligro" role="alert">Tu franja ({franjaPropuesta}) choca con la reserva indicada. Elige otra.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-[#5b418f]/25 to-transparent p-5">
                            <div className="flex items-center gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06] text-accent-soft" aria-hidden="true">
                                    <Coins className="h-5 w-5" />
                                </span>
                                <div>
                                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Estimado de la franja</p>
                                    <strong className="text-2xl font-black tracking-tight text-texto-soft">{estimado !== null ? formatearMoneda(estimado) : '—'}</strong>
                                </div>
                            </div>
                            <button className={`${BOTON_PRIMARIO} w-full sm:w-auto`} type="submit">
                                <Send className="mr-2 h-4 w-4" aria-hidden="true" /> Enviar solicitud
                            </button>
                        </div>
                    </form>
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

                {misSolicitudes.length ? (
                    <div ref={historialRef} className="relative grid gap-4">
                        <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-4 top-3 w-px bg-gradient-to-b from-accent/50 via-white/10 to-transparent" />
                        {misSolicitudes.map((solicitud) => {
                            const sala = salas.find((item) => String(item.id) === String(solicitud.sala_id));
                            const costo = estimadoSala(sala, solicitud.franja);
                            const acento = acentoEstado(solicitud.estado);
                            const IconoTipo = TIPOS_META[solicitud.tipo]?.icono ?? Music;

                            return (
                                <article data-solicitud className="relative pl-12" key={solicitud.id}>
                                    <span className="absolute left-0 top-5 grid h-8 w-8 place-items-center rounded-full border bg-surface-2" style={{ borderColor: `${acento}66` }} aria-hidden="true">
                                        <IconoTipo className="h-4 w-4" style={{ color: acento }} />
                                    </span>
                                    <div className="group relative overflow-hidden rounded-2xl border bg-white/[0.02] p-5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40" style={{ borderColor: `${acento}44` }}>
                                        <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full blur-2xl" style={{ background: `${acento}22` }} />
                                        <div className="relative flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="workspace-eyebrow">{formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || 'Fecha pendiente'}</p>
                                                <h3 className="mt-1 text-lg font-bold text-texto-soft">{solicitud.titulo || etiquetaTipo(solicitud.tipo)}</h3>
                                            </div>
                                            <span className={clasePillEstado(solicitud.estado)}>{etiquetaEstado(solicitud.estado)}</span>
                                        </div>
                                        <div className="relative mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                                            <Dato icono={Clock} etiqueta="Horario" valor={solicitud.franja || 'Por coordinar'} />
                                            <Dato icono={MapPin} etiqueta="Sala" valor={obtenerSala(solicitud.sala_id)} />
                                            {nombreCancionDe(solicitud) && <Dato icono={Music} etiqueta="Canción" valor={nombreCancionDe(solicitud)} />}
                                            {costo !== null && <Dato icono={Coins} etiqueta="Estimado" valor={formatearMoneda(costo)} />}
                                        </div>

                                        {(solicitud.colaboradores ?? []).length > 0 && (
                                            <div className="relative mt-4 flex flex-wrap items-center gap-2 border-t border-border/40 pt-4">
                                                <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Equipo</span>
                                                {(solicitud.colaboradores ?? []).map((invitacion) => (
                                                    <span key={invitacion.colaborador_id} className={clasePillEstado(invitacion.estado)}>
                                                        {nombreColaborador(invitacion.colaborador_id)} · {etiquetaInvitacion(invitacion.estado)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {solicitud.estado === 'solicitada' && (
                                            <div className="relative mt-4 flex justify-end">
                                                <button
                                                    className={BOTON_PELIGRO}
                                                    disabled={ocupado === solicitud.id}
                                                    onClick={() => cancelar(solicitud.id)}
                                                    type="button"
                                                >
                                                    <XCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Cancelar solicitud
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="rounded-2xl border border-dashed border-border bg-surface/40 px-4 py-10 text-center text-sm text-sutil">
                        Todavía no has creado solicitudes.
                    </p>
                )}
            </section>
        </main>
    );
}