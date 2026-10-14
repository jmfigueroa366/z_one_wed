// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.js';
import { OrdenService } from '../services/ordenService.js';

export function useOrdenes(usuario) {
    const [ordenes, setOrdenes] = useState(() => OrdenService.listar({ usuario, rol: usuario?.rol }));

    useEffect(
        () => ReactiveStore.suscribirse(() => setOrdenes(OrdenService.listar({ usuario, rol: usuario?.rol }))),
        [usuario?.id, usuario?.rol]
    );

    return [ordenes, setOrdenes];
}

export default useOrdenes;
