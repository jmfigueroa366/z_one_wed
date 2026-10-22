// CAPA: Presentación
import { useEffect, useRef, type CSSProperties } from 'react';
import anime from 'animejs';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface ContadorProps {
    valor: number | string;
    sufijo?: string;
    pad?: number;
}

export function Contador({ valor, sufijo = '', pad = 0 }: ContadorProps) {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const objetivo = Number(valor) || 0;
        const formatear = (n: number) => `${pad ? String(n).padStart(pad, '0') : String(n)}${sufijo}`;
        if (MENOS_MOVIMIENTO()) {
            el.textContent = formatear(objetivo);
            return undefined;
        }
        const estado = { actual: 0 };
        const animacion = anime({
            targets: estado,
            actual: objetivo,
            round: 1,
            duration: 1200,
            easing: 'easeOutExpo',
            update: () => {
                el.textContent = formatear(estado.actual as number);
            },
        });
        return () => animacion.pause();
    }, [valor, sufijo, pad]);

    return <span ref={ref}>{(pad ? String(0).padStart(pad, '0') : '0') + sufijo}</span>;
}

interface EcualizadorProps {
    desde?: string;
    hasta?: string;
    alto?: number;
}

export function Ecualizador({ desde = '#e34ba6', hasta = '#9365f2', alto = 32 }: EcualizadorProps) {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const barras = ref.current?.querySelectorAll('[data-eq]');
        if (!barras || barras.length === 0 || MENOS_MOVIMIENTO()) return undefined;
        const animacion = anime({
            targets: barras,
            scaleY: [0.25, 1],
            duration: 620,
            direction: 'alternate',
            loop: true,
            delay: anime.stagger(90),
            easing: 'easeInOutSine',
        });
        return () => animacion.pause();
    }, []);

    return (
        <span ref={ref} className="flex items-end gap-1" style={{ height: alto }} aria-hidden="true">
            {Array.from({ length: 6 }).map((_, indice) => (
                <span
                    key={indice}
                    data-eq
                    className="w-1.5 origin-bottom rounded-full"
                    style={{
                        height: '100%',
                        transform: 'scaleY(0.3)',
                        background: `linear-gradient(to top, ${desde}, ${hasta})`,
                    }}
                />
            ))}
        </span>
    );
}

interface FondoHeroProps {
    acento?: string;
}

export function FondoHero({ acento = '#f04fa6' }: FondoHeroProps) {
    const particulas = [
        { t: '14%', l: '64%', d: '0s', s: 4 },
        { t: '72%', l: '80%', d: '1.4s', s: 3 },
        { t: '36%', l: '90%', d: '2.6s', s: 4 },
        { t: '82%', l: '48%', d: '0.8s', s: 3 },
    ];

    return (
        <>
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_50%_50%,black,transparent_78%)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/hero:opacity-100 [background:radial-gradient(360px_circle_at_var(--mx,50%)_var(--my,50%),var(--hero-spot,rgba(240,79,166,0.25)),transparent_62%)]"
                style={{ '--hero-spot': `${acento}40` } as CSSProperties & Record<'--hero-spot', string>}
            />
            {particulas.map((p, indice) => (
                <span
                    key={indice}
                    aria-hidden="true"
                    className="pointer-events-none absolute rounded-full bg-white/70 blur-[1px] [animation:flotar_7s_ease-in-out_infinite]"
                    style={{ top: p.t, left: p.l, width: p.s, height: p.s, animationDelay: p.d }}
                />
            ))}
        </>
    );
}

export default { Contador, Ecualizador, FondoHero };
