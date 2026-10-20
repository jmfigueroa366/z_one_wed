// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { SolicitudService } from '../services/solicitudService.ts';

export function useSolicitudes() {
    const [solicitudes, setSolicitudes] = useState(() => SolicitudService.listar());

    useEffect(
        () => ReactiveStore.suscribirse(() => setSolicitudes(SolicitudService.listar())),
        []
    );

    return [solicitudes, setSolicitudes] as const;
}

export default useSolicitudes;