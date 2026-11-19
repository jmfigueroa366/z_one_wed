// CAPA: Presentación
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, Download, Link2, Mic, Pause, Play, Sparkles, Square, Trash2 } from 'lucide-react';
import OndaToma from '../components/OndaToma.tsx';
import { listarSolicitudes } from '../api/solicitudesApi.ts';
import type { SolicitudResumenDto } from '../api/solicitudesApi.ts';
import { useApi } from '../hooks/useApi.ts';
import '../styles/tailwind.css';

interface SolicitudToma {
    id: number;
    titulo: string;
    cliente: string;
}

interface Toma {
    id: string;
    url: string;
    duracion: number;
    picos: number[];
    mime: string;
    creadaEn: number;
    solicitud: SolicitudToma | null;
    numeroToma: number;
}

const MIME_PREFERIDOS = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
];

const BARRAS_ONDA = 180;
const BARRAS_MONITOR = 48;
const ALTURAS_ESTADO_VACIO = [12, 24, 16, 38, 28, 54, 36, 68, 46, 82, 58, 92, 66, 78, 50, 72, 40, 60, 30, 48, 22, 34, 16, 26];

function trazarCapsula(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    ancho: number,
    alto: number,
): void {
    const radio = Math.min(ancho / 2, alto / 2);
    const derecha = x + ancho;
    const abajo = y + alto;
    ctx.moveTo(x + radio, y);
    ctx.lineTo(derecha - radio, y);
    ctx.arcTo(derecha, y, derecha, y + radio, radio);
    ctx.lineTo(derecha, abajo - radio);
    ctx.arcTo(derecha, abajo, derecha - radio, abajo, radio);
    ctx.lineTo(x + radio, abajo);
    ctx.arcTo(x, abajo, x, abajo - radio, radio);
    ctx.lineTo(x, y + radio);
    ctx.arcTo(x, y, x + radio, y, radio);
}

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

function slugificar(texto: string): string {
    return (
        texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'solicitud'
    );
}

function nombreArchivo(toma: Toma): string {
    const extension = extensionDe(toma.mime);
    if (toma.solicitud) {
        const slug = slugificar(toma.solicitud.titulo);
        return `solicitud-${toma.solicitud.id}-${slug}-toma${toma.numeroToma}.${extension}`;
    }
    return `sin-solicitud-toma${toma.numeroToma}.${extension}`;
}

function etiquetaSolicitud(solicitud: SolicitudResumenDto): string {
    const titulo = solicitud.titulo?.trim() || `Solicitud ${solicitud.id}`;
    return `${titulo} — ${solicitud.cliente}`;
}

function siguienteNumeroToma(tomas: Toma[], solicitudId: number | null): number {
    let maximo = 0;
    for (const toma of tomas) {
        if ((toma.solicitud?.id ?? null) === solicitudId) {
            maximo = Math.max(maximo, toma.numeroToma ?? 0);
        }
    }
    return maximo + 1;
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
    const [solicitudSeleccionadaId, setSolicitudSeleccionadaId] = useState<number | null>(null);
    const [selectorAbierto, setSelectorAbierto] = useState(false);

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
    const solicitudGrabacionRef = useRef<SolicitudToma | null>(null);
    const selectorSolicitudRef = useRef<HTMLDivElement | null>(null);

    const cargarSolicitudes = useCallback(() => listarSolicitudes({ tamano: 100 }), []);
    const {
        datos: paginaSolicitudes,
        error: errorSolicitudes,
        cargando: cargandoSolicitudes,
    } = useApi(cargarSolicitudes);

    const solicitudesDisponibles = useMemo(() => {
        const items = paginaSolicitudes?.items ?? [];
        const confirmadas = items.filter(
            (solicitud) => (solicitud.estado ?? '').toLowerCase() === 'confirmada',
        );
        if (confirmadas.length > 0) return confirmadas;
        return items.filter(
            (solicitud) => !['rechazada', 'cancelada'].includes((solicitud.estado ?? '').toLowerCase()),
        );
    }, [paginaSolicitudes]);

    const solicitudSeleccionada = useMemo(
        () => solicitudesDisponibles.find((solicitud) => solicitud.id === solicitudSeleccionadaId) ?? null,
        [solicitudesDisponibles, solicitudSeleccionadaId],
    );

    const tituloSeleccionado = solicitudSeleccionada
        ? solicitudSeleccionada.titulo?.trim() || `Solicitud ${solicitudSeleccionada.id}`
        : 'Sin solicitud';
    const detalleSeleccionado = solicitudSeleccionada?.cliente ?? 'Grabación libre';

    useEffect(() => {
        if (!selectorAbierto) return undefined;

        const cerrarFuera = (evento: PointerEvent) => {
            if (selectorSolicitudRef.current?.contains(evento.target as Node)) return;
            setSelectorAbierto(false);
        };
        const cerrarConEscape = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') setSelectorAbierto(false);
        };

        document.addEventListener('pointerdown', cerrarFuera);
        document.addEventListener('keydown', cerrarConEscape);
        return () => {
            document.removeEventListener('pointerdown', cerrarFuera);
            document.removeEventListener('keydown', cerrarConEscape);
        };
    }, [selectorAbierto]);

    useEffect(() => {
        if (grabando) setSelectorAbierto(false);
    }, [grabando]);

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
        const relleno = medidorRef.current;
        if (!relleno) return;
        const porcentaje = Math.round(Math.min(Math.max(nivel, 0), 1) * 100);
        relleno.style.width = `${porcentaje}%`;
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

        const paso = ancho / BARRAS_MONITOR;
        const anchoBarra = Math.max(2, Math.min(6, paso * 0.55));
        const alturaBase = Math.max(2, Math.min(7, alto * 0.05));
        const gradiente = ctx.createLinearGradient(0, 0, ancho, 0);
        gradiente.addColorStop(0, '#9365f2');
        gradiente.addColorStop(0.5, '#c457c4');
        gradiente.addColorStop(1, '#e34ba6');

        ctx.beginPath();
        for (let i = 0; i < BARRAS_MONITOR; i += 1) {
            const ondulacion = 0.45 + 0.55 * Math.abs(Math.sin(i * 0.55));
            const altura = Math.max(2, Math.min(alto * 0.16, alturaBase * (0.6 + ondulacion)));
            const x = i * paso + (paso - anchoBarra) / 2;
            trazarCapsula(ctx, x, alto / 2 - altura / 2, anchoBarra, altura);
        }
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = gradiente;
        ctx.fill();
        ctx.restore();
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

        const centro = alto / 2;
        const paso = ancho / BARRAS_MONITOR;
        const anchoBarra = Math.max(2, Math.min(7, paso * 0.6));
        const alturaMax = Math.max(4, centro - 10);
        const gradiente = ctx.createLinearGradient(0, 0, ancho, 0);
        gradiente.addColorStop(0, '#9365f2');
        gradiente.addColorStop(0.5, '#c457c4');
        gradiente.addColorStop(1, '#e34ba6');

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centro + 0.5);
        ctx.lineTo(ancho, centro + 0.5);
        ctx.stroke();

        ctx.beginPath();
        for (let i = 0; i < BARRAS_MONITOR; i += 1) {
            const inicio = Math.floor((i / BARRAS_MONITOR) * datos.length);
            const fin = Math.max(inicio + 1, Math.floor(((i + 1) / BARRAS_MONITOR) * datos.length));
            let pico = 0;
            for (let j = inicio; j < fin; j += 1) {
                const valor = Math.abs((datos[j] - 128) / 128);
                if (valor > pico) pico = valor;
            }
            const amplitud = Math.max(0.02, Math.min(1, Math.pow(pico, 0.75) * 1.8));
            const media = Math.max(1.5, amplitud * alturaMax);
            const x = i * paso + (paso - anchoBarra) / 2;
            const hueco = 1.5;
            trazarCapsula(ctx, x, centro - hueco - media, anchoBarra, media);
            trazarCapsula(ctx, x, centro + hueco, anchoBarra, media);
        }
        ctx.save();
        ctx.shadowColor = 'rgba(143, 188, 230, 0.55)';
        ctx.shadowBlur = 16;
        ctx.fillStyle = gradiente;
        ctx.fill();
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
        const solicitudToma = solicitudGrabacionRef.current;
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
        const base: Omit<Toma, 'numeroToma'> = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            url,
            duracion: duracion > 0 ? duracion : duracionGrabada,
            picos,
            mime: mimeReal,
            creadaEn: Date.now(),
            solicitud: solicitudToma,
        };
        setTomas((actual) => [
            ...actual,
            { ...base, numeroToma: siguienteNumeroToma(actual, base.solicitud?.id ?? null) },
        ]);
    };

    const iniciarGrabacion = async () => {
        if (grabando) return;
        setError('');
        audioRef.current?.pause();

        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setError('Tu navegador no soporta la grabación de audio. Prueba con Chrome, Edge o Firefox actualizados.');
            return;
        }

        solicitudGrabacionRef.current = solicitudSeleccionada
            ? {
                  id: solicitudSeleccionada.id,
                  titulo: solicitudSeleccionada.titulo,
                  cliente: solicitudSeleccionada.cliente,
              }
            : null;

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
    const estado = grabando ? 'Grabando' : reproduciendo ? 'Reproduciendo' : 'Listo';
    const chipEstado = grabando
        ? 'border-accent-soft/40 bg-accent-soft/10 text-accent-soft'
        : reproduciendo
          ? 'border-accent/40 bg-accent/10 text-accent-soft'
          : 'border-border bg-white/[0.03] text-sutil';
    const puntoEstado = grabando ? 'animate-pulse bg-accent-soft' : reproduciendo ? 'bg-accent' : 'bg-border';

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
                className="relative mt-6 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.03] px-5 py-8 shadow-[0_40px_120px_-60px_rgba(63,132,197,0.9)] backdrop-blur-2xl sm:px-8 sm:py-10"
                aria-label="Grabación de audio"
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-28 left-6 h-60 w-60 rounded-full bg-accent-soft/15 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />

                <div className="relative flex flex-col items-center gap-6 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            void iniciarGrabacion();
                        }}
                        disabled={grabando}
                        aria-label="Grabar"
                        title={grabando ? 'Grabación en curso' : 'Grabar'}
                        className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full border-2 border-white/25 bg-gradient-to-br from-[#ff5a6e] to-[#c81e4a] text-white shadow-[0_0_0_8px_rgba(143,188,230,0.08),0_24px_60px_-18px_rgba(200,30,74,0.9)] transition hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-80 motion-reduce:transform-none sm:h-32 sm:w-32"
                    >
                        <Mic className="h-10 w-10 sm:h-11 sm:w-11" aria-hidden="true" />
                        {grabando && (
                            <>
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -inset-2 animate-ping rounded-full border border-accent-soft/40 motion-reduce:animate-none"
                                />
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -inset-5 animate-ping rounded-full border border-accent/30 [animation-delay:0.6s] motion-reduce:animate-none"
                                />
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -inset-8 animate-glow rounded-full bg-accent-soft/15 blur-2xl motion-reduce:animate-none"
                                />
                            </>
                        )}
                    </button>

                    <div className="w-full">
                        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-sutil">Tiempo</p>
                        <p className="texto-degradado mt-1 whitespace-nowrap font-mono text-[clamp(3rem,12vw,7rem)] font-black leading-none tracking-[-0.07em] motion-reduce:animate-none">
                            {formatearLcd(lcd)}
                        </p>
                    </div>

                    <div ref={selectorSolicitudRef} className="w-full max-w-md text-left">
                        <span id="solicitud-etiqueta" className="text-[10px] font-bold uppercase tracking-[0.25em] text-sutil">
                            Solicitud de la toma
                        </span>
                        <button
                            type="button"
                            onClick={() => setSelectorAbierto((abierto) => !abierto)}
                            disabled={grabando}
                            title={
                                solicitudSeleccionada ? etiquetaSolicitud(solicitudSeleccionada) : 'Sin solicitud'
                            }
                            aria-haspopup="listbox"
                            aria-expanded={selectorAbierto}
                            aria-controls="solicitud-opciones"
                            aria-labelledby="solicitud-etiqueta solicitud-valor"
                            aria-describedby="solicitud-ayuda"
                            className={`mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition duration-300 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                                selectorAbierto
                                    ? 'border-accent/60 bg-accent/[0.08] shadow-[0_0_0_3px_rgba(63,132,197,0.12)]'
                                    : 'border-border bg-gradient-to-r from-white/[0.06] to-white/[0.02] hover:border-accent/45'
                            }`}
                        >
                            <span className="flex min-w-0 items-center gap-3">
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent-soft">
                                    <Link2 className="h-4 w-4" aria-hidden="true" />
                                </span>
                                <span className="min-w-0">
                                    <span
                                        id="solicitud-valor"
                                        className="block truncate text-sm font-semibold text-texto-soft"
                                    >
                                        {tituloSeleccionado}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[10px] uppercase tracking-[0.16em] text-sutil">
                                        {detalleSeleccionado}
                                    </span>
                                </span>
                            </span>
                            <ChevronDown
                                aria-hidden="true"
                                className={`h-4 w-4 shrink-0 text-sutil transition-transform duration-300 ${
                                    selectorAbierto ? 'rotate-180 text-accent-soft' : ''
                                }`}
                            />
                        </button>

                        {selectorAbierto && (
                            <div
                                id="solicitud-opciones"
                                role="listbox"
                                aria-labelledby="solicitud-etiqueta"
                                className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-accent/20 bg-surface/95 p-1.5 shadow-[0_30px_80px_-40px_rgba(63,132,197,0.9)] backdrop-blur-xl"
                            >
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={solicitudSeleccionadaId === null}
                                    onClick={() => {
                                        setSolicitudSeleccionadaId(null);
                                        setSelectorAbierto(false);
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                        solicitudSeleccionadaId === null
                                            ? 'bg-accent/[0.12] text-accent-soft'
                                            : 'text-texto hover:bg-white/[0.06]'
                                    }`}
                                >
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-texto-soft">
                                            Sin solicitud
                                        </span>
                                        <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-sutil">
                                            Grabación libre
                                        </span>
                                    </span>
                                    {solicitudSeleccionadaId === null && (
                                        <Check className="h-4 w-4 shrink-0 text-accent-soft" aria-hidden="true" />
                                    )}
                                </button>

                                {solicitudesDisponibles.map((solicitud) => {
                                    const seleccionada = solicitudSeleccionadaId === solicitud.id;
                                    return (
                                        <button
                                            key={solicitud.id}
                                            type="button"
                                            role="option"
                                            aria-label={etiquetaSolicitud(solicitud)}
                                            aria-selected={seleccionada}
                                            onClick={() => {
                                                setSolicitudSeleccionadaId(solicitud.id);
                                                setSelectorAbierto(false);
                                            }}
                                            className={`mt-1 flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                                seleccionada
                                                    ? 'bg-accent/[0.12] text-accent-soft'
                                                    : 'text-texto hover:bg-white/[0.06]'
                                            }`}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-semibold">
                                                    {solicitud.titulo?.trim() || `Solicitud ${solicitud.id}`}
                                                </span>
                                                <span className="mt-0.5 block truncate text-[10px] uppercase tracking-[0.14em] text-sutil">
                                                    {solicitud.cliente}
                                                </span>
                                            </span>
                                            {seleccionada && (
                                                <Check
                                                    className="h-4 w-4 shrink-0 text-accent-soft"
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </button>
                                    );
                                })}

                                {solicitudesDisponibles.length === 0 && (
                                    <p className="px-3 py-4 text-xs text-sutil">
                                        No hay solicitudes disponibles. Puedes grabar sin asociar.
                                    </p>
                                )}
                            </div>
                        )}

                        <p
                            id="solicitud-ayuda"
                            aria-live="polite"
                            title={errorSolicitudes ?? undefined}
                            className={`mt-1.5 min-h-4 text-[10px] leading-4 ${
                                errorSolicitudes ? 'text-accent-soft' : 'text-sutil'
                            }`}
                        >
                            {cargandoSolicitudes
                                ? 'Cargando solicitudes…'
                                : errorSolicitudes
                                  ? 'No se pudieron cargar las solicitudes. Puedes grabar sin asociar.'
                                  : solicitudesDisponibles.length === 0
                                    ? 'No hay solicitudes disponibles; puedes grabar sin asociar.'
                                    : 'La solicitud se fija al iniciar la grabación.'}
                        </p>
                    </div>

                    <div className="w-full max-w-md">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-sutil">
                            <span>Nivel</span>
                            <span className={grabando ? 'text-accent-soft' : 'text-sutil'}>
                                {grabando ? 'En vivo' : 'En espera'}
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                            <div
                                ref={medidorRef}
                                className="h-full w-0 rounded-full bg-gradient-to-r from-accent via-accent to-accent-soft transition-[width] duration-75 ease-out motion-reduce:transition-none"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={detenerGrabacion}
                            disabled={!grabando}
                            aria-label="Detener grabación"
                            title={grabando ? 'Detener grabación' : 'Sin grabación activa'}
                            className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border bg-white/[0.04] text-texto shadow-inner transition hover:border-accent/60 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                        >
                            <Square className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${chipEstado}`}
                        >
                            <span className={`h-2 w-2 rounded-full ${puntoEstado}`} aria-hidden="true" />
                            {estado}
                        </span>
                    </div>

                    {error && (
                        <p
                            className="relative flex w-full max-w-xl items-start gap-2 rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-left text-sm text-peligro-soft"
                            role="alert"
                        >
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>{error}</span>
                        </p>
                    )}
                </div>
            </section>

            <section
                className="relative mt-5 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_40px_120px_-70px_rgba(143,188,230,0.9)] backdrop-blur-2xl sm:p-6"
                aria-label="Monitor en vivo"
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-accent/15 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-accent-soft/15 blur-3xl"
                />

                <div className="relative flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="workspace-eyebrow mb-0">MONITOR EN VIVO</p>
                        <p className="mt-1 text-xs text-sutil">La señal del micrófono, en tiempo real.</p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-sutil">
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                grabando ? 'animate-pulse bg-accent-soft' : 'bg-border'
                            }`}
                            aria-hidden="true"
                        />
                        {grabando ? 'Señal activa' : 'Sin señal'}
                    </span>
                </div>

                <div className="relative mt-4 h-48 overflow-hidden rounded-[1.75rem] border border-white/10 bg-bg/75 sm:h-64 lg:h-72">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_115%,rgba(63,132,197,0.22),transparent_62%)]"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />
                    <canvas ref={vivoCanvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
                    {!grabando && (
                        <div className="absolute inset-0 grid place-items-center px-4 text-center text-xs text-sutil">
                            Pulsa grabar para ver la señal del micrófono en tiempo real.
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
                    <div className="relative mt-4 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-12 text-center backdrop-blur-xl">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-accent/15 blur-3xl"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-16 left-6 h-40 w-40 rounded-full bg-accent-soft/15 blur-3xl"
                        />
                        <div className="relative mx-auto grid max-w-md gap-4">
                            <span className="mx-auto grid h-14 w-14 animate-float place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent-soft motion-reduce:animate-none">
                                <Sparkles className="h-6 w-6" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-lg font-bold text-texto-soft">Tu primera pista te espera</p>
                                <p className="mt-1 text-xs text-sutil">
                                    Pulsa el botón rojo y verás la señal en vivo. Las tomas se mantienen en esta sesión
                                    hasta que recargues la página.
                                </p>
                            </div>
                            <div
                                aria-hidden="true"
                                className="flex h-24 items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-bg/80 px-4"
                            >
                                {ALTURAS_ESTADO_VACIO.map((altura, indice) => (
                                    <span
                                        key={indice}
                                        className="w-1.5 rounded-full opacity-60"
                                        style={{
                                            height: `${altura}%`,
                                            backgroundImage: 'linear-gradient(180deg, #3F84C5, #8FBCE6)',
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
                        {tomas.map((toma) => {
                            const activa = tomaActivaId === toma.id;
                            const sonando = activa && reproduciendo;
                            return (
                                <article
                                    key={toma.id}
                                    className={`relative overflow-hidden rounded-[1.75rem] border p-4 backdrop-blur transition-all duration-300 motion-reduce:transform-none sm:p-5 ${
                                        activa
                                            ? 'border-accent/50 bg-surface/70 shadow-[0_0_0_1px_rgba(63,132,197,0.2),0_30px_70px_-40px_rgba(143,188,230,0.75)]'
                                            : 'border-border/70 bg-surface/40 hover:-translate-y-0.5 hover:border-accent/35 hover:bg-surface/60'
                                    }`}
                                >
                                    {activa && (
                                        <span
                                            aria-hidden="true"
                                            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-soft/70 to-transparent"
                                        />
                                    )}

                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    aria-hidden="true"
                                                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                                        sonando
                                                            ? 'animate-pulse bg-accent-soft shadow-[0_0_12px_rgba(143,188,230,0.85)]'
                                                            : activa
                                                              ? 'bg-accent'
                                                              : 'bg-border'
                                                    }`}
                                                />
                                                <p className="truncate text-sm font-bold text-texto-soft">
                                                    Toma {toma.numeroToma}
                                                </p>
                                                <span
                                                    title={
                                                        toma.solicitud
                                                            ? `${toma.solicitud.titulo} — ${toma.solicitud.cliente}`
                                                            : undefined
                                                    }
                                                    className={`inline-flex max-w-[16rem] items-center truncate rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                                                        toma.solicitud
                                                            ? 'border-accent/30 bg-accent/10 text-accent-soft'
                                                            : 'border-border bg-white/[0.03] text-sutil'
                                                    }`}
                                                >
                                                    {toma.solicitud
                                                        ? `Solicitud · ${toma.solicitud.titulo || `#${toma.solicitud.id}`}`
                                                        : 'Sin solicitud'}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[11px] text-sutil">
                                                {formatearDuracion(toma.duracion)} ·{' '}
                                                {extensionDe(toma.mime).toUpperCase()} ·{' '}
                                                {new Date(toma.creadaEn).toLocaleTimeString('es-ES', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    void alternarReproduccion(toma);
                                                }}
                                                aria-label={
                                                    sonando
                                                        ? `Pausar toma ${toma.numeroToma}`
                                                        : `Reproducir toma ${toma.numeroToma}`
                                                }
                                                title={sonando ? 'Pausar' : 'Reproducir'}
                                                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border transition duration-300 motion-reduce:transition-none ${
                                                    sonando
                                                        ? 'border-transparent bg-primario text-texto shadow-[0_12px_30px_-12px_rgba(11,41,223,0.9)]'
                                                        : activa
                                                          ? 'border-accent/40 bg-accent/10 text-accent-soft hover:border-accent/60'
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
                                                download={nombreArchivo(toma)}
                                                aria-label={`Descargar toma ${toma.numeroToma}`}
                                                title={`Descargar ${nombreArchivo(toma)}`}
                                                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-white/[0.04] text-sutil transition duration-300 hover:border-accent/60 hover:text-accent motion-reduce:transition-none"
                                            >
                                                <Download className="h-4 w-4" aria-hidden="true" />
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() => borrarToma(toma)}
                                                aria-label={`Borrar toma ${toma.numeroToma}`}
                                                title="Borrar"
                                                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-white/[0.04] text-sutil transition duration-300 hover:border-accent-soft/50 hover:bg-accent-soft/10 hover:text-accent-soft motion-reduce:transition-none"
                                            >
                                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-bg/80 p-2.5 sm:p-3">
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
