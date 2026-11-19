// CAPA: Presentación
import { useEffect, useRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

interface OndaTomaProps {
    picos: number[];
    progreso: number;
    duracion?: number;
    onSeek?: (fraccion: number) => void;
    className?: string;
}

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

function limitar(valor: number): number {
    return Math.min(Math.max(valor, 0), 1);
}

function formatearMarca(segundos: number): string {
    const total = Math.max(0, Math.round(segundos));
    const minutos = Math.floor(total / 60);
    const resto = total % 60;
    return `${minutos}:${String(resto).padStart(2, '0')}`;
}

export default function OndaToma({ picos, progreso, duracion, onSeek, className = '' }: OndaTomaProps) {
    const contenedorRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const diapason = duracion !== undefined && duracion > 0 ? duracion : 0;

    useEffect(() => {
        const contenedor = contenedorRef.current;
        const canvas = canvasRef.current;
        if (!contenedor || !canvas) return undefined;

        let animacion = 0;

        const dibujar = () => {
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
            const avance = limitar(progreso);

            if (avance > 0) {
                ctx.fillStyle = 'rgba(63, 132, 197, 0.08)';
                ctx.fillRect(0, 0, avance * ancho, alto);
            }

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, centro + 0.5);
            ctx.lineTo(ancho, centro + 0.5);
            ctx.stroke();

            const barras = Math.min(120, Math.max(1, picos.length));
            const paso = ancho / barras;
            const anchoBarra = Math.max(1.5, Math.min(5, paso * 0.58));
            const corte = Math.round(avance * barras);
            const alturaMax = Math.max(1, centro - 22);
            const gradiente = ctx.createLinearGradient(0, 0, ancho, 0);
            gradiente.addColorStop(0, '#9365f2');
            gradiente.addColorStop(0.5, '#c457c4');
            gradiente.addColorStop(1, '#e34ba6');

            const valorBarra = (indice: number): number => {
                const desde = Math.floor((indice / barras) * picos.length);
                const hasta = Math.max(desde + 1, Math.floor(((indice + 1) / barras) * picos.length));
                let valor = 0;
                for (let j = desde; j < hasta; j += 1) {
                    const pico = limitar(picos[j] ?? 0);
                    if (pico > valor) valor = pico;
                }
                return valor;
            };

            const dibujarBarras = (desde: number, hasta: number) => {
                for (let i = desde; i < hasta; i += 1) {
                    const media = Math.max(1.2, valorBarra(i) * alturaMax);
                    const x = i * paso + (paso - anchoBarra) / 2;
                    trazarCapsula(ctx, x, centro - media - 0.75, anchoBarra, media);
                    trazarCapsula(ctx, x, centro + 0.75, anchoBarra, media);
                }
            };

            ctx.beginPath();
            dibujarBarras(0, barras);
            ctx.save();
            ctx.globalAlpha = 0.38;
            ctx.fillStyle = gradiente;
            ctx.fill();
            ctx.restore();

            if (corte > 0) {
                ctx.beginPath();
                dibujarBarras(0, corte);
                ctx.save();
                ctx.shadowColor = 'rgba(143, 188, 230, 0.55)';
                ctx.shadowBlur = 14;
                ctx.fillStyle = gradiente;
                ctx.fill();
                ctx.restore();
            }

            const xProgreso = avance * ancho;
            ctx.save();
            ctx.shadowColor = 'rgba(143, 188, 230, 0.9)';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#f7f4ff';
            ctx.fillRect(xProgreso - 1, 0, 2, alto);
            ctx.beginPath();
            ctx.fillStyle = '#e34ba6';
            ctx.arc(xProgreso, 5, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        const programar = () => {
            cancelAnimationFrame(animacion);
            animacion = requestAnimationFrame(dibujar);
        };

        const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(programar) : null;
        observador?.observe(contenedor);
        programar();

        return () => {
            cancelAnimationFrame(animacion);
            observador?.disconnect();
        };
    }, [picos, progreso]);

    const alHacerClic = (evento: MouseEvent<HTMLDivElement>) => {
        if (!onSeek) return;
        const rect = evento.currentTarget.getBoundingClientRect();
        if (rect.width === 0) return;
        onSeek(limitar((evento.clientX - rect.left) / rect.width));
    };

    const alTeclear = (evento: KeyboardEvent<HTMLDivElement>) => {
        if (!onSeek) return;
        if (evento.key === 'ArrowRight' || evento.key === 'ArrowUp') {
            evento.preventDefault();
            onSeek(Math.min(1, progreso + 0.05));
        } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowDown') {
            evento.preventDefault();
            onSeek(Math.max(0, progreso - 0.05));
        } else if (evento.key === 'Home') {
            evento.preventDefault();
            onSeek(0);
        } else if (evento.key === 'End') {
            evento.preventDefault();
            onSeek(1);
        }
    };

    return (
        <div className={`w-full ${className}`}>
            <div
                ref={contenedorRef}
                className={`relative h-32 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-bg/80 sm:h-40 ${
                    onSeek ? 'cursor-pointer' : ''
                }`}
                onClick={alHacerClic}
                onKeyDown={onSeek ? alTeclear : undefined}
                role={onSeek ? 'slider' : undefined}
                tabIndex={onSeek ? 0 : undefined}
                aria-label={onSeek ? 'Posición de la toma' : 'Onda de audio de la toma'}
                aria-valuemin={onSeek ? 0 : undefined}
                aria-valuemax={onSeek ? 100 : undefined}
                aria-valuenow={onSeek ? Math.round(limitar(progreso) * 100) : undefined}
                aria-valuetext={onSeek ? `${Math.round(limitar(progreso) * 100)} por ciento` : undefined}
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(63,132,197,0.12),transparent_62%)]"
                />
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-2.5 flex items-center justify-between px-3 font-mono text-[9px] leading-none tracking-wider text-sutil/70"
                >
                    <span>0:00</span>
                    <span>{diapason > 0 ? formatearMarca(diapason) : '--:--'}</span>
                </div>
            </div>
        </div>
    );
}
