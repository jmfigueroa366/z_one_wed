// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { Folder, Music, Sparkles } from 'lucide-react';
import { Contador, Ecualizador } from '../components/Animados.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { RUTAS } from '../config/rutas.js';
import { useProyectos } from '../hooks/useProyectos.js';
import { useCanciones } from '../hooks/useCanciones.js';
import { ProyectoService } from '../services/proyectoService.js';
import { CancionService } from '../services/cancionService.js';
import AudioCancion from '../components/AudioCancion.jsx';
import { CAMPO, ETIQUETA, BOTON_PRIMARIO, BOTON_SECUNDARIO, BOTON_PELIGRO } from '../styles/clases.js';
import { formatearFecha } from '../utils/helpers.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ACENTOS_CARPETA = ['#a477ff', '#f04fa6', '#9ecbff', '#7be0b0', '#ffd166'];

function duracionTexto(cancion) {
    if (!cancion.duracion) return 'Sin duración';
    return `${cancion.duracion} min`;
}

function PartesCancion({ cancion }) {
    const [nuevaParte, setNuevaParte] = useState('');
    const partes = cancion.partes ?? [];

    const agregar = (evento) => {
        evento.preventDefault();
        const parte = nuevaParte.trim();
        if (!parte || partes.some((item) => item.toLowerCase() === parte.toLowerCase())) {
            setNuevaParte('');
            return;
        }
        CancionService.actualizar(cancion.id, { partes: [...partes, parte] });
        setNuevaParte('');
    };

    const quitar = (parte) => {
        CancionService.actualizar(cancion.id, { partes: partes.filter((item) => item !== parte) });
    };

    return (
        <div className="mt-4 border-t border-border pt-4">
            {partes.length ? (
                <div className="flex flex-wrap gap-2">
                    {partes.map((parte) => (
                        <span
                            key={parte}
                            className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs text-texto"
                        >
                            {parte}
                            <button
                                className="text-sutil transition hover:text-peligro"
                                onClick={() => quitar(parte)}
                                type="button"
                                aria-label={`Quitar parte ${parte}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-sutil">
                    Sin partes definidas. Añade lo que grabarás (ej. Vocales, Guitarra, Batería) para dividir la grabación por cada audio.
                </p>
            )}
            <form className="mt-3 flex gap-2" onSubmit={agregar} aria-label="Agregar parte de audio">
                <input
                    className={`${CAMPO} flex-1`}
                    placeholder="Nueva parte (ej. Coros)"
                    value={nuevaParte}
                    onChange={(evento) => setNuevaParte(evento.target.value)}
                />
                <button className={`${BOTON_PRIMARIO} shrink-0`} type="submit">Agregar</button>
            </form>
        </div>
    );
}

export default function MisProyectos() {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [proyectos] = useProyectos(usuario?.id);
    const [proyectoActivoId, setProyectoActivoId] = useState(null);
    const [canciones] = useCanciones(proyectoActivoId);
    const [partesAbierta, setPartesAbierta] = useState(null);
    const panelRef = useRef(null);

    const [nombreProyecto, setNombreProyecto] = useState('');
    const [nombreCancion, setNombreCancion] = useState('');
    const [duracionCancion, setDuracionCancion] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const conteoCanciones = useMemo(() => {
        const grupo = new Map();
        CancionService.listar().forEach((cancion) => {
            grupo.set(String(cancion.proyecto_id), (grupo.get(String(cancion.proyecto_id)) ?? 0) + 1);
        });
        return grupo;
    }, [canciones, proyectos]);

    const proyectoActivo = proyectos.find((proyecto) => String(proyecto.id) === String(proyectoActivoId)) ?? null;

    const totalCanciones = useMemo(
        () => proyectos.reduce((suma, proyecto) => suma + (conteoCanciones.get(String(proyecto.id)) ?? 0), 0),
        [conteoCanciones, proyectos]
    );

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const panel = panelRef.current;
        if (!panel) return undefined;
        const animacion = anime({
            targets: panel.querySelectorAll('[data-pista]'),
            opacity: [0, 1],
            translateY: [14, 0],
            duration: 420,
            delay: anime.stagger(55),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [proyectoActivoId, canciones]);

    const avisar = (valor, anotacion) => {
        setMensaje(valor || '');
        setError(anotacion || '');
    };

    const crearProyecto = (evento) => {
        evento.preventDefault();
        avisar('', '');
        const nombre = nombreProyecto.trim();
        if (!nombre) {
            setError('Escribe un nombre para la carpeta.');
            return;
        }
        const proyecto = ProyectoService.crear({ nombre, usuario_id: usuario?.id });
        setNombreProyecto('');
        setProyectoActivoId(proyecto.id);
        setMensaje(`Carpeta "${proyecto.nombre}" creada.`);
    };

    const eliminarProyecto = (proyecto) => {
        ProyectoService.eliminar(proyecto.id);
        if (String(proyectoActivoId) === String(proyecto.id)) {
            setProyectoActivoId(null);
        }
        setMensaje(`Carpeta "${proyecto.nombre}" eliminada.`);
    };

    const agregarCancion = (evento) => {
        evento.preventDefault();
        if (!proyectoActivo) return;
        avisar('', '');
        const nombre = nombreCancion.trim();
        if (!nombre) {
            setError('Ponle nombre a la canción.');
            return;
        }
        const duracion = duracionCancion.trim() === '' ? null : Number(duracionCancion);
        CancionService.crear({
            proyecto_id: proyectoActivo.id,
            nombre,
            duracion: duracion !== null && Number.isFinite(duracion) && duracion > 0 ? duracion : null,
        });
        setNombreCancion('');
        setDuracionCancion('');
        setMensaje(`Canción "${nombre}" agregada a ${proyectoActivo.nombre}.`);
    };

    const eliminarCancion = (cancion) => {
        CancionService.eliminar(cancion.id);
        setMensaje(`Canción "${cancion.nombre}" eliminada.`);
    };

    const solicitarGrabacion = (cancion) => {
        navigate(RUTAS.SOLICITUDES, {
            state: { grabacionPrevia: { cancion_id: cancion.id, proyecto_id: proyectoActivo?.id ?? null } },
        });
    };

    return (
        <main className="workspace-content" data-page="mis-proyectos">
            <header className="page-heading relative border-l-4 border-accent pl-4">
                <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-20 h-52 w-52 animate-aurora rounded-full bg-[#9365f2]/18 blur-3xl" />
                <p className="workspace-eyebrow">TU ESPACIO DE TRABAJO</p>
                <h1>Mis proyectos</h1>
                <p>Organiza tus proyectos en carpetas y nombra las canciones que quieres trabajar en el estudio.</p>
            </header>

            {mensaje && <p className="mt-5 rounded-xl border border-exito/30 bg-exito/10 px-4 py-2 text-sm text-exito" role="status">{mensaje}</p>}
            {error && <p className="mt-5 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-2 text-sm text-peligro" role="alert">{error}</p>}

            <section
                className="relative mt-6 overflow-hidden rounded-[2rem] border border-accent/25 p-6 sm:p-7"
                style={{
                    background:
                        'radial-gradient(ellipse at 90% 8%, rgba(227, 75, 166, 0.28), transparent 46%), radial-gradient(ellipse at 4% 100%, rgba(111, 75, 187, 0.34), transparent 50%), linear-gradient(120deg, rgba(111, 75, 187, 0.34), rgba(23, 19, 34, 0.97) 72%)',
                }}
            >
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-60 w-60 animate-aurora rounded-full bg-[#e34ba6]/25 blur-3xl" />
                <Music aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden h-40 w-40 -translate-y-1/2 text-white/[0.05] lg:block" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-xl">
                        <p className="workspace-eyebrow flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> ESTUDIO PERSONAL
                        </p>
                        <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                            Tus carpetas, tu propio ritmo.
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-sutil">
                            Agrupa tus ideas, nombra cada canción y lanza la solicitud de grabación cuando estés listo.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-texto-soft"><Contador valor={proyectos.length} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Carpetas</span>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-accent-soft"><Contador valor={totalCanciones} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Canciones</span>
                        </div>
                        <Ecualizador />
                    </div>
                </div>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
                <section
                    className="h-fit rounded-[2rem] border border-border bg-surface/60 p-5 backdrop-blur"
                    aria-label="Carpetas de proyectos"
                >
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-texto-soft">Carpetas</h2>
                        <span className="rounded-full border border-accent-soft/30 px-3 py-1 text-[0.68rem] font-extrabold text-accent-soft">
                            {String(proyectos.length).padStart(2, '0')}
                        </span>
                    </div>

                    <form className="mb-5" onSubmit={crearProyecto} aria-label="Crear carpeta de proyecto">
                        <label className="flex flex-col">
                            <span className={ETIQUETA}>Nueva carpeta</span>
                            <div className="flex gap-2">
                                <input
                                    className={CAMPO}
                                    placeholder="Nombre de la carpeta"
                                    value={nombreProyecto}
                                    onChange={(evento) => setNombreProyecto(evento.target.value)}
                                />
                                <button className={`${BOTON_PRIMARIO} shrink-0`} type="submit">Crear</button>
                            </div>
                        </label>
                    </form>

                    {proyectos.length ? (
                        <ul className="flex flex-col gap-2">
                            {proyectos.map((proyecto, index) => {
                                const activa = String(proyecto.id) === String(proyectoActivo?.id);
                                const acento = ACENTOS_CARPETA[index % ACENTOS_CARPETA.length];
                                return (
                                    <li key={proyecto.id}>
                                        <div
                                            className={`group flex items-center justify-between gap-2 rounded-2xl border px-3 py-3 text-left transition ${
                                                activa
                                                    ? 'bg-gradient-to-r from-[#5b418f]/45 to-transparent'
                                                    : 'border-border bg-white/[0.02] hover:border-accent/50'
                                            }`}
                                            style={activa ? { borderColor: `${acento}99` } : undefined}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setProyectoActivoId(proyecto.id)}
                                            onKeyDown={(evento) => {
                                                if (evento.key === 'Enter' || evento.key === ' ') {
                                                    setProyectoActivoId(proyecto.id);
                                                }
                                            }}
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span
                                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl transition"
                                                    style={
                                                        activa
                                                            ? { background: `linear-gradient(135deg, ${acento}, #e34ba6)`, color: '#fff', boxShadow: `0 0 16px ${acento}55` }
                                                            : { background: 'rgba(255,255,255,0.05)', color: acento }
                                                    }
                                                    aria-hidden="true"
                                                >
                                                    <Folder className="h-4 w-4" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-texto-soft">{proyecto.nombre}</p>
                                                    <p className="text-xs text-sutil">
                                                        {conteoCanciones.get(String(proyecto.id)) ?? 0} canciones · {formatearFecha(proyecto.creado_en, { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                className="shrink-0 rounded-lg p-1.5 text-sutil opacity-0 transition hover:bg-peligro/10 hover:text-peligro group-hover:opacity-100"
                                                onClick={(evento) => {
                                                    evento.stopPropagation();
                                                    eliminarProyecto(proyecto);
                                                }}
                                                type="button"
                                                aria-label={`Eliminar carpeta ${proyecto.nombre}`}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-border bg-surface/40 px-4 py-6 text-sm text-sutil">
                            Aún no tienes carpetas. Crea la primera para empezar.
                        </p>
                    )}
                </section>

                <section className="rounded-[2rem] border border-border bg-surface/60 p-5 backdrop-blur sm:p-6" aria-label="Canciones de la carpeta">
                    {proyectoActivo ? (
                        <>
                            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-2xl text-white" aria-hidden="true">
                                        ♫
                                    </span>
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight text-texto-soft">{proyectoActivo.nombre}</h2>
                                        <p className="text-sm text-sutil">
                                            {canciones.length} canción{canciones.length === 1 ? '' : 'es'} en la carpeta
                                        </p>
                                    </div>
                                </div>
                                <button className={BOTON_PELIGRO} onClick={() => eliminarProyecto(proyectoActivo)} type="button">
                                    Eliminar carpeta
                                </button>
                            </div>

                            <form className="mb-6 grid gap-3 rounded-2xl border border-border bg-white/[0.02] p-4 sm:grid-cols-[1fr_130px_auto]" onSubmit={agregarCancion} aria-label="Agregar canción">
                                <label className="flex flex-col">
                                    <span className={ETIQUETA}>Nombre de la canción</span>
                                    <input
                                        className={CAMPO}
                                        placeholder="Ej. Amanecer"
                                        value={nombreCancion}
                                        onChange={(evento) => setNombreCancion(evento.target.value)}
                                    />
                                </label>
                                <label className="flex flex-col">
                                    <span className={ETIQUETA}>Duración (min)</span>
                                    <input
                                        className={CAMPO}
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="Opcional"
                                        value={duracionCancion}
                                        onChange={(evento) => setDuracionCancion(evento.target.value)}
                                    />
                                </label>
                                <div className="flex items-end">
                                    <button className={BOTON_PRIMARIO} type="submit">Agregar</button>
                                </div>
                            </form>

                            {canciones.length ? (
                                <ul ref={panelRef} className="flex flex-col gap-3">
                                    {canciones.map((cancion, indice) => {
                                        const cantPartes = (cancion.partes ?? []).length;
                                        const partesVisible = partesAbierta === cancion.id;

                                        return (
                                            <li key={cancion.id} data-pista className="rounded-2xl border border-border bg-white/[0.02] p-4 transition hover:border-accent/40">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-sm font-bold tabular-nums text-accent-soft" aria-hidden="true">
                                                            {String(indice + 1).padStart(2, '0')}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-texto-soft">{cancion.nombre}</p>
                                                            <p className="text-xs text-sutil">
                                                                {duracionTexto(cancion)}
                                                                {cantPartes > 0 && <span className="text-accent-soft"> · {cantPartes} parte{cantPartes === 1 ? '' : 's'}</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                                                        <button
                                                            className={BOTON_PRIMARIO}
                                                            onClick={() => solicitarGrabacion(cancion)}
                                                            type="button"
                                                            aria-label={`Solicitar grabación de ${cancion.nombre}`}
                                                        >
                                                            Grabarla
                                                        </button>
                                                        <button
                                                            className={BOTON_SECUNDARIO}
                                                            onClick={() => setPartesAbierta(partesVisible ? null : cancion.id)}
                                                            type="button"
                                                            aria-expanded={partesVisible}
                                                            aria-label={`Partes de audio de ${cancion.nombre}`}
                                                        >
                                                            Partes{cantPartes > 0 ? ` (${cantPartes})` : ''}
                                                        </button>
                                                        <AudioCancion cancion={cancion} estilo={BOTON_SECUNDARIO} />
                                                        <button
                                                            className={BOTON_PELIGRO}
                                                            onClick={() => eliminarCancion(cancion)}
                                                            type="button"
                                                            aria-label={`Eliminar canción ${cancion.nombre}`}
                                                        >
                                                            Quitar
                                                        </button>
                                                    </div>
                                                </div>
                                                {partesVisible && <PartesCancion cancion={cancion} />}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="rounded-2xl border border-dashed border-border bg-surface/40 px-4 py-6 text-sm text-sutil">
                                    Esta carpeta no tiene canciones. Agrégale la primera con el nombre que quieras.
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center">
                            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#5b418f]/60 to-surface-2 text-2xl text-accent-soft" aria-hidden="true">♫</span>
                            <p className="mt-3 font-semibold text-texto-soft">Selecciona una carpeta</p>
                            <p className="text-sm text-sutil">Elige una carpeta para ver y nombrar sus canciones.</p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
