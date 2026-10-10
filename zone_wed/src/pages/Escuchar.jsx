// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import { cancionesArtistas, urlCancion } from '../data/cancionesArtistas.js';
import '../styles/tailwind.css';

const BOTON_CONTROL =
    'inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white/[0.04] text-lg text-texto transition hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40';
const BOTON_PRINCIPAL =
    'inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#9365f2] to-[#e34ba6] text-xl text-white shadow-lg shadow-accent/25 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60';

function formatearTiempo(segundos) {
    if (!Number.isFinite(segundos) || segundos < 0) return '0:00';
    const total = Math.floor(segundos);
    const minutos = Math.floor(total / 60);
    const resto = String(total % 60).padStart(2, '0');
    return `${minutos}:${resto}`;
}

export default function Escuchar() {
    const [indiceArtista, setIndiceArtista] = useState(0);
    const [indiceCancion, setIndiceCancion] = useState(0);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [duracion, setDuracion] = useState(0);
    const [volumen, setVolumen] = useState(0.9);

    const audioRef = useRef(null);
    const listaRef = useRef(null);

    const artista = cancionesArtistas[indiceArtista];
    const cancion = artista.canciones[indiceCancion];
    const totalCanciones = artista.canciones.length;

    const origenActual = useMemo(
        () => urlCancion(artista.carpeta, cancion.archivo),
        [artista, cancion]
    );

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = volumen;
        }
    }, [volumen]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (reproduciendo) {
            audio.play().catch(() => setReproduciendo(false));
        } else {
            audio.pause();
        }
    }, [reproduciendo, origenActual]);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return undefined;
        }

        const contenedor = listaRef.current;
        if (!contenedor) return undefined;

        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-pista]'),
            opacity: [0, 1],
            translateX: [-14, 0],
            duration: 420,
            delay: anime.stagger(55),
            easing: 'easeOutCubic',
        });

        return () => animacion.pause();
    }, [indiceArtista]);

    const seleccionarArtista = (indice) => {
        if (indice === indiceArtista) return;
        setIndiceArtista(indice);
        setIndiceCancion(0);
        setReproduciendo(false);
        setProgreso(0);
        setDuracion(0);
    };

    const seleccionarCancion = (indice) => {
        if (indice === indiceCancion) {
            setReproduciendo((actual) => !actual);
            return;
        }
        setIndiceCancion(indice);
        setProgreso(0);
        setReproduciendo(true);
    };

    const irAnterior = () => {
        setIndiceCancion((actual) => (actual - 1 + totalCanciones) % totalCanciones);
        setProgreso(0);
        setReproduciendo(true);
    };

    const irSiguiente = () => {
        setIndiceCancion((actual) => (actual + 1) % totalCanciones);
        setProgreso(0);
        setReproduciendo(true);
    };

    const manejarFin = () => {
        if (totalCanciones > 1) {
            irSiguiente();
        } else {
            setReproduciendo(false);
        }
    };

    const manejarBusqueda = (evento) => {
        const valor = Number(evento.target.value);
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = valor;
        }
        setProgreso(valor);
    };

    return (
        <main className="workspace-content" data-page="estudio">
            <header className="page-heading border-l-4 border-accent pl-4">
                <p className="workspace-eyebrow">ESTUDIO · ESCUCHAR ARTISTAS</p>
                <h1>Escuchar artistas</h1>
                <p>Reproduce las canciones de los artistas del estudio desde un único reproductor.</p>
            </header>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(240px,280px)_1fr]">
                <section
                    className="rounded-3xl border border-border bg-surface/70 p-3"
                    aria-label="Seleccionar artista"
                >
                    <p className="workspace-eyebrow px-2 py-2">ARTISTAS</p>
                    <ul className="grid gap-2">
                        {cancionesArtistas.map((item, indice) => {
                            const activo = indice === indiceArtista;
                            return (
                                <li key={item.artista}>
                                    <button
                                        type="button"
                                        onClick={() => seleccionarArtista(indice)}
                                        aria-pressed={activo}
                                        className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                                            activo
                                                ? 'border-accent/60 bg-gradient-to-r from-[#5b418f]/40 to-transparent'
                                                : 'border-transparent hover:border-border hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        <img
                                            src={item.imagen}
                                            alt=""
                                            loading="lazy"
                                            className="h-12 w-12 shrink-0 rounded-xl object-cover"
                                        />
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-bold text-texto-soft">{item.artista}</span>
                                            <span className="block truncate text-xs text-sutil">{item.canciones.length} canciones</span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <section className="grid gap-5">
                    <article className="relative overflow-hidden rounded-3xl border border-border bg-surface/70 p-6 sm:p-7">
                        <div
                            className="pointer-events-none absolute inset-0 opacity-70"
                            style={{
                                background:
                                    'radial-gradient(ellipse at 88% 0%, rgba(214, 70, 169, 0.18), transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(111, 75, 187, 0.22), transparent 50%)',
                            }}
                        />
                        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-end">
                            <img
                                src={artista.imagen}
                                alt={`Retrato de ${artista.artista}`}
                                className="h-40 w-40 shrink-0 rounded-2xl object-cover shadow-2xl shadow-black/40"
                            />
                            <div className="min-w-0 text-center sm:text-left">
                                <p className="workspace-eyebrow">SONANDO AHORA</p>
                                <h2 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-texto-soft">{cancion.titulo}</h2>
                                <p className="mt-1 text-sm text-sutil">
                                    {artista.artista} · {artista.origen}
                                </p>
                                <span className="mt-3 inline-flex rounded-full bg-magenta/10 px-3 py-1 text-[0.7rem] font-semibold text-magenta">
                                    Pista {indiceCancion + 1} de {totalCanciones}
                                </span>
                            </div>
                        </div>

                        <div className="relative mt-6 grid gap-3">
                            <div className="flex items-center gap-3">
                                <span className="w-12 text-right text-xs tabular-nums text-sutil">{formatearTiempo(progreso)}</span>
                                <input
                                    type="range"
                                    min="0"
                                    max={duracion || 0}
                                    step="0.1"
                                    value={Math.min(progreso, duracion || 0)}
                                    onChange={manejarBusqueda}
                                    aria-label="Progreso de la canción"
                                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-accent"
                                />
                                <span className="w-12 text-xs tabular-nums text-sutil">{formatearTiempo(duracion)}</span>
                            </div>

                            <div className="flex items-center justify-center gap-4">
                                <button type="button" className={BOTON_CONTROL} onClick={irAnterior} aria-label="Canción anterior" disabled={totalCanciones <= 1}>
                                    ⏮
                                </button>
                                <button
                                    type="button"
                                    className={BOTON_PRINCIPAL}
                                    onClick={() => setReproduciendo((actual) => !actual)}
                                    aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
                                >
                                    {reproduciendo ? '❚❚' : '▶'}
                                </button>
                                <button type="button" className={BOTON_CONTROL} onClick={irSiguiente} aria-label="Canción siguiente" disabled={totalCanciones <= 1}>
                                    ⏭
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-3">
                                <span aria-hidden="true" className="text-sm text-sutil">🔊</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={volumen}
                                    onChange={(evento) => setVolumen(Number(evento.target.value))}
                                    aria-label="Volumen"
                                    className="h-1.5 w-40 cursor-pointer appearance-none rounded-full bg-surface-3 accent-accent"
                                />
                            </div>
                        </div>

                        <audio
                            ref={audioRef}
                            src={origenActual}
                            preload="metadata"
                            onTimeUpdate={(evento) => setProgreso(evento.currentTarget.currentTime)}
                            onLoadedMetadata={(evento) => setDuracion(evento.currentTarget.duration)}
                            onEnded={manejarFin}
                        />
                    </article>

                    <section className="rounded-3xl border border-border bg-surface/60 p-5 sm:p-6" aria-label="Canciones del artista">
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="text-base font-bold text-texto-soft">Canciones de {artista.artista}</h3>
                            <span className="rounded-full border border-accent-soft/30 px-3 py-1 text-[0.68rem] font-extrabold tracking-[0.1em] text-accent-soft">
                                {String(totalCanciones).padStart(2, '0')} PISTAS
                            </span>
                        </div>
                        <ul ref={listaRef} className="mt-4 grid gap-2">
                            {artista.canciones.map((pista, indice) => {
                                const activa = indice === indiceCancion;
                                return (
                                    <li key={pista.archivo} data-pista>
                                        <button
                                            type="button"
                                            onClick={() => seleccionarCancion(indice)}
                                            aria-current={activa}
                                            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                                                activa
                                                    ? 'border-accent/60 bg-white/[0.04]'
                                                    : 'border-transparent hover:border-border hover:bg-white/[0.025]'
                                            }`}
                                        >
                                            <span className={`w-6 text-center text-sm ${activa ? 'text-accent' : 'text-sutil'}`} aria-hidden="true">
                                                {activa && reproduciendo ? '❚❚' : indice + 1}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className={`block truncate text-sm font-semibold ${activa ? 'text-texto-soft' : 'text-texto'}`}>
                                                    {pista.titulo}
                                                </span>
                                            </span>
                                            <span className="text-xs text-sutil">{activa ? 'Sonando' : 'Reproducir'}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                </section>
            </div>
        </main>
    );
}
