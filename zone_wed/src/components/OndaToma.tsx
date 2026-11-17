// CAPA: Presentación
import { useEffect, useRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

interface OndaTomaProps {
    picos: number[];
    progreso: number;
    onSeek?: (fraccion: number) => void;
    className?: string;
}

export default function OndaToma({ picos, progreso, onSeek, className = '' }: OndaTomaProps) {
    const contenedorRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
            const barras = Math.max(1, picos.length);
            const paso = ancho / barras;
            const anchoBarra = Math.max(1, paso * 0.6);
            const avance = Math.min(Math.max(progreso, 0), 1);
            const corte = Math.round(avance * barras);

            for (let i = 0; i < barras; i += 1) {
                const valor = Math.min(Math.max(picos[i] ?? 0, 0), 1);
                const altura = Math.max(2, valor * alto * 0.88);
                const x = i * paso + (paso - anchoBarra) / 2;
                const y = centro - altura / 2;

                if (i < corte) {
                    const gradiente = ctx.createLinearGradient(0, y, 0, y + altura);
                    gradiente.addColorStop(0, '#f04fa6');
                    gradiente.addColorStop(1, '#a477ff');
                    ctx.fillStyle = gradiente;
                } else {
                    ctx.fillStyle = 'rgba(166, 158, 189, 0.32)';
                }
                ctx.fillRect(x, y, anchoBarra, altura);
            }

            const xProgreso = avance * ancho;
            ctx.fillStyle = 'rgba(247, 244, 255, 0.9)';
            ctx.fillRect(xProgreso - 1, 0, 2, alto);
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
        onSeek(Math.min(Math.max((evento.clientX - rect.left) / rect.width, 0), 1));
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
        <div
            ref={contenedorRef}
            className={`relative h-16 w-full ${onSeek ? 'cursor-pointer' : ''} ${className}`}
            onClick={alHacerClic}
            onKeyDown={onSeek ? alTeclear : undefined}
            role={onSeek ? 'slider' : undefined}
            tabIndex={onSeek ? 0 : undefined}
            aria-label={onSeek ? 'Posición de la toma' : undefined}
            aria-valuemin={onSeek ? 0 : undefined}
            aria-valuemax={onSeek ? 100 : undefined}
            aria-valuenow={onSeek ? Math.round(Math.min(Math.max(progreso, 0), 1) * 100) : undefined}
        >
            <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />
        </div>
    );
}
