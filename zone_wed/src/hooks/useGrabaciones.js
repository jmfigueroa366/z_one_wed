// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.js';
import { GrabacionService } from '../services/grabacionService.js';

export function useGrabaciones(cancionId = null) {
    const [grabaciones, setGrabaciones] = useState(() =>
        cancionId ? GrabacionService.listarPorCancion(cancionId) : GrabacionService.listar()
    );

    useEffect(
        () =>
            ReactiveStore.suscribirse(() =>
                setGrabaciones(cancionId ? GrabacionService.listarPorCancion(cancionId) : GrabacionService.listar())
            ),
        [cancionId]
    );

    return [grabaciones, setGrabaciones];
}

export default useGrabaciones;