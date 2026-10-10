// CAPA: Presentación
import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { cancionesArtistas, urlCancion } from '../data/cancionesArtistas.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function formatearTiempo(segundos) {
    if (!Number.isFinite(segundos) || segundos < 0) return '0:00';
    const total = Math.floor(segundos);
    const minutos = Math.floor(total / 60);
    const resto = String(total % 60).padStart(2, '0');
    return `${minutos}:${resto}`;
}

function Barra({ valor, max, onCambiar, etiqueta, compacta = false }) {
    const seguro = Number.isFinite(max) && max > 0 ? max : 0;
    const porcentaje = seguro > 0 ? Math.min((valor / seguro) * 100, 100) : 0;

    return (
        <div className={`relative ${compacta ? 'h-5 w-28' : 'h-6 w-full'}`}>
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-[#9365f2] via-[#c85ed0] to-[#e34ba6]"
                    style={{ width: `${porcentaje}%` }}
                />
            </div>
            <input
                type="range"
                min="0"
                max={seguro}
                step="0.1"
                value={Math.min(valor, seguro)}
                onChange={onCambiar}
                aria-label={etiqueta}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
        </div>
    );
}

function Ecualizador({ activo, referencia }) {
    return (
        <span ref={referencia} className="flex h-6 items-end gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
                <span
                    key={i}
                    data-eq
                    className="w-1 origin-bottom rounded-full bg-gradient-to-t from-[#e34ba6] to-[#9365f2]"
                    style={{ height: '100%', transform: `scaleY(${activo ? 0.35 : 0.2})` }}
                />
            ))}
        </span>
    );
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
    const eqRef = useRef(null);
    const debeSonarRef = useRef(false);

    const artista = cancionesArtistas[indiceArtista];
    const cancion = artista.canciones[indiceCancion];
    const totalCanciones = artista.canciones.length;
    const origenActual = urlCancion(artista.carpeta, cancion.archivo);

    useEffect(() => {
        debeSonarRef.current = reproduciendo;
    }, [reproduciendo]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) audio.volume = volumen;
    }, [volumen]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.src = origenActual;
        audio.load();
        setProgreso(0);
    }, [origenActual]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (reproduciendo) {
            const intento = audio.play();
            if (intento && typeof intento.catch === 'function') intento.catch(() => {});
        } else {
            audio.pause();
        }
    }, [reproduciendo, origenActual]);

    useEffect(() => {
        const barras = eqRef.current?.querySelectorAll('[data-eq]');
        if (!barras || barras.length === 0) return undefined;
        anime.set(barras, { scaleY: reproduciendo ? 0.4 : 0.2 });
        if (MENOS_MOVIMIENTO() || !reproduciendo) return undefined;

        const animacion = anime({
            targets: barras,
            scaleY: [0.25, 1],
            duration: 620,
            direction: 'alternate',
            loop: true,
            delay: anime.stagger(80),
            easing: 'easeInOutSine',
        });

        return () => animacion.pause();
    }, [reproduciendo]);

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const contenedor = listaRef.current;
        if (!contenedor) return undefined;

        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-pista]'),
            opacity: [0, 1],
            translateX: [-16, 0],
            duration: 420,
            delay: anime.stagger(50),
            easing: 'easeOutCubic',
        });

        return () => animacion.pause();
    }, [indiceArtista]);

    const reintentar = () => {
        const audio = audioRef.current;
        if (audio && debeSonarRef.current && audio.paused) {
            const intento = audio.play();
            if (intento && typeof intento.catch === 'function') intento.catch(() => {});
        }
    };

    const seleccionarArtista = (indice) => {
        if (indice === indiceArtista) return;
        setIndiceArtista(indice);
        setIndiceCancion(0);
        setReproduciendo(false);
        setProgreso(0);
    };

    const seleccionarCancion = (indice) => {
        if (indice === indiceCancion) {
            setReproduciendo((actual) => !actual);
            return;
        }
        setIndiceCancion(indice);
        setReproduciendo(true);
    };

    const irSiguiente = () => {
        if (indiceCancion + 1 < totalCanciones) {
            setIndiceCancion(indiceCancion + 1);
        } else {
            setIndiceArtista((indiceArtista + 1) % cancionesArtistas.length);
            setIndiceCancion(0);
        }
        setReproduciendo(true);
    };

    const irAnterior = () => {
        if (indiceCancion > 0) {
            setIndiceCancion(indiceCancion - 1);
        } else {
            const anterior = (indiceArtista - 1 + cancionesArtistas.length) % cancionesArtistas.length;
            setIndiceArtista(anterior);
            setIndiceCancion(cancionesArtistas[anterior].canciones.length - 1);
        }
        setReproduciendo(true);
    };

    const reiniciarOAvanzar = () => {
        const audio = audioRef.current;
        if (audio && audio.currentTime > 3 && audio.duration > 0) {
            audio.currentTime = 0;
            setProgreso(0);
            return;
        }
        irAnterior();
    };

    const manejarBusqueda = (evento) => {
        const valor = Number(evento.target.value);
        const audio = audioRef.current;
        if (audio) audio.currentTime = valor;
        setProgreso(valor);
    };

    const discoAnimado = !MENOS_MOVIMIENTO();

    return (
        <main className="workspace-content" data-page="estudio">
            <header className="page-heading border-l-4 border-accent pl-4">
                <p className="workspace-eyebrow">ESTUDIO · ESCUCHAR ARTISTAS</p>
                <h1>Escuchar artistas</h1>
                <p>Un reproductor único para descubrir las canciones de los artistas del estudio.</p>
            </header>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(230px,260px)_1fr]">
                <section
                    className="rounded-[1.75rem] border border-border bg-surface/60 p-3 backdrop-blur"
                    aria-label="Seleccionar artista"
                >
                    <p className="workspace-eyebrow px-2 py-2">ARTISTAS</p>
                    <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                        {cancionesArtistas.map((item, indice) => {
                            const activo = indice === indiceArtista;
                            return (
                                <li key={item.artista} className="shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => seleccionarArtista(indice)}
                                        aria-pressed={activo}
                                        className={`group flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                                            activo
                                                ? 'border-accent/60 bg-gradient-to-r from-[#5b418f]/45 to-transparent'
                                                : 'border-transparent hover:border-border hover:bg-white/[0.03]'
                                        }`}
                                    >
                                        <span className="relative shrink-0">
                                            <span
                                                className={`grid h-12 w-12 place-items-center overflow-hidden rounded-full ${
                                                    activo ? 'bg-gradient-to-br from-[#9365f2] to-[#e34ba6] p-[2px]' : ''
                                                }`}
                                            >
                                                <img
                                                    src={item.imagen}
                                                    alt=""
                                                    loading="lazy"
                                                    className="h-full w-full rounded-full object-cover"
                                                />
                                            </span>
                                            {activo && reproduciendo && (
                                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-surface bg-magenta" />
                                            )}
                                        </span>
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

                <div className="grid gap-5">
                    <article className="relative overflow-hidden rounded-[2rem] border border-border">
                        <img
                            src={artista.imagen}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-3xl"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0914]/85 via-[#0d0a17]/80 to-[#0d0a17]/95" />
                        <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background:
                                    'radial-gradient(ellipse at 85% 0%, rgba(214, 70, 169, 0.22), transparent 45%), radial-gradient(ellipse at 5% 100%, rgba(111, 75, 187, 0.28), transparent 50%)',
                            }}
                        />

                        <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-center">
                            <div className="relative mx-auto h-44 w-44 shrink-0">
                                <div
                                    className={`absolute right-[-2.5rem] top-1/2 h-48 w-48 -translate-y-1/2 rounded-full border border-white/10 ${
                                        discoAnimado ? 'animate-spin' : ''
                                    }`}
                                    style={{
                                        background:
                                            'repeating-radial-gradient(circle, #191325 0 5px, #0b0812 5px 10px)',
                                        animationDuration: '9s',
                                        animationPlayState: reproduciendo ? 'running' : 'paused',
                                    }}
                                    aria-hidden="true"
                                >
                                    <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#9365f2] to-[#e34ba6]" />
                                </div>
                                <img
                                    src={artista.imagen}
                                    alt={`Retrato de ${artista.artista}`}
                                    className="relative h-44 w-44 rounded-2xl border border-white/10 object-cover shadow-2xl shadow-black/50"
                                />
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <Ecualizador activo={reproduciendo} referencia={eqRef} />
                                    <p className="workspace-eyebrow">SONANDO AHORA</p>
                                </div>
                                <h2 className="mt-2 truncate text-2xl font-extrabold tracking-tight text-texto-soft sm:text-3xl">
                                    {cancion.titulo}
                                </h2>
                                <p className="mt-1 text-sm text-sutil">
                                    {artista.artista} · {artista.origen}
                                </p>
                                <p className="mt-2 text-xs text-sutil/80">
                                    Pista {indiceCancion + 1} de {totalCanciones} · {indiceArtista + 1} de {cancionesArtistas.length} artistas
                                </p>

                                <div className="mt-5 flex items-center gap-3">
                                    <span className="w-10 text-right text-xs tabular-nums text-sutil">{formatearTiempo(progreso)}</span>
                                    <Barra valor={progreso} max={duracion} onCambiar={manejarBusqueda} etiqueta="Progreso de la canción" />
                                    <span className="w-10 text-xs tabular-nums text-sutil">{formatearTiempo(duracion)}</span>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={reiniciarOAvanzar}
                                            aria-label="Canción anterior"
                                            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-white/[0.05] text-lg text-texto transition hover:border-accent/60 hover:text-accent"
                                        >
                                            ⏮
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReproduciendo((actual) => !actual)}
                                            aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
                                            className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-r from-[#9365f2] to-[#e34ba6] text-2xl text-white shadow-xl shadow-accent/30 transition hover:scale-105"
                                        >
                                            {reproduciendo ? '❚❚' : '▶'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={irSiguiente}
                                            aria-label="Canción siguiente"
                                            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-white/[0.05] text-lg text-texto transition hover:border-accent/60 hover:text-accent"
                                        >
                                            ⏭
                                        </button>
                                    </div>

                                    <div className="ml-auto flex items-center gap-3">
                                        <span aria-hidden="true" className="text-sm text-sutil">🔊</span>
                                        <Barra
                                            valor={volumen}
                                            max={1}
                                            compacta
                                            onCambiar={(evento) => setVolumen(Number(evento.target.value))}
                                            etiqueta="Volumen"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <audio
                            ref={audioRef}
                            preload="metadata"
                            onTimeUpdate={(evento) => setProgreso(evento.currentTarget.currentTime)}
                            onLoadedMetadata={(evento) => setDuracion(evento.currentTarget.duration)}
                            onCanPlay={reintentar}
                            onEnded={irSiguiente}
                            onError={() => setReproduciendo(false)}
                        />
                    </article>

                    <section className="rounded-[2rem] border border-border bg-surface/60 p-5 backdrop-blur sm:p-6" aria-label="Canciones del artista">
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
                                                    ? 'border-accent/60 bg-white/[0.05]'
                                                    : 'border-transparent hover:border-border hover:bg-white/[0.025]'
                                            }`}
                                        >
                                            <span className={`grid h-8 w-8 place-items-center rounded-full text-xs ${activa ? 'bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-white' : 'bg-white/[0.05] text-sutil'}`}>
                                                {activa && reproduciendo ? '❚❚' : indice + 1}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className={`block truncate text-sm font-semibold ${activa ? 'text-texto-soft' : 'text-texto'}`}>
                                                    {pista.titulo}
                                                </span>
                                            </span>
                                            {activa && reproduciendo && (
                                                <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
                                                    {[0, 1, 2].map((barra) => (
                                                        <span
                                                            key={barra}
                                                            className="w-0.5 origin-bottom animate-pulse rounded-full bg-magenta"
                                                            style={{ height: `${[60, 100, 40][barra]}%`, animationDelay: `${barra * 120}ms` }}
                                                        />
                                                    ))}
                                                </span>
                                            )}
                                            <span className="hidden text-xs text-sutil sm:block">{activa ? 'Sonando' : 'Reproducir'}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                </div>
            </div>
        </main>
    );
}
