// CAPA: Presentación
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, Mic, Pause, Play, Sparkles, Square, Trash2 } from 'lucide-react';
import OndaToma from '../components/OndaToma.tsx';
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
const SEGMENTOS_NIVEL = 32;
const ALTURAS_ESTADO_VACIO = [12, 24, 16, 38, 28, 54, 36, 68, 46, 82, 58, 92, 66, 78, 50, 72, 40, 60, 30, 48, 22, 34, 16, 26];

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
                    i >= hijos.length * 0.86 ? '#ff8a8a' : i >= hijos.length * 0.62 ? '#e34ba6' : '#9365f2';
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
        ctx.strokeStyle = 'rgba(147, 101, 242, 0.22)';
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

        ctx.strokeStyle = 'rgba(147, 101, 242, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, alto / 2);
        ctx.lineTo(ancho, alto / 2);
        ctx.stroke();

        const gradiente = ctx.createLinearGradient(0, 0, ancho, 0);
        gradiente.addColorStop(0, '#9365f2');
        gradiente.addColorStop(1, '#e34ba6');
        ctx.strokeStyle = gradiente;
        ctx.lineWidth = 2.5;
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
        ctx.save();
        ctx.shadowColor = 'rgba(227, 75, 166, 0.5)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
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
                <div className="flex flex-wrap items-center gap-2">
                    <p className="workspace-eyebrow mb-0">ESTUDIO · GRABADORA</p>
                    <span className="rounded-full border border-border bg-white/[0.03] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sutil">
                        DAW
                    </span>
                </div>
                <h1>Grabadora</h1>
                <p>Graba tomas desde tu micrófono, escúchalas y descárgalas. Todo se procesa en tu navegador.</p>
            </header>

            <section
                className="relative mt-6 overflow-hidden rounded-[2rem] border border-accent/25 bg-surface p-4 shadow-[0_30px_90px_-50px_rgba(147,101,242,0.8)] backdrop-blur sm:p-6"
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

                <div className="relative mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-sutil">TRANSPORTE</p>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-sutil">
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                grabando ? 'animate-pulse bg-[#e34ba6]' : 'bg-border'
                            }`}
                            aria-hidden="true"
                        />
                        {grabando ? 'REC · CAPTURANDO' : 'LISTO PARA GRABAR'}
                    </span>
                </div>

                <div className="relative flex flex-wrap items-center gap-4 sm:gap-5">
                    <button
                        type="button"
                        onClick={() => {
                            void iniciarGrabacion();
                        }}
                        disabled={grabando}
                        aria-label="Grabar"
                        title={grabando ? 'Grabación en curso' : 'Grabar'}
                        className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full border-2 border-white/25 bg-gradient-to-br from-[#ff5a6e] to-[#c81e4a] text-white shadow-[0_0_0_6px_rgba(227,75,166,0.10),0_18px_40px_-12px_rgba(200,30,74,0.85)] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-75 motion-reduce:transform-none sm:h-24 sm:w-24"
                    >
                        <Mic className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden="true" />
                        {grabando && (
                            <>
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -inset-2 animate-ping rounded-full border-2 border-[#e34ba6]/40 motion-reduce:animate-none"
                                />
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -inset-4 animate-glow rounded-full bg-[#e34ba6]/20 blur-xl motion-reduce:animate-none"
                                />
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={detenerGrabacion}
                        disabled={!grabando}
                        aria-label="Detener grabación"
                        title={grabando ? 'Detener grabación' : 'Sin grabación activa'}
                        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-border bg-white/[0.04] text-texto shadow-inner transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <span className="grid h-6 w-6 place-items-center rounded-[4px] border border-border bg-white/[0.05]">
                            <Square className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                    </button>

                    <div className="relative min-w-[168px] overflow-hidden rounded-2xl border border-border bg-[#0b0813] px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-20px_35px_rgba(0,0,0,0.55)] sm:px-6 sm:py-4">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 opacity-40"
                            style={{
                                backgroundImage:
                                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 4px)',
                            }}
                        />
                        <div className="relative flex items-center justify-between gap-3">
                            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-sutil">
                                {grabando ? 'REC' : 'TIME'}
                            </p>
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    grabando
                                        ? 'animate-pulse bg-[#e34ba6] shadow-[0_0_10px_rgba(227,75,166,0.9)]'
                                        : 'bg-border'
                                }`}
                                aria-hidden="true"
                            />
                        </div>
                        <p className="relative mt-1 whitespace-nowrap font-mono text-[clamp(2rem,5vw,3.25rem)] font-black leading-none tracking-[-0.06em] text-[#f7f4ff] [text-shadow:0_0_16px_rgba(227,75,166,0.55),0_0_42px_rgba(147,101,242,0.45)]">
                            {formatearLcd(lcd)}
                        </p>
                    </div>

                    <div className="min-w-[180px] flex-1">
                        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-sutil">
                            <span>Nivel</span>
                            <span className={grabando ? 'text-[#e34ba6]' : 'text-sutil'}>
                                {grabando ? 'En vivo' : 'En espera'}
                            </span>
                        </div>
                        <div ref={medidorRef} className="flex h-5 items-stretch gap-[3px] sm:h-6" aria-hidden="true">
                            {Array.from({ length: SEGMENTOS_NIVEL }).map((_valor, indice) => (
                                <span
                                    key={indice}
                                    className="flex-1 rounded-[2px] transition-opacity duration-75"
                                    style={{ background: 'rgba(247, 244, 255, 0.5)', opacity: 0.22 }}
                                />
                            ))}
                        </div>
                        <div className="mt-1 flex justify-between font-mono text-[8px] uppercase tracking-wider text-sutil/60">
                            <span>−∞</span>
                            <span>0 dB</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-right">
                        <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                                grabando
                                    ? 'border-[#e34ba6]/40 bg-[#e34ba6]/10 text-[#e34ba6]'
                                    : 'border-border bg-white/[0.03] text-sutil'
                            }`}
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    grabando ? 'animate-pulse bg-[#e34ba6]' : 'bg-border'
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
                className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-surface/50 p-4 backdrop-blur sm:p-5"
                aria-label="Monitor en vivo"
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="workspace-eyebrow mb-0">MONITOR EN VIVO</p>
                    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-sutil">
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                grabando ? 'animate-pulse bg-[#e34ba6]' : 'bg-border'
                            }`}
                            aria-hidden="true"
                        />
                        {grabando ? 'Señal del micrófono' : 'Sin señal'}
                    </span>
                </div>
                <div className="relative mt-2 h-20 overflow-hidden rounded-xl border border-border bg-[#0b0813] sm:h-24">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-70"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(147,101,242,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(147,101,242,0.08) 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                        }}
                    />
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
                    <div className="relative mt-4 overflow-hidden rounded-2xl border border-dashed border-accent/30 bg-gradient-to-br from-accent/[0.08] via-surface/40 to-magenta/[0.08] px-6 py-12 text-center">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[#9365f2]/15 blur-3xl"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-16 left-6 h-40 w-40 rounded-full bg-[#e34ba6]/15 blur-3xl"
                        />
                        <div className="relative mx-auto grid max-w-md gap-4">
                            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent-soft">
                                <Sparkles className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-lg font-bold text-texto-soft">Tu primera pista te espera</p>
                                <p className="mt-1 text-xs text-sutil">
                                    Pulsa el botón rojo y verás la onda en vivo. Las tomas se mantienen en esta sesión
                                    hasta que recargues la página.
                                </p>
                            </div>
                            <div
                                aria-hidden="true"
                                className="flex h-24 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-[#0b0813] px-4"
                            >
                                {ALTURAS_ESTADO_VACIO.map((altura, indice) => (
                                    <span
                                        key={indice}
                                        className="w-1.5 rounded-full opacity-60"
                                        style={{
                                            height: `${altura}%`,
                                            backgroundImage: 'linear-gradient(180deg, #9365f2, #e34ba6)',
                                        }}
                                    />
                                ))}
                            </div>
                            <span className="justify-self-center rounded-full border border-border bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-sutil">
                                REC · 00:00.0
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 grid gap-3">
                        {tomas.map((toma, indice) => {
                            const activa = tomaActivaId === toma.id;
                            const sonando = activa && reproduciendo;
                            return (
                                <article
                                    key={toma.id}
                                    className={`grid overflow-hidden rounded-xl border transition sm:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)] ${
                                        activa
                                            ? 'border-accent/50 bg-surface shadow-[0_0_0_1px_rgba(147,101,242,0.25),0_20px_50px_-32px_rgba(227,75,166,0.75)]'
                                            : 'border-border bg-surface/40 hover:border-accent/30'
                                    }`}
                                >
                                    <div className="relative flex flex-col gap-3 border-b border-border/60 p-3.5 sm:border-b-0 sm:border-r">
                                        <span
                                            aria-hidden="true"
                                            className={`absolute inset-y-0 left-0 w-1 ${
                                                activa
                                                    ? 'bg-gradient-to-b from-[#9365f2] to-[#e34ba6]'
                                                    : 'bg-border'
                                            }`}
                                        />
                                        <div className="flex items-start justify-between gap-2 pl-2">
                                            <div className="min-w-0">
                                                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sutil">
                                                    Pista {String(indice + 1).padStart(2, '0')}
                                                </p>
                                                <p className="truncate text-sm font-bold text-texto-soft">
                                                    Toma {indice + 1}
                                                </p>
                                            </div>
                                            <span
                                                aria-hidden="true"
                                                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                                    sonando
                                                        ? 'animate-pulse bg-[#e34ba6] shadow-[0_0_12px_rgba(227,75,166,0.85)]'
                                                        : activa
                                                          ? 'bg-accent'
                                                          : 'bg-border'
                                                }`}
                                            />
                                        </div>

                                        <p className="pl-2 text-[11px] text-sutil">
                                            {formatearDuracion(toma.duracion)} ·{' '}
                                            {extensionDe(toma.mime).toUpperCase()} ·{' '}
                                            {new Date(toma.creadaEn).toLocaleTimeString('es-ES', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>

                                        <div className="mt-auto flex items-center gap-2 pl-2">
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
                                                title={sonando ? 'Pausar' : 'Reproducir'}
                                                className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition ${
                                                    sonando
                                                        ? 'border-[#e34ba6]/60 bg-[#e34ba6]/15 text-[#e34ba6]'
                                                        : 'border-border bg-white/[0.04] text-texto hover:border-accent/60 hover:text-accent'
                                                }`}
                                            >
                                                {sonando ? (
                                                    <Pause className="h-4 w-4" aria-hidden="true" />
                                                ) : (
                                                    <Play className="h-4 w-4" aria-hidden="true" />
                                                )}
                                            </button>

                                            <a
                                                href={toma.url}
                                                download={nombreArchivo(toma.mime, toma.creadaEn)}
                                                aria-label={`Descargar toma ${indice + 1}`}
                                                title="Descargar"
                                                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-white/[0.04] text-sutil transition hover:border-accent/60 hover:text-accent"
                                            >
                                                <Download className="h-4 w-4" aria-hidden="true" />
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() => borrarToma(toma)}
                                                aria-label={`Borrar toma ${indice + 1}`}
                                                title="Borrar"
                                                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-white/[0.04] text-sutil transition hover:border-peligro/50 hover:bg-peligro/10 hover:text-peligro-soft"
                                            >
                                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="min-w-0 bg-[#0b0813] p-2.5 sm:p-3">
                                        <OndaToma
                                            picos={toma.picos}
                                            progreso={activa ? progreso : 0}
                                            duracion={toma.duracion}
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
