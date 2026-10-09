// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.js';
import { SolicitudService } from '../services/solicitudService.js';

export function useSolicitudes() {
    const [solicitudes, setSolicitudes] = useState(() => SolicitudService.listar());

    useEffect(
        () => ReactiveStore.suscribirse(() => setSolicitudes(SolicitudService.listar())),
        []
    );

    return [solicitudes, setSolicitudes];
}

export default useSolicitudes;