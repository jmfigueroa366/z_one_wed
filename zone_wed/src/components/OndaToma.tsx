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

const MARCAS = [0, 0.25, 0.5, 0.75, 1] as const;
const ESCALA_DB = ['0', '−6', '−12', '−24', '−∞'] as const;

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
                ctx.fillStyle = 'rgba(147, 101, 242, 0.07)';
                ctx.fillRect(0, 0, avance * ancho, alto);
            }

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i += 1) {
                const y = (alto / 4) * i + 0.5;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(ancho, y);
                ctx.stroke();
            }

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
            for (let i = 1; i < 4; i += 1) {
                const x = (ancho / 4) * i + 0.5;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, alto);
                ctx.stroke();
            }

            ctx.strokeStyle = 'rgba(147, 101, 242, 0.25)';
            ctx.beginPath();
            ctx.moveTo(0, centro);
            ctx.lineTo(ancho, centro);
            ctx.stroke();

            const barras = Math.max(1, picos.length);
            const paso = ancho / barras;
            const anchoBarra = Math.max(1, paso * 0.62);
            const corte = Math.round(avance * barras);
            const alturaMax = Math.max(1, (centro - 3) * 0.94);

            const dibujarBarras = (desde: number, hasta: number) => {
                for (let i = desde; i < hasta; i += 1) {
                    const valor = limitar(picos[i] ?? 0);
                    const media = Math.max(1.2, valor * alturaMax);
                    const x = i * paso + (paso - anchoBarra) / 2;
                    ctx.rect(x, centro - media, anchoBarra, Math.max(1, media - 1));
                    ctx.rect(x, centro + 1, anchoBarra, Math.max(1, media - 1));
                }
            };

            ctx.beginPath();
            dibujarBarras(corte, barras);
            ctx.fillStyle = 'rgba(166, 158, 189, 0.24)';
            ctx.fill();

            if (corte > 0) {
                ctx.beginPath();
                dibujarBarras(0, corte);
                const gradiente = ctx.createLinearGradient(0, 0, 0, alto);
                gradiente.addColorStop(0, '#9365f2');
                gradiente.addColorStop(0.5, '#e34ba6');
                gradiente.addColorStop(1, '#9365f2');
                ctx.save();
                ctx.shadowColor = 'rgba(227, 75, 166, 0.55)';
                ctx.shadowBlur = 12;
                ctx.fillStyle = gradiente;
                ctx.fill();
                ctx.restore();
            }

            const xProgreso = avance * ancho;
            ctx.save();
            ctx.shadowColor = 'rgba(227, 75, 166, 0.9)';
            ctx.shadowBlur = 16;
            ctx.fillStyle = '#f7f4ff';
            ctx.fillRect(xProgreso - 1, 0, 2, alto);
            ctx.beginPath();
            ctx.fillStyle = '#e34ba6';
            ctx.arc(xProgreso, 4, 3, 0, Math.PI * 2);
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
            <div aria-hidden="true" className="flex items-end gap-2 pb-1">
                <div className="w-8 shrink-0" />
                <div className="relative h-5 flex-1 border-t border-white/10">
                    {MARCAS.map((marca) => (
                        <span
                            key={marca}
                            className="absolute top-0 -translate-x-1/2"
                            style={{ left: `${marca * 100}%` }}
                        >
                            <span className="block h-1.5 w-px bg-white/25" />
                            <span
                                className={`absolute top-2 whitespace-nowrap font-mono text-[9px] leading-none text-sutil/70 ${
                                    marca === 0
                                        ? 'left-0'
                                        : marca === 1
                                          ? 'right-0'
                                          : 'left-1/2 -translate-x-1/2'
                                }`}
                            >
                                {diapason > 0 ? formatearMarca(diapason * marca) : `${Math.round(marca * 100)}%`}
                            </span>
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                <div
                    aria-hidden="true"
                    className="flex w-8 shrink-0 flex-col justify-between py-0.5 text-right font-mono text-[8px] leading-none text-sutil/60"
                >
                    {ESCALA_DB.map((db) => (
                        <span key={db}>{db}</span>
                    ))}
                </div>

                <div
                    ref={contenedorRef}
                    className={`relative h-40 min-w-0 flex-1 overflow-hidden rounded-xl border border-border/70 bg-[#0b0813] sm:h-48 ${
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
                    <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />
                </div>
            </div>
        </div>
    );
}
