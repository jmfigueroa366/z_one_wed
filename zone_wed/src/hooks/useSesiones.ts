// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { SesionService } from '../services/sesionService.ts';

export function useSesiones() {
    const [sesiones, setSesiones] = useState(() => SesionService.listar());

    useEffect(
        () => ReactiveStore.suscribirse(() => setSesiones(SesionService.listar())),
        []
    );

    return [sesiones, setSesiones] as const;
}

export default useSesiones;