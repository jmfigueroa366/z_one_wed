// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.js';
import { SesionService } from '../services/sesionService.js';

export function useSesiones() {
    const [sesiones, setSesiones] = useState(() => SesionService.listar());

    useEffect(
        () => ReactiveStore.suscribirse(() => setSesiones(SesionService.listar())),
        []
    );

    return [sesiones, setSesiones];
}

export default useSesiones;