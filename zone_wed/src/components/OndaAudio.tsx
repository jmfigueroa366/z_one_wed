// CAPA: Presentación
import { useCallback, useEffect, useRef } from 'react';
import '../styles/tailwind.css';

const ACENTO_DEFECTO = '#a477ff';
const VACIO = 'rgba(255, 255, 255, 0.14)';

function prepararLienzo(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const ratio = window.devicePixelRatio || 1;
    const ancho = canvas.clientWidth || 1;
    const alto = canvas.clientHeight || 1;
    canvas.width = Math.max(1, Math.round(ancho * ratio));
    canvas.height = Math.max(1, Math.round(alto * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, ancho, alto };
}

function lineaCentral(ctx: CanvasRenderingContext2D, ancho: number, alto: number) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, alto / 2);
    ctx.lineTo(ancho, alto / 2);
    ctx.stroke();
}

interface OndaGrabacionProps {
    obtenerNivel?: () => Uint8Array | null;
    grabando: boolean;
    acento?: string;
    alto?: number;
}

export function OndaGrabacion({ obtenerNivel, grabando, acento = ACENTO_DEFECTO, alto = 72 }: OndaGrabacionProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const dibujar = () => {
            const { ctx, ancho, alto: altoReal } = prepararLienzo(canvas);
            ctx.clearRect(0, 0, ancho, altoReal);
            lineaCentral(ctx, ancho, altoReal);

            const datos = obtenerNivel?.();
            if (datos && datos.length) {
                ctx.strokeStyle = acento;
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';
                const paso = ancho / (datos.length - 1);
                ctx.beginPath();
                for (let i = 0; i < datos.length; i += 1) {
                    const valor = (datos[i] - 128) / 128;
                    const y = altoReal / 2 + valor * (altoReal / 2 - 4);
                    const x = i * paso;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            rafRef.current = requestAnimationFrame(dibujar);
        };

        if (grabando) {
            rafRef.current = requestAnimationFrame(dibujar);
        } else {
            const { ctx, ancho, alto: altoReal } = prepararLienzo(canvas);
            ctx.clearRect(0, 0, ancho, altoReal);
            lineaCentral(ctx, ancho, altoReal);
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [grabando, obtenerNivel, acento]);

    return (
        <canvas
            ref={canvasRef}
            role="img"
            aria-label={grabando ? 'Onda de la grabación en vivo' : 'Onda en espera'}
            className="w-full rounded-lg border border-border/60 bg-black/30"
            style={{ height: alto }}
        />
    );
}

interface OndaEstaticaProps {
    peaks?: number[] | null;
    progreso?: number;
    acento?: string;
    alto?: number;
    onSeek?: (fraccion: number) => void;
    etiqueta?: string;
}

export function OndaEstatica({ peaks, progreso = 0, acento = ACENTO_DEFECTO, alto = 72, onSeek, etiqueta = 'Onda del audio grabado' }: OndaEstaticaProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const dibujar = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { ctx, ancho, alto: altoReal } = prepararLienzo(canvas);
        ctx.clearRect(0, 0, ancho, altoReal);
        lineaCentral(ctx, ancho, altoReal);

        const lista = peaks?.length ? peaks : Array.from({ length: 96 }, () => 0.06);
        const columnas = lista.length;
        const anchoColumna = ancho / columnas;
        const barra = Math.max(1, anchoColumna * 0.62);
        const limite = Math.round(columnas * Math.min(1, Math.max(0, progreso)));

        for (let i = 0; i < columnas; i += 1) {
            const amplitud = Math.max(0.03, lista[i]) * (altoReal / 2 - 4);
            const x = i * anchoColumna + (anchoColumna - barra) / 2;
            const centro = altoReal / 2;
            ctx.fillStyle = i < limite ? acento : VACIO;
            ctx.beginPath();
            ctx.roundRect(x, centro - amplitud, barra, amplitud * 2, Math.min(barra / 2, 2));
            ctx.fill();
        }
    }, [peaks, progreso, acento]);

    useEffect(() => {
        dibujar();
        const alRedimensionar = () => dibujar();
        window.addEventListener('resize', alRedimensionar);
        return () => window.removeEventListener('resize', alRedimensionar);
    }, [dibujar]);

    const alClic = (evento: React.MouseEvent<HTMLCanvasElement>) => {
        if (!onSeek) return;
        const rect = evento.currentTarget.getBoundingClientRect();
        const fraccion = Math.min(1, Math.max(0, (evento.clientX - rect.left) / rect.width));
        onSeek(fraccion);
    };

    return (
        <canvas
            ref={canvasRef}
            onClick={alClic}
            role={onSeek ? 'slider' : 'img'}
            aria-label={etiqueta}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((progreso || 0) * 100)}
            tabIndex={onSeek ? 0 : undefined}
            className={`w-full rounded-lg border border-border/60 bg-black/30 ${onSeek ? 'cursor-pointer' : ''}`}
            style={{ height: alto }}
        />
    );
}

function peaksDeBuffer(buffer: AudioBuffer, columnas = 96) {
    const datos = buffer.getChannelData(0);
    const tam = Math.max(1, Math.floor(datos.length / columnas));
    const peaks: number[] = [];
    for (let i = 0; i < columnas; i += 1) {
        let pico = 0;
        const inicio = i * tam;
        for (let j = 0; j < tam; j += 1) {
            const valor = Math.abs(datos[inicio + j] ?? 0);
            if (valor > pico) pico = valor;
        }
        peaks.push(pico);
    }
    const maximo = Math.max(...peaks, 0.0001);
    return peaks.map((pico) => pico / maximo);
}

export async function extraerPeaks(blob: Blob, columnas = 96) {
    const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : null;
    if (!AudioCtx || !blob) return null;
    const contexto = new AudioCtx();
    try {
        const buffer = await contexto.decodeAudioData(await blob.arrayBuffer());
        return peaksDeBuffer(buffer, columnas);
    } catch {
        return null;
    } finally {
        contexto.close?.();
    }
}

export async function peaksDeDataUrl(dataUrl: string, columnas = 96) {
    if (!dataUrl) return null;
    try {
        const respuesta = await fetch(dataUrl);
        return await extraerPeaks(await respuesta.blob(), columnas);
    } catch {
        return null;
    }
}

export default OndaEstatica;
