// CAPA: Presentación
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, Mic, Pause, Play, Square, Trash2 } from 'lucide-react';
import OndaToma from '../components/OndaToma.tsx';
import { BOTON_PELIGRO, BOTON_SECUNDARIO } from '../styles/clases.ts';
import '../styles/tailwind.css';

interface Toma {
    id: string;
    url: string;
    duracion: number;
    picos: number[];
    mime: string;
    creadaEn: number;
}

const MIME_PREFERIDOS = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
];

const BARRAS_ONDA = 180;
const SEGMENTOS_NIVEL = 24;

function formatearDuracion(segundos: number): string {
    const total = Math.max(0, Math.floor(segundos));
    const minutos = Math.floor(total / 60);
    const resto = total % 60;
    if (minutos >= 60) {
        const horas = Math.floor(minutos / 60);
        return `${horas}:${String(minutos % 60).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
    }
    return `${minutos}:${String(resto).padStart(2, '0')}`;
}

function formatearLcd(segundos: number): string {
    const total = Math.max(0, segundos);
    const minutos = Math.floor(total / 60);
    const resto = Math.floor(total % 60);
    const decimas = Math.floor((total * 10) % 10);
    return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}.${decimas}`;
}

function elegirMime(): string | undefined {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
        return undefined;
    }
    return MIME_PREFERIDOS.find((tipo) => MediaRecorder.isTypeSupported(tipo));
}

function extensionDe(mime: string): string {
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('ogg')) return 'ogg';
    if (mime.includes('mp4')) return 'm4a';
    return 'audio';
}

function nombreArchivo(mime: string, creadaEn: number): string {
    const fecha = new Date(creadaEn);
    const marca = [
        fecha.getFullYear(),
        String(fecha.getMonth() + 1).padStart(2, '0'),
        String(fecha.getDate()).padStart(2, '0'),
        '-',
        String(fecha.getHours()).padStart(2, '0'),
        String(fecha.getMinutes()).padStart(2, '0'),
        String(fecha.getSeconds()).padStart(2, '0'),
    ].join('');
    return `grabacion-${marca}.${extensionDe(mime)}`;
}

function crearPicosVacios(cantidad: number): number[] {
    return Array.from({ length: cantidad }, () => 0.04);
}

function extraerPicos(buffer: AudioBuffer, cantidad: number): number[] {
    const canal = buffer.getChannelData(0);
    if (canal.length === 0) return crearPicosVacios(cantidad);

    const tamanoBloque = Math.max(1, Math.floor(canal.length / cantidad));
    const picos: number[] = [];
    let maximo = 0.0001;

    for (let i = 0; i < cantidad; i += 1) {
        const inicio = i * tamanoBloque;
        const fin = Math.min(inicio + tamanoBloque, canal.length);
        let pico = 0;
        for (let j = inicio; j < fin; j += 1) {
            const valor = Math.abs(canal[j]);
            if (valor > pico) pico = valor;
        }
        if (pico > maximo) maximo = pico;
        picos.push(pico);
    }

    return picos.map((pico) => Math.max(0.04, Math.min(1, pico / maximo)));
}

export default function Grabadora() {
    const [grabando, setGrabando] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [tomas, setTomas] = useState<Toma[]>([]);
    const [tomaActivaId, setTomaActivaId] = useState<string | null>(null);
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [error, setError] = useState('');

    const grabadorRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const trozosRef = useRef<BlobPart[]>([]);
    const rafRef = useRef<number | null>(null);
    const inicioRef = useRef(0);
    const montadoRef = useRef(false);
    const tomasRef = useRef<Toma[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const pendienteSeekRef = useRef<number | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const fuenteRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const analizadorRef = useRef<AnalyserNode | null>(null);
    const vivoCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const medidorRef = useRef<HTMLDivElement | null>(null);

    const cancelarBucle = () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    };

    const liberarPistaEntrada = () => {
        streamRef.current?.getTracks().forEach((pista) => pista.stop());
        streamRef.current = null;
        try {
            fuenteRef.current?.disconnect();
        } catch {
            /* la fuente ya estaba desconectada */
        }
        fuenteRef.current = null;
        try {
            analizadorRef.current?.disconnect();
        } catch {
            /* el analizador ya estaba desconectado */
        }
        analizadorRef.current = null;
    };

    const obtenerAudioContext = (): AudioContext | null => {
        if (!audioCtxRef.current) {
            const Ctor =
                window.AudioContext ??
                (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!Ctor) return null;
            audioCtxRef.current = new Ctor();
        }
        const contexto = audioCtxRef.current;
        if (contexto.state === 'suspended') {
            void contexto.resume();
        }
        return contexto;
    };

    const pintarNivel = (nivel: number) => {
        const contenedor = medidorRef.current;
        if (!contenedor) return;
        const hijos = contenedor.children;
        const activos = Math.round(Math.min(Math.max(nivel, 0), 1) * hijos.length);
        for (let i = 0; i < hijos.length; i += 1) {
            const segmento = hijos[i] as HTMLElement;
            if (i < activos) {
                segmento.style.opacity = '1';
                segmento.style.background =
                    i >= hijos.length * 0.8 ? '#f2a4b1' : i >= hijos.length * 0.55 ? '#f04fa6' : '#a477ff';
            } else {
                segmento.style.opacity = '0.22';
                segmento.style.background = 'rgba(247, 244, 255, 0.5)';
            }
        }
    };

    const limpiarOndaViva = () => {
        const canvas = vivoCanvasRef.current;
        const contenedor = canvas?.parentElement;
        if (!canvas || !contenedor) return;
        const ancho = contenedor.clientWidth;
        const alto = contenedor.clientHeight;
        if (ancho === 0 || alto === 0) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(ancho * dpr);
        canvas.height = Math.round(alto * dpr);
        canvas.style.width = `${ancho}px`;
        canvas.style.height = `${alto}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, ancho, alto);
        ctx.strokeStyle = 'rgba(166, 158, 189, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, alto / 2);
        ctx.lineTo(ancho, alto / 2);
        ctx.stroke();
    };

    const pintarOndaViva = (datos: Uint8Array) => {
        const canvas = vivoCanvasRef.current;
        const contenedor = canvas?.parentElement;
        if (!canvas || !contenedor) return;
        const ancho = contenedor.clientWidth;
        const alto = contenedor.clientHeight;
        if (ancho === 0 || alto === 0) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const anchoReal = Math.round(ancho * dpr);
        const altoReal = Math.round(alto * dpr);
        if (canvas.width !== anchoReal || canvas.height !== altoReal) {
            canvas.width = anchoReal;
            canvas.height = altoReal;
            canvas.style.width = `${ancho}px`;
            canvas.style.height = `${alto}px`;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, ancho, alto);

        ctx.strokeStyle = 'rgba(166, 158, 189, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, alto / 2);
        ctx.lineTo(ancho, alto / 2);
        ctx.stroke();

        const gradiente = ctx.createLinearGradient(0, 0, ancho, 0);
        gradiente.addColorStop(0, '#a477ff');
        gradiente.addColorStop(1, '#f04fa6');
        ctx.strokeStyle = gradiente;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const paso = ancho / Math.max(1, datos.length - 1);
        for (let i = 0; i < datos.length; i += 1) {
            const x = i * paso;
            const y = alto / 2 + ((datos[i] - 128) / 128) * (alto / 2) * 0.9;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    };

    const arrancarMonitor = (analizador: AnalyserNode) => {
        cancelarBucle();
        const datos = new Uint8Array(analizador.fftSize);
        let ultimoReloj = 0;

        const cuadro = (marca: number) => {
            analizador.getByteTimeDomainData(datos);
            let suma = 0;
            for (let i = 0; i < datos.length; i += 1) {
                const valor = (datos[i] - 128) / 128;
                suma += valor * valor;
            }
            const rms = Math.sqrt(suma / datos.length);
            pintarNivel(Math.min(1, rms * 3.5));
            pintarOndaViva(datos);

            if (marca - ultimoReloj >= 100) {
                ultimoReloj = marca;
                setElapsed((performance.now() - inicioRef.current) / 1000);
            }
            rafRef.current = requestAnimationFrame(cuadro);
        };

        rafRef.current = requestAnimationFrame(cuadro);
    };

    const calcularOnda = async (blob: Blob): Promise<{ duracion: number; picos: number[] }> => {
        const contexto = obtenerAudioContext();
        if (!contexto) return { duracion: 0, picos: crearPicosVacios(BARRAS_ONDA) };
        try {
            const datos = await blob.arrayBuffer();
            const buffer = await contexto.decodeAudioData(datos);
            return { duracion: buffer.duration, picos: extraerPicos(buffer, BARRAS_ONDA) };
        } catch {
            return { duracion: 0, picos: crearPicosVacios(BARRAS_ONDA) };
        }
    };

    const finalizarToma = async (mimeReal: string, duracionGrabada: number) => {
        const trozos = trozosRef.current;
        trozosRef.current = [];
        cancelarBucle();
        liberarPistaEntrada();
        pintarNivel(0);
        limpiarOndaViva();

        if (!montadoRef.current) return;

        setGrabando(false);

        const blob = new Blob(trozos, { type: mimeReal });
        if (blob.size === 0) {
            setError('No se capturó audio. Revisa el micrófono e inténtalo de nuevo.');
            return;
        }

        const { duracion, picos } = await calcularOnda(blob);
        if (!montadoRef.current) return;

        const url = URL.createObjectURL(blob);
        const nueva: Toma = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            url,
            duracion: duracion > 0 ? duracion : duracionGrabada,
            picos,
            mime: mimeReal,
            creadaEn: Date.now(),
        };
        setTomas((actual) => [...actual, nueva]);
    };

    const iniciarGrabacion = async () => {
        if (grabando) return;
        setError('');
        audioRef.current?.pause();

        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setError('Tu navegador no soporta la grabación de audio. Prueba con Chrome, Edge o Firefox actualizados.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!montadoRef.current) {
                stream.getTracks().forEach((pista) => pista.stop());
                return;
            }
            streamRef.current = stream;

            const contexto = obtenerAudioContext();
            if (contexto) {
                const fuente = contexto.createMediaStreamSource(stream);
                const analizador = contexto.createAnalyser();
                analizador.fftSize = 2048;
                analizador.smoothingTimeConstant = 0.8;
                fuente.connect(analizador);
                fuenteRef.current = fuente;
                analizadorRef.current = analizador;
            }

            const tipo = elegirMime();
            const grabador = tipo ? new MediaRecorder(stream, { mimeType: tipo }) : new MediaRecorder(stream);
            const mimeReal = grabador.mimeType || tipo || 'audio/webm';
            grabadorRef.current = grabador;
            trozosRef.current = [];
            inicioRef.current = performance.now();

            grabador.ondataavailable = (evento) => {
                if (evento.data && evento.data.size > 0) {
                    trozosRef.current.push(evento.data);
                }
            };

            grabador.onstop = () => {
                const duracionGrabada = (performance.now() - inicioRef.current) / 1000;
                void finalizarToma(mimeReal, duracionGrabada);
            };

            grabador.start(100);
            setElapsed(0);
            setProgreso(0);
            setReproduciendo(false);
            setTomaActivaId(null);
            pendienteSeekRef.current = null;
            setGrabando(true);

            if (analizadorRef.current) {
                arrancarMonitor(analizadorRef.current);
            }
        } catch (err) {
            liberarPistaEntrada();
            cancelarBucle();
            pintarNivel(0);
            limpiarOndaViva();
            setGrabando(false);
            const nombre = err instanceof DOMException ? err.name : '';

            if (nombre === 'NotAllowedError' || nombre === 'SecurityError') {
                setError('No se pudo acceder al micrófono. Concede el permiso en tu navegador e inténtalo de nuevo.');
            } else if (nombre === 'NotFoundError' || nombre === 'DevicesNotFoundError') {
                setError('No se encontró un micrófono conectado. Conecta uno e inténtalo de nuevo.');
            } else if (nombre === 'NotReadableError') {
                setError('El micrófono está en uso por otra aplicación. Ciérrala e inténtalo de nuevo.');
            } else {
                setError('No se pudo iniciar la grabación. Revisa los permisos del micrófono.');
            }
        }
    };

    const detenerGrabacion = () => {
        const grabador = grabadorRef.current;
        if (!grabador || grabador.state === 'inactive') {
            setGrabando(false);
            return;
        }
        grabador.stop();
    };

    const alternarReproduccion = async (toma: Toma) => {
        const audio = audioRef.current;
        if (!audio) return;
        setError('');

        if (tomaActivaId === toma.id) {
            if (audio.paused) {
                try {
                    await audio.play();
                } catch {
                    setError('No se pudo reproducir la toma.');
                }
            } else {
                audio.pause();
            }
            return;
        }

        pendienteSeekRef.current = null;
        audio.src = toma.url;
        setTomaActivaId(toma.id);
        setProgreso(0);
        try {
            await audio.play();
        } catch {
            setError('No se pudo reproducir la toma.');
            setReproduciendo(false);
        }
    };

    const buscarEnToma = (toma: Toma, fraccion: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        const seguro = Math.min(Math.max(fraccion, 0), 1);

        if (tomaActivaId !== toma.id) {
            audio.pause();
            audio.src = toma.url;
            setTomaActivaId(toma.id);
            setProgreso(seguro);
            pendienteSeekRef.current = seguro;
            void audio.play().catch(() => setError('No se pudo reproducir la toma.'));
            return;
        }

        const duracion = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : toma.duracion;
        if (duracion > 0) {
            audio.currentTime = seguro * duracion;
            setProgreso(seguro);
        }
        if (audio.paused) {
            void audio.play().catch(() => undefined);
        }
    };

    const borrarToma = (toma: Toma) => {
        const audio = audioRef.current;
        if (audio && tomaActivaId === toma.id) {
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            setTomaActivaId(null);
            setReproduciendo(false);
            setProgreso(0);
            pendienteSeekRef.current = null;
        }
        URL.revokeObjectURL(toma.url);
        setTomas((actual) => actual.filter((elemento) => elemento.id !== toma.id));
    };

    useEffect(() => {
        tomasRef.current = tomas;
    }, [tomas]);

    useEffect(() => {
        montadoRef.current = true;
        return () => {
            montadoRef.current = false;
            cancelarBucle();
            const grabador = grabadorRef.current;
            if (grabador && grabador.state !== 'inactive') {
                try {
                    grabador.stop();
                } catch {
                    /* el grabador ya estaba detenido */
                }
            }
            liberarPistaEntrada();
            const audio = audioRef.current;
            if (audio) {
                audio.pause();
                audio.removeAttribute('src');
                audio.load();
            }
            pintarNivel(0);
            void audioCtxRef.current?.close().catch(() => undefined);
            audioCtxRef.current = null;
            tomasRef.current.forEach((toma) => URL.revokeObjectURL(toma.url));
            tomasRef.current = [];
        };
    }, []);

    const duracionActiva = tomas.find((toma) => toma.id === tomaActivaId)?.duracion ?? 0;
    const lcd = grabando ? elapsed : progreso * duracionActiva;

    return (
        <main className="workspace-content relative" data-page="grabadora">
            <header className="page-heading relative border-l-4 border-accent pl-4">
                <p className="workspace-eyebrow">ESTUDIO · GRABADORA</p>
                <h1>Grabadora</h1>
                <p>Graba tomas desde tu micrófono, escúchalas y descárgalas. Todo se procesa en tu navegador.</p>
            </header>

            <section
                className="relative mt-6 overflow-hidden rounded-[2rem] border border-border bg-surface/60 p-5 backdrop-blur sm:p-6"
                aria-label="Transporte de grabación"
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#9365f2]/20 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-[#e34ba6]/15 blur-3xl"
                />

                <div className="relative flex flex-wrap items-center gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            void iniciarGrabacion();
                        }}
                        disabled={grabando}
                        aria-label="Grabar"
                        className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-full border border-white/20 text-white shadow-xl transition ${
                            grabando
                                ? 'cursor-not-allowed bg-gradient-to-br from-[#ff5a6e] to-[#c81e4a] opacity-80'
                                : 'bg-gradient-to-br from-[#ff5a6e] to-[#c81e4a] hover:brightness-110'
                        }`}
                    >
                        <Mic className="h-6 w-6" aria-hidden="true" />
                        {grabando && (
                            <span
                                aria-hidden="true"
                                className="absolute inset-0 animate-ping rounded-full border border-magenta/60"
                            />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={detenerGrabacion}
                        disabled={!grabando}
                        aria-label="Detener grabación"
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border bg-white/[0.04] text-texto transition hover:border-peligro/60 hover:text-peligro-soft disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Square className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <div className="rounded-2xl border border-border bg-[#0b0813] px-5 py-3 shadow-inner">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sutil">
                            {grabando ? 'REC' : 'STOP'}
                        </p>
                        <p className="font-mono text-3xl font-black tabular-nums tracking-tight text-texto-soft">
                            {formatearLcd(lcd)}
                        </p>
                    </div>

                    <div className="min-w-[160px] flex-1">
                        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-sutil">
                            <span>Nivel</span>
                            <span className={grabando ? 'text-magenta' : 'text-sutil'}>
                                {grabando ? 'En vivo' : 'En espera'}
                            </span>
                        </div>
                        <div ref={medidorRef} className="flex h-4 items-stretch gap-1" aria-hidden="true">
                            {Array.from({ length: SEGMENTOS_NIVEL }).map((_valor, indice) => (
                                <span
                                    key={indice}
                                    className="flex-1 rounded-sm transition-opacity duration-75"
                                    style={{ background: 'rgba(247, 244, 255, 0.5)', opacity: 0.22 }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-right">
                        <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                                grabando
                                    ? 'border-magenta/40 bg-magenta/10 text-magenta'
                                    : 'border-border bg-white/[0.03] text-sutil'
                            }`}
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    grabando ? 'animate-pulse bg-magenta' : 'bg-sutil/50'
                                }`}
                                aria-hidden="true"
                            />
                            {grabando ? 'Grabando' : 'Listo'}
                        </span>
                        <span className="text-xs text-sutil">
                            {tomas.length} {tomas.length === 1 ? 'toma' : 'tomas'}
                        </span>
                    </div>
                </div>

                {error && (
                    <p
                        className="relative mt-5 flex items-start gap-2 rounded-xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft"
                        role="alert"
                    >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{error}</span>
                    </p>
                )}
            </section>

            <section
                className="relative mt-5 overflow-hidden rounded-[2rem] border border-border bg-surface/60 p-5 backdrop-blur sm:p-6"
                aria-label="Monitor en vivo"
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="workspace-eyebrow mb-0">MONITOR EN VIVO</p>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-sutil">
                        {grabando ? 'Señal del micrófono' : 'Sin señal'}
                    </span>
                </div>
                <div className="relative mt-3 h-28 overflow-hidden rounded-2xl border border-border bg-[#0b0813]">
                    <canvas ref={vivoCanvasRef} className="absolute inset-0" aria-hidden="true" />
                    {!grabando && (
                        <div className="absolute inset-0 grid place-items-center px-4 text-center text-xs text-sutil">
                            Pulsa grabar para ver la onda del micrófono en tiempo real.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-6" aria-label="Tomas grabadas">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="workspace-eyebrow">TOMAS</p>
                        <h2 className="text-2xl font-bold text-texto-soft">Tus pistas</h2>
                    </div>
                    <span className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs font-semibold text-sutil">
                        {tomas.length} {tomas.length === 1 ? 'toma' : 'tomas'}
                    </span>
                </div>

                {tomas.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-border bg-white/[0.02] px-5 py-10 text-center">
                        <p className="text-sm font-semibold text-texto">Aún no hay tomas</p>
                        <p className="mt-1 text-xs text-sutil">
                            Graba tu primera pista; se mantendrá en esta sesión hasta que recargues la página.
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 grid gap-3">
                        {tomas.map((toma, indice) => {
                            const activa = tomaActivaId === toma.id;
                            const sonando = activa && reproduciendo;
                            return (
                                <article
                                    key={toma.id}
                                    className={`rounded-2xl border p-4 backdrop-blur transition ${
                                        activa
                                            ? 'border-accent/50 bg-accent/[0.06]'
                                            : 'border-border bg-surface/50'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void alternarReproduccion(toma);
                                            }}
                                            aria-label={
                                                sonando
                                                    ? `Pausar toma ${indice + 1}`
                                                    : `Reproducir toma ${indice + 1}`
                                            }
                                            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition ${
                                                sonando
                                                    ? 'border-magenta/50 bg-magenta/20 text-magenta'
                                                    : 'border-border bg-white/[0.05] text-texto hover:border-accent/60 hover:text-accent'
                                            }`}
                                        >
                                            {sonando ? (
                                                <Pause className="h-4 w-4" aria-hidden="true" />
                                            ) : (
                                                <Play className="h-4 w-4" aria-hidden="true" />
                                            )}
                                        </button>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-texto-soft">
                                                Toma {indice + 1}
                                            </p>
                                            <p className="mt-0.5 text-xs text-sutil">
                                                {formatearDuracion(toma.duracion)} ·{' '}
                                                {extensionDe(toma.mime).toUpperCase()} ·{' '}
                                                {new Date(toma.creadaEn).toLocaleTimeString('es-ES', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 gap-2">
                                            <a
                                                href={toma.url}
                                                download={nombreArchivo(toma.mime, toma.creadaEn)}
                                                className={BOTON_SECUNDARIO}
                                                aria-label={`Descargar toma ${indice + 1}`}
                                            >
                                                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                                                Descargar
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => borrarToma(toma)}
                                                className={BOTON_PELIGRO}
                                                aria-label={`Borrar toma ${indice + 1}`}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                                Borrar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-3 rounded-xl border border-border/60 bg-[#0b0813]/70 px-2 py-1">
                                        <OndaToma
                                            picos={toma.picos}
                                            progreso={activa ? progreso : 0}
                                            onSeek={(fraccion) => buscarEnToma(toma, fraccion)}
                                        />
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <audio
                ref={audioRef}
                hidden
                onPlay={() => setReproduciendo(true)}
                onPause={() => setReproduciendo(false)}
                onTimeUpdate={(evento) => {
                    const audio = evento.currentTarget;
                    if (Number.isFinite(audio.duration) && audio.duration > 0) {
                        setProgreso(Math.min(Math.max(audio.currentTime / audio.duration, 0), 1));
                    }
                }}
                onLoadedMetadata={(evento) => {
                    const audio = evento.currentTarget;
                    const pendiente = pendienteSeekRef.current;
                    if (pendiente !== null && Number.isFinite(audio.duration) && audio.duration > 0) {
                        audio.currentTime = pendiente * audio.duration;
                        pendienteSeekRef.current = null;
                    }
                }}
                onEnded={() => {
                    setReproduciendo(false);
                    setProgreso(0);
                    setTomaActivaId(null);
                }}
            />
        </main>
    );
}
