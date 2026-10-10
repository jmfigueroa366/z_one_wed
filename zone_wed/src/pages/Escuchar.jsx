// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Repeat1,
    Volume2,
    Volume1,
    VolumeX,
    Music,
    Mic2,
} from 'lucide-react';
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

function useOndas(semilla, cantidad = 56) {
    return useMemo(() => {
        let hash = 2166136261;
        for (let i = 0; i < semilla.length; i += 1) {
            hash ^= semilla.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        const valores = [];
        for (let i = 0; i < cantidad; i += 1) {
            hash ^= hash << 13;
            hash >>>= 0;
            hash ^= hash >>> 17;
            hash ^= hash << 5;
            hash >>>= 0;
            const azar = ((hash >>> 0) % 1000) / 1000;
            const envolvente = Math.sin((i / cantidad) * Math.PI);
            valores.push(Math.min(1, 0.16 + Math.pow(azar, 0.7) * (0.5 + envolvente * 0.5)));
        }
        return valores;
    }, [semilla, cantidad]);
}

function Barra({ valor, max, onCambiar, etiqueta }) {
    const seguro = Number.isFinite(max) && max > 0 ? max : 0;
    const porcentaje = seguro > 0 ? Math.min((valor / seguro) * 100, 100) : 0;

    return (
        <div className="group/barra relative h-5 w-24 sm:w-28">
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-[#9365f2] to-[#e34ba6]"
                    style={{ width: `${porcentaje}%` }}
                />
            </div>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#e34ba6] opacity-0 shadow-lg transition group-hover/barra:opacity-100"
                style={{ left: `${porcentaje}%` }}
            />
            <input
                type="range"
                min="0"
                max={seguro}
                step="0.01"
                value={Math.min(valor, seguro)}
                onChange={onCambiar}
                aria-label={etiqueta}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
        </div>
    );
}

function Onda({ valores, progreso, duracion, onSeek }) {
    const ref = useRef(null);
    const [arrastrando, setArrastrando] = useState(false);
    const porcentaje = duracion > 0 ? Math.min((progreso / duracion) * 100, 100) : 0;

    const calcular = (clientX) => {
        const el = ref.current;
        if (!el || !duracion) return;
        const rect = el.getBoundingClientRect();
        const relacion = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
        onSeek(relacion * duracion);
    };

    const soltarCaptura = (evento) => {
        try {
            evento.currentTarget.releasePointerCapture?.(evento.pointerId);
        } catch {
            /* ignore */
        }
    };

    const manejarTecla = (evento) => {
        if (!duracion) return;
        if (evento.key === 'ArrowRight') {
            evento.preventDefault();
            onSeek(Math.min(progreso + 5, duracion));
        } else if (evento.key === 'ArrowLeft') {
            evento.preventDefault();
            onSeek(Math.max(progreso - 5, 0));
        } else if (evento.key === 'Home') {
            evento.preventDefault();
            onSeek(0);
        } else if (evento.key === 'End') {
            evento.preventDefault();
            onSeek(duracion);
        }
    };

    return (
        <div
            ref={ref}
            role="slider"
            tabIndex={0}
            aria-label="Progreso de la canción"
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={Math.round(duracion) || 0}
            aria-valuenow={Math.round(progreso) || 0}
            aria-valuetext={`${formatearTiempo(progreso)} de ${formatearTiempo(duracion)}`}
            onPointerDown={(evento) => {
                setArrastrando(true);
                evento.currentTarget.setPointerCapture?.(evento.pointerId);
                calcular(evento.clientX);
            }}
            onPointerMove={(evento) => {
                if (arrastrando) calcular(evento.clientX);
            }}
            onPointerUp={(evento) => {
                setArrastrando(false);
                soltarCaptura(evento);
            }}
            onPointerCancel={(evento) => {
                setArrastrando(false);
                soltarCaptura(evento);
            }}
            onKeyDown={manejarTecla}
            className="flex h-14 w-full cursor-pointer items-center gap-[2px] rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
            {valores.map((altura, indice) => {
                const activo = (indice / valores.length) * 100 <= porcentaje;
                return (
                    <span
                        key={indice}
                        className={`flex-1 rounded-full transition-colors duration-150 ${
                            activo ? 'bg-gradient-to-t from-[#9365f2] to-[#e34ba6]' : 'bg-white/[0.12] hover:bg-white/20'
                        }`}
                        style={{ height: `${Math.round(altura * 100)}%` }}
                    />
                );
            })}
        </div>
    );
}

function Ecualizador({ activo, referencia, barras = 5 }) {
    return (
        <span ref={referencia} className="flex h-6 items-end gap-1" aria-hidden="true">
            {Array.from({ length: barras }).map((_, indice) => (
                <span
                    key={indice}
                    data-eq
                    className="w-1 origin-bottom rounded-full bg-gradient-to-t from-[#e34ba6] to-[#9365f2]"
                    style={{ height: '100%', transform: `scaleY(${activo ? 0.35 : 0.2})` }}
                />
            ))}
        </span>
    );
}

const ETIQUETA_REPETIR = { off: 'Repetir: desactivado', todas: 'Repetir: todas', una: 'Repetir: una canción' };

const ESPECTROS = new WeakMap();

function prepararEspectro(audio) {
    if (!audio) return null;
    if (ESPECTROS.has(audio)) return ESPECTROS.get(audio);

    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return null;

    try {
        const contexto = new Contexto();
        const fuente = contexto.createMediaElementSource(audio);
        const analizador = contexto.createAnalyser();
        analizador.fftSize = 64;
        analizador.smoothingTimeConstant = 0.82;
        fuente.connect(analizador);
        analizador.connect(contexto.destination);
        const paquete = {
            contexto,
            analizador,
            datos: new Uint8Array(analizador.frequencyBinCount),
        };
        ESPECTROS.set(audio, paquete);
        return paquete;
    } catch {
        return null;
    }
}

export default function Escuchar() {
    const [indiceArtista, setIndiceArtista] = useState(0);
    const [indiceCancion, setIndiceCancion] = useState(0);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [duracion, setDuracion] = useState(0);
    const [volumen, setVolumen] = useState(0.9);
    const [silenciado, setSilenciado] = useState(false);
    const [aleatorio, setAleatorio] = useState(false);
    const [repetir, setRepetir] = useState('off');
    const [duraciones, setDuraciones] = useState({});
    const [error, setError] = useState('');

    const audioRef = useRef(null);
    const listaRef = useRef(null);
    const eqRef = useRef(null);
    const debeSonarRef = useRef(false);
    const silenciadoRef = useRef(false);

    const artista = cancionesArtistas[indiceArtista];
    const cancion = artista.canciones[indiceCancion];
    const totalCanciones = artista.canciones.length;
    const origenActual = urlCancion(artista.carpeta, cancion.archivo);
    const ondas = useOndas(cancion.archivo);
    const menosMovimiento = MENOS_MOVIMIENTO();
    const totalGeneral = useMemo(
        () => cancionesArtistas.reduce((suma, item) => suma + item.canciones.length, 0),
        []
    );

    useEffect(() => {
        debeSonarRef.current = reproduciendo;
    }, [reproduciendo]);

    useEffect(() => {
        silenciadoRef.current = silenciado;
        const audio = audioRef.current;
        if (audio) audio.volume = silenciado ? 0 : volumen;
    }, [volumen, silenciado]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.src = origenActual;
        setProgreso(0);
        setDuracion(0);
        setError('');
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
        anime.set(barras, { scaleY: reproduciendo ? 0.28 : 0.2 });

        if (MENOS_MOVIMIENTO()) return undefined;

        const paquete = reproduciendo ? prepararEspectro(audioRef.current) : null;
        if (paquete) {
            const { contexto, analizador, datos } = paquete;
            if (contexto.state === 'suspended') {
                const reanudar = contexto.resume();
                if (reanudar && typeof reanudar.catch === 'function') reanudar.catch(() => {});
            }

            let cuadro = 0;
            const paso = Math.max(1, Math.floor(datos.length / (barras.length * 2)));
            const pintar = () => {
                analizador.getByteFrequencyData(datos);
                for (let i = 0; i < barras.length; i += 1) {
                    const valor = datos[i * paso] / 255;
                    barras[i].style.transform = `scaleY(${(0.2 + valor * 0.85).toFixed(3)})`;
                }
                cuadro = requestAnimationFrame(pintar);
            };
            pintar();
            return () => cancelAnimationFrame(cuadro);
        }

        if (!reproduciendo) return undefined;

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

    const buscar = (tiempo) => {
        const audio = audioRef.current;
        if (!audio || !Number.isFinite(tiempo)) return;
        const limite = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : tiempo;
        const destino = Math.min(Math.max(tiempo, 0), limite);
        audio.currentTime = destino;
        setProgreso(destino);
    };

    const elegirAleatoria = () => {
        const totalArtistas = cancionesArtistas.length;
        const nuevoArtista = Math.floor(Math.random() * totalArtistas);
        const nuevoIndice = Math.floor(Math.random() * cancionesArtistas[nuevoArtista].canciones.length);
        if (nuevoArtista === indiceArtista && nuevoIndice === indiceCancion) {
            return [nuevoArtista, (nuevoIndice + 1) % cancionesArtistas[nuevoArtista].canciones.length];
        }
        return [nuevoArtista, nuevoIndice];
    };

    const irSiguiente = () => {
        if (aleatorio) {
            const [na, nc] = elegirAleatoria();
            setIndiceArtista(na);
            setIndiceCancion(nc);
        } else if (indiceCancion + 1 < totalCanciones) {
            setIndiceCancion(indiceCancion + 1);
        } else {
            setIndiceArtista((indiceArtista + 1) % cancionesArtistas.length);
            setIndiceCancion(0);
        }
        setReproduciendo(true);
    };

    const irAnterior = () => {
        if (aleatorio) {
            const [na, nc] = elegirAleatoria();
            setIndiceArtista(na);
            setIndiceCancion(nc);
        } else if (indiceCancion > 0) {
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

    const alTerminar = () => {
        const audio = audioRef.current;
        if (repetir === 'una') {
            if (audio) {
                audio.currentTime = 0;
                const intento = audio.play();
                if (intento && typeof intento.catch === 'function') intento.catch(() => {});
            }
            setProgreso(0);
            return;
        }
        const ultimo = !aleatorio
            && indiceArtista === cancionesArtistas.length - 1
            && indiceCancion === totalCanciones - 1;
        if (repetir === 'off' && ultimo) {
            if (audio) audio.currentTime = 0;
            setProgreso(0);
            setReproduciendo(false);
            return;
        }
        irSiguiente();
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

    const ciclarRepetir = () => {
        setRepetir((actual) => (actual === 'off' ? 'todas' : actual === 'todas' ? 'una' : 'off'));
    };

    const alternarSilencio = () => setSilenciado((actual) => !actual);

    useEffect(() => {
        const manejar = (evento) => {
            const objetivo = evento.target;
            if (objetivo && (objetivo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(objetivo.tagName))) {
                return;
            }
            if (evento.code === 'Space') {
                if (objetivo?.closest?.('button, a, [role="slider"]')) return;
                evento.preventDefault();
                setReproduciendo((actual) => !actual);
                return;
            }
            const audio = audioRef.current;
            if (evento.key === 'ArrowRight') {
                evento.preventDefault();
                buscar((audio?.currentTime ?? 0) + 5);
            } else if (evento.key === 'ArrowLeft') {
                evento.preventDefault();
                buscar((audio?.currentTime ?? 0) - 5);
            } else if (evento.key === 'n' || evento.key === 'N') {
                evento.preventDefault();
                irSiguiente();
            } else if (evento.key === 'p' || evento.key === 'P') {
                evento.preventDefault();
                reiniciarOAvanzar();
            }
        };
        window.addEventListener('keydown', manejar);
        return () => window.removeEventListener('keydown', manejar);
    });

    const anguloBrazo = reproduciendo ? '-8deg' : '-26deg';
    const IconoVolumen = silenciado ? VolumeX : volumen < 0.5 ? Volume1 : Volume2;

    return (
        <main className="workspace-content relative" data-page="estudio">
            <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 animate-aurora rounded-full bg-[#9365f2]/20 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute right-0 top-40 h-64 w-64 animate-aurora rounded-full bg-[#e34ba6]/15 blur-3xl [animation-delay:-7s]" />

            <header className="page-heading relative border-l-4 border-accent pl-4">
                <p className="workspace-eyebrow">ESTUDIO · ESCUCHAR ARTISTAS</p>
                <h1>Escuchar artistas</h1>
                <p>{totalGeneral} canciones de {cancionesArtistas.length} artistas en un único reproductor.</p>
            </header>

            <div className="relative mt-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-sutil">
                    <Music className="h-3.5 w-3.5 text-accent-soft" aria-hidden="true" /> {totalGeneral} canciones
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-sutil">
                    <Mic2 className="h-3.5 w-3.5 text-accent-soft" aria-hidden="true" /> {cancionesArtistas.length} artistas
                </span>
                <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-2 text-xs font-semibold text-accent-soft">
                    <span className={`h-2 w-2 shrink-0 rounded-full bg-magenta ${reproduciendo ? 'animate-pulse' : ''}`} />
                    <span className="shrink-0">{reproduciendo ? 'Reproduciendo' : 'En pausa'} ·</span>
                    <span className="truncate">{cancion.titulo}</span>
                </span>
            </div>

            <div className="relative mt-6 grid gap-5 lg:grid-cols-[minmax(230px,260px)_1fr]">
                <section
                    className="order-2 h-fit rounded-[1.75rem] border border-border bg-surface/60 p-3 backdrop-blur lg:order-1"
                    aria-label="Seleccionar artista"
                >
                    <p className="workspace-eyebrow px-2 py-2">ARTISTAS</p>
                    <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 lg:snap-none lg:flex-col lg:overflow-visible lg:pb-0">
                        {cancionesArtistas.map((item, indice) => {
                            const activo = indice === indiceArtista;
                            return (
                                <li key={item.artista} className="shrink-0 snap-start">
                                    <button
                                        type="button"
                                        onClick={() => seleccionarArtista(indice)}
                                        aria-pressed={activo}
                                        className={`group flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                                            activo
                                                ? 'border-accent/60 bg-gradient-to-r from-[#5b418f]/50 to-transparent'
                                                : 'border-transparent bg-white/[0.03] hover:border-accent/30 hover:bg-white/[0.06]'
                                        }`}
                                    >
                                        <span className="relative shrink-0">
                                            <span
                                                className={`grid h-12 w-12 place-items-center overflow-hidden rounded-full ${
                                                    activo ? 'bg-gradient-to-br from-[#9365f2] to-[#e34ba6] p-[2px]' : 'border border-border'
                                                }`}
                                            >
                                                <img
                                                    src={item.imagen}
                                                    alt=""
                                                    loading="lazy"
                                                    className="h-full w-full rounded-full object-cover transition duration-300 group-hover:scale-105"
                                                />
                                            </span>
                                            {activo && reproduciendo && (
                                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-surface bg-magenta" />
                                            )}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-bold text-texto-soft">{item.artista}</span>
                                            <span className="block truncate text-xs text-[#c8c1d7]">
                                                {activo && reproduciendo ? 'Sonando ahora' : `${item.canciones.length} canciones`}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <div className="order-1 grid gap-5 lg:order-2">
                    <article className="relative overflow-hidden rounded-[2rem] border border-border">
                        <img
                            src={artista.imagen}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-3xl"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0914]/88 via-[#0d0a17]/85 to-[#0d0a17]/96" />
                        <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background:
                                    'radial-gradient(ellipse at 85% 0%, rgba(214, 70, 169, 0.24), transparent 45%), radial-gradient(ellipse at 5% 100%, rgba(111, 75, 187, 0.3), transparent 50%)',
                            }}
                        />

                        <div className="relative grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-center">
                            <div className="relative mx-auto w-fit overflow-hidden rounded-full">
                                <div className="absolute inset-0 rounded-full bg-[#9365f2]/30 blur-2xl" aria-hidden="true" />
                                <div
                                    className={`relative grid h-52 w-52 place-items-center rounded-full border border-white/10 shadow-2xl shadow-black/70 sm:h-60 sm:w-60 ${
                                        menosMovimiento ? '' : 'animate-spin'
                                    }`}
                                    style={{
                                        background: 'repeating-radial-gradient(circle at center, #1b1528 0 3px, #0a0712 3px 7px)',
                                        animationDuration: '14s',
                                        animationPlayState: reproduciendo ? 'running' : 'paused',
                                    }}
                                    aria-hidden="true"
                                >
                                    <span className="absolute h-28 w-28 overflow-hidden rounded-full border-4 border-[#0a0712] shadow-[0_0_25px_rgba(0,0,0,0.6)] sm:h-32 sm:w-32">
                                        <img src={artista.imagen} alt="" className="h-full w-full object-cover" />
                                    </span>
                                    <span className="absolute h-3 w-3 rounded-full bg-[#0a0712] ring-2 ring-white/10" />
                                    <span
                                        className="pointer-events-none absolute right-1 top-1 origin-top-right"
                                        style={{
                                            transform: `rotate(${anguloBrazo})`,
                                            transition: menosMovimiento ? 'none' : 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                        }}
                                    >
                                        <span className="flex flex-col items-center">
                                            <span className="h-4 w-4 rounded-full border border-white/20 bg-[#e6dcff] shadow-lg" />
                                            <span className="h-24 w-1.5 rounded-b-full bg-gradient-to-b from-[#e6dcff] via-[#b7a6e6] to-[#6b5aa0]" />
                                            <span className="h-3 w-3 rotate-45 rounded-sm bg-[#e34ba6]" />
                                        </span>
                                    </span>
                                </div>
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <Ecualizador activo={reproduciendo} referencia={eqRef} />
                                    <p className="workspace-eyebrow mb-0">SONANDO AHORA</p>
                                </div>
                                <h2 className="mt-2 line-clamp-2 text-2xl font-extrabold tracking-tight text-texto-soft sm:text-3xl">
                                    {cancion.titulo}
                                </h2>
                                <p className="mt-1 text-sm text-[#c8c1d7]">
                                    {artista.artista} · {artista.origen}
                                </p>

                                <div className="mt-5">
                                    <Onda valores={ondas} progreso={progreso} duracion={duracion} onSeek={buscar} />
                                    <div className="mt-1 flex items-center justify-between text-xs tabular-nums text-[#c8c1d7]">
                                        <span>{formatearTiempo(progreso)}</span>
                                        <span>
                                            Pista {indiceCancion + 1} de {totalCanciones}
                                        </span>
                                        <span>{formatearTiempo(duracion)}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setAleatorio((actual) => !actual)}
                                            aria-label={aleatorio ? 'Desactivar aleatorio' : 'Activar aleatorio'}
                                            aria-pressed={aleatorio}
                                            title="Aleatorio"
                                            className={`grid h-10 w-10 place-items-center rounded-full border transition ${
                                                aleatorio
                                                    ? 'border-accent/60 bg-accent/15 text-accent'
                                                    : 'border-border bg-white/[0.05] text-[#c8c1d7] hover:border-accent/60 hover:text-accent'
                                            }`}
                                        >
                                            <Shuffle className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={reiniciarOAvanzar}
                                            aria-label="Canción anterior"
                                            title="Anterior (P)"
                                            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-white/[0.05] text-texto transition hover:border-accent/60 hover:text-accent"
                                        >
                                            <SkipBack className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReproduciendo((actual) => !actual)}
                                            aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
                                            title="Reproducir / Pausar (Espacio)"
                                            className={`grid h-16 w-16 place-items-center rounded-full bg-gradient-to-r from-[#9365f2] to-[#e34ba6] text-white transition hover:scale-105 ${
                                                reproduciendo ? 'shadow-[0_0_45px_rgba(147,101,242,0.55)]' : 'shadow-xl shadow-accent/30'
                                            }`}
                                        >
                                            {reproduciendo ? <Pause className="h-6 w-6" aria-hidden="true" /> : <Play className="ml-0.5 h-6 w-6" aria-hidden="true" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={irSiguiente}
                                            aria-label="Canción siguiente"
                                            title="Siguiente (N)"
                                            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-white/[0.05] text-texto transition hover:border-accent/60 hover:text-accent"
                                        >
                                            <SkipForward className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={ciclarRepetir}
                                            aria-label={ETIQUETA_REPETIR[repetir]}
                                            aria-pressed={repetir !== 'off'}
                                            title="Repetir"
                                            className={`grid h-10 w-10 place-items-center rounded-full border transition ${
                                                repetir !== 'off'
                                                    ? 'border-accent/60 bg-accent/15 text-accent'
                                                    : 'border-border bg-white/[0.05] text-[#c8c1d7] hover:border-accent/60 hover:text-accent'
                                            }`}
                                        >
                                            {repetir === 'una' ? <Repeat1 className="h-4 w-4" aria-hidden="true" /> : <Repeat className="h-4 w-4" aria-hidden="true" />}
                                        </button>
                                    </div>

                                    <div className="ml-auto flex items-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={alternarSilencio}
                                            aria-label={silenciado ? 'Activar sonido' : 'Silenciar'}
                                            aria-pressed={silenciado}
                                            title={silenciado ? 'Activar sonido' : 'Silenciar'}
                                            className="grid h-9 w-9 place-items-center rounded-full text-[#c8c1d7] transition hover:text-accent"
                                        >
                                            <IconoVolumen className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                        <Barra
                                            valor={silenciado ? 0 : volumen}
                                            max={1}
                                            onCambiar={(evento) => {
                                                setVolumen(Number(evento.target.value));
                                                setSilenciado(false);
                                            }}
                                            etiqueta="Volumen"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="mt-3 rounded-xl border border-peligro/30 bg-peligro/10 px-3 py-2 text-xs font-semibold text-peligro-soft">
                                        No se pudo reproducir esta canción.
                                    </p>
                                )}
                            </div>
                        </div>

                        <audio
                            ref={audioRef}
                            preload="metadata"
                            onTimeUpdate={(evento) => setProgreso(evento.currentTarget.currentTime)}
                            onLoadedMetadata={(evento) => {
                                const audio = evento.currentTarget;
                                setDuracion(audio.duration);
                                setDuraciones((actual) => ({ ...actual, [cancion.archivo]: audio.duration }));
                            }}
                            onCanPlay={reintentar}
                            onLoadedData={reintentar}
                            onEnded={alTerminar}
                            onError={() => {
                                setError('error');
                                setReproduciendo(false);
                            }}
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
                                const dur = duraciones[pista.archivo];
                                return (
                                    <li key={pista.archivo} data-pista>
                                        <div
                                            className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${
                                                activa
                                                    ? 'border-accent/60 bg-white/[0.05]'
                                                    : 'border-transparent bg-white/[0.02] hover:border-border hover:bg-white/[0.045]'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => seleccionarCancion(indice)}
                                                aria-label={activa && reproduciendo ? `Pausar ${pista.titulo}` : `Reproducir ${pista.titulo}`}
                                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                                                    activa
                                                        ? 'bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-white'
                                                        : 'bg-white/[0.06] text-[#c8c1d7] hover:bg-white/10 hover:text-texto'
                                                }`}
                                            >
                                                {activa && reproduciendo ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />}
                                            </button>
                                            <span className="w-5 shrink-0 text-center text-xs tabular-nums text-[#c8c1d7]">{indice + 1}</span>
                                            <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${activa ? 'text-texto-soft' : 'text-texto'}`}>
                                                {pista.titulo}
                                            </span>
                                            {activa && reproduciendo && (
                                                <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
                                                    {[0, 1, 2].map((barra) => (
                                                        <span
                                                            key={barra}
                                                            className={`w-0.5 origin-bottom rounded-full bg-magenta ${menosMovimiento ? '' : '[animation:ecu_0.9s_ease-in-out_infinite]'}`}
                                                            style={{ height: `${[60, 100, 40][barra]}%`, animationDelay: `${barra * 120}ms` }}
                                                        />
                                                    ))}
                                                </span>
                                            )}
                                            <span className="shrink-0 text-xs tabular-nums text-[#c8c1d7]">{dur ? formatearTiempo(dur) : '--:--'}</span>
                                        </div>
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
