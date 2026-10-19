// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { OrdenService } from '../services/ordenService.ts';
import type { Usuario } from '../models/Usuario.ts';

export function useOrdenes(usuario: Usuario | null | undefined) {
    const [ordenes, setOrdenes] = useState(() => OrdenService.listar({ usuario, rol: usuario?.rol }));

    useEffect(
        () => ReactiveStore.suscribirse(() => setOrdenes(OrdenService.listar({ usuario, rol: usuario?.rol }))),
        [usuario?.id, usuario?.rol]
    );

    return [ordenes, setOrdenes] as const;
}

export default useOrdenes;
