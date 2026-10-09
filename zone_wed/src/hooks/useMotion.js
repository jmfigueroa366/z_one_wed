// CAPA: Presentación
import { useMemo } from 'react';

export function useMotion() {
    return useMemo(() => ({
        animar: (clase = 'fade-in') => clase,
        estilo: { transition: 'all 0.2s ease' },
    }), []);
}

export default useMotion;
