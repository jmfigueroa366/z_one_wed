// CAPA: Presentación
import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useProyectos } from '../hooks/useProyectos.js';
import { useCanciones } from '../hooks/useCanciones.js';
import { ProyectoService } from '../services/proyectoService.js';
import { CancionService } from '../services/cancionService.js';
import { formatearFecha } from '../utils/helpers.js';
import '../styles/tailwind.css';

const estilos = {
    campo: 'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-texto outline-none transition placeholder:text-sutil focus:border-accent focus:ring-2 focus:ring-accent/40',
    etiqueta: 'mb-1 block text-xs font-semibold uppercase tracking-wider text-sutil',
    botonPrimario: 'rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/50',
    botonPeligro: 'rounded-lg border border-peligro/50 px-3 py-1.5 text-sm font-medium text-peligro transition hover:bg-peligro/10',
    tarjeta: 'rounded-xl border border-border bg-surface p-4',
};

function duracionTexto(cancion) {
    if (!cancion.duracion) return '';
    return `${cancion.duracion} min`;
}

export default function MisProyectos() {
    const { usuario } = useAuth();
    const [proyectos] = useProyectos(usuario?.id);
    const [proyectoActivoId, setProyectoActivoId] = useState(null);
    const [canciones] = useCanciones(proyectoActivoId);

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

    return (
        <main className="workspace-content" data-page="mis-proyectos">
            <header className="page-heading">
                <p className="workspace-eyebrow">TU ESPACIO DE TRABAJO</p>
                <h1>Mis proyectos</h1>
                <p>Organiza tus proyectos en carpetas y nombra las canciones que quieres trabajar en el estudio.</p>
            </header>

            {mensaje && <p className="mb-4 rounded-lg border border-exito/30 bg-exito/10 px-4 py-2 text-sm text-exito" role="status">{mensaje}</p>}
            {error && <p className="mb-4 rounded-lg border border-peligro/30 bg-peligro/10 px-4 py-2 text-sm text-peligro" role="alert">{error}</p>}

            <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
                <section className="rounded-2xl border border-border bg-surface p-5" aria-label="Carpetas de proyectos">
                    <h2 className="mb-4 text-lg font-semibold text-texto">Carpetas</h2>

                    <form className="mb-5" onSubmit={crearProyecto} aria-label="Crear carpeta de proyecto">
                        <label className="flex flex-col">
                            <span className={estilos.etiqueta}>Nueva carpeta</span>
                            <div className="flex gap-2">
                                <input
                                    className={estilos.campo}
                                    placeholder="Nombre de la carpeta"
                                    value={nombreProyecto}
                                    onChange={(evento) => setNombreProyecto(evento.target.value)}
                                />
                                <button className={`${estilos.botonPrimario} shrink-0`} type="submit">Crear</button>
                            </div>
                        </label>
                    </form>

                    {proyectos.length ? (
                        <ul className="flex flex-col gap-2">
                            {proyectos.map((proyecto) => {
                                const activa = String(proyecto.id) === String(proyectoActivo?.id);
                                return (
                                    <li key={proyecto.id}>
                                        <div
                                            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-3 text-left transition ${
                                                activa
                                                    ? 'border-accent bg-accent/10'
                                                    : 'border-border bg-surface-2 hover:border-accent/60'
                                            }`}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => setProyectoActivoId(proyecto.id)}
                                            onKeyDown={(evento) => {
                                                if (evento.key === 'Enter' || evento.key === ' ') {
                                                    setProyectoActivoId(proyecto.id);
                                                }
                                            }}
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-texto">{proyecto.nombre}</p>
                                                <p className="text-xs text-sutil">
                                                    {conteoCanciones.get(String(proyecto.id)) ?? 0} canciones · {formatearFecha(proyecto.creado_en, { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                            <button
                                                className={`${estilos.botonPeligro} shrink-0`}
                                                onClick={(evento) => {
                                                    evento.stopPropagation();
                                                    eliminarProyecto(proyecto);
                                                }}
                                                type="button"
                                                aria-label={`Eliminar carpeta ${proyecto.nombre}`}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="rounded-xl border border-dashed border-border bg-surface/40 px-4 py-6 text-sm text-sutil">
                            Aún no tienes carpetas. Crea la primera para empezar.
                        </p>
                    )}
                </section>

                <section className="rounded-2xl border border-border bg-surface p-5" aria-label="Canciones de la carpeta">
                    {proyectoActivo ? (
                        <>
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-texto">{proyectoActivo.nombre}</h2>
                                    <p className="text-sm text-sutil">
                                        {canciones.length} canción{canciones.length === 1 ? '' : 'es'} en la carpeta
                                    </p>
                                </div>
                                <button className={estilos.botonPeligro} onClick={() => eliminarProyecto(proyectoActivo)} type="button">
                                    Eliminar carpeta
                                </button>
                            </div>

                            <form className="mb-6 grid gap-3 sm:grid-cols-[1fr_120px_auto]" onSubmit={agregarCancion} aria-label="Agregar canción">
                                <label className="flex flex-col">
                                    <span className={estilos.etiqueta}>Nombre de la canción</span>
                                    <input
                                        className={estilos.campo}
                                        placeholder="Ej. Amanecer"
                                        value={nombreCancion}
                                        onChange={(evento) => setNombreCancion(evento.target.value)}
                                    />
                                </label>
                                <label className="flex flex-col">
                                    <span className={estilos.etiqueta}>Duración (min)</span>
                                    <input
                                        className={estilos.campo}
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="Opcional"
                                        value={duracionCancion}
                                        onChange={(evento) => setDuracionCancion(evento.target.value)}
                                    />
                                </label>
                                <div className="flex items-end">
                                    <button className={estilos.botonPrimario} type="submit">Agregar</button>
                                </div>
                            </form>

                            {canciones.length ? (
                                <ul className="flex flex-col gap-2">
                                    {canciones.map((cancion) => (
                                        <li key={cancion.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <span aria-hidden="true" className="text-lg text-accent">♪</span>
                                                <div>
                                                    <p className="font-medium text-texto">{cancion.nombre}</p>
                                                    <p className="text-xs text-sutil">{duracionTexto(cancion) || 'Sin duración'}</p>
                                                </div>
                                            </div>
                                            <button
                                                className={estilos.botonPeligro}
                                                onClick={() => eliminarCancion(cancion)}
                                                type="button"
                                                aria-label={`Eliminar canción ${cancion.nombre}`}
                                            >
                                                Quitar
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="rounded-xl border border-dashed border-border bg-surface/40 px-4 py-6 text-sm text-sutil">
                                    Esta carpeta no tiene canciones. Agrégale la primera con el nombre que quieras.
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 py-10 text-center">
                            <p className="text-2xl text-accent" aria-hidden="true">♫</p>
                            <p className="mt-2 font-medium text-texto">Selecciona una carpeta</p>
                            <p className="text-sm text-sutil">Elige una carpeta para ver y nombrar sus canciones.</p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}