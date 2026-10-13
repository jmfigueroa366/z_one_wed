// CAPA: Presentación
import { useCallback, useRef } from 'react';

export function useSpotlight() {
    const ref = useRef(null);

    const onMouseMove = useCallback((evento) => {
        const el = ref.current;
        if (!el) return;
        const caja = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${evento.clientX - caja.left}px`);
        el.style.setProperty('--my', `${evento.clientY - caja.top}px`);
    }, []);

    return [ref, onMouseMove];
}

export default useSpotlight;
