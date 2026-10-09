// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.js';
import { cancionRepo } from '../repositories/cancionRepo.js';

export function useCanciones(proyectoId) {
    const [canciones, setCanciones] = useState(() =>
        proyectoId === null || proyectoId === undefined ? [] : cancionRepo.listarPorProyecto(proyectoId)
    );

    useEffect(() => {
        if (proyectoId === null || proyectoId === undefined) {
            return undefined;
        }
        return ReactiveStore.suscribirse(() => setCanciones(cancionRepo.listarPorProyecto(proyectoId)));
    }, [proyectoId]);

    return [canciones, setCanciones];
}

export default useCanciones;