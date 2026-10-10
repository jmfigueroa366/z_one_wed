// CAPA: Presentación
import { useEffect, useRef } from 'react';
import anime from 'animejs';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Contador({ valor, sufijo = '', pad = 0 }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const objetivo = Number(valor) || 0;
        const formatear = (n) => `${pad ? String(n).padStart(pad, '0') : String(n)}${sufijo}`;
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
            update() {
                el.textContent = formatear(estado.actual);
            },
        });
        return () => animacion.pause();
    }, [valor, sufijo, pad]);

    return <span ref={ref}>{(pad ? String(0).padStart(pad, '0') : '0') + sufijo}</span>;
}

export function Ecualizador({ desde = '#e34ba6', hasta = '#9365f2', alto = 32 }) {
    const ref = useRef(null);

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

export default { Contador, Ecualizador };
