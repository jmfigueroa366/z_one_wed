// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { GrabacionService } from '../services/grabacionService.ts';

export function useGrabaciones(cancionId: number | string | null = null) {
    const [grabaciones, setGrabaciones] = useState(() =>
        cancionId ? GrabacionService.listarPorCancion(cancionId) : GrabacionService.listar()
    );

    useEffect(() => {
        const refrescar = () =>
            setGrabaciones(cancionId ? GrabacionService.listarPorCancion(cancionId) : GrabacionService.listar());
        refrescar();
        return ReactiveStore.suscribirse(refrescar);
    }, [cancionId]);

    return [grabaciones, setGrabaciones] as const;
}

export default useGrabaciones;