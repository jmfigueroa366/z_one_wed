// CAPA: Presentación
import { useCallback } from 'react';

export function useInteracciones() {
    const manejarClick = useCallback((accion, evento) => {
        if (typeof accion === 'function') {
            accion(evento);
        }
    }, []);

    return {
        manejarClick,
    };
}

export default useInteracciones;
