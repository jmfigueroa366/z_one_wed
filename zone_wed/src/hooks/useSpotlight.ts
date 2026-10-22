// CAPA: Presentación
import { useCallback, useRef } from 'react';
import type { MouseEvent } from 'react';

export function useSpotlight<T extends HTMLElement = HTMLElement>() {
    const ref = useRef<T | null>(null);

    const onMouseMove = useCallback((evento: MouseEvent<HTMLElement>) => {
        const el = ref.current;
        if (!el) return;
        const caja = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${evento.clientX - caja.left}px`);
        el.style.setProperty('--my', `${evento.clientY - caja.top}px`);
    }, []);

    return [ref, onMouseMove] as const;
}

export default useSpotlight;
