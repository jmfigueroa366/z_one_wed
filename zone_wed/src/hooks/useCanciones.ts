// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { cancionRepo } from '../repositories/cancionRepo.ts';
import { proyectoRepo } from '../repositories/proyectoRepo.ts';

export function useCanciones(proyectoId: number | string | null | undefined) {
    const [canciones, setCanciones] = useState(() =>
        proyectoId === null || proyectoId === undefined ? [] : cancionRepo.listarPorProyecto(proyectoId)
    );

    useEffect(() => {
        if (proyectoId === null || proyectoId === undefined) {
            return undefined;
        }
        return ReactiveStore.suscribirse(() => setCanciones(cancionRepo.listarPorProyecto(proyectoId)));
    }, [proyectoId]);

    return [canciones, setCanciones] as const;
}

function cancionesDeUsuario(usuarioId: number | string | null | undefined) {
    const idsProyectos = new Set(proyectoRepo.listarPorUsuario(usuarioId).map((proyecto) => String(proyecto.id)));
    return cancionRepo.listar().filter((cancion) => idsProyectos.has(String(cancion.proyecto_id)));
}

export function useCancionesDeUsuario(usuarioId: number | string | null | undefined) {
    const [canciones, setCanciones] = useState(() => cancionesDeUsuario(usuarioId));

    useEffect(
        () => ReactiveStore.suscribirse(() => setCanciones(cancionesDeUsuario(usuarioId))),
        [usuarioId]
    );

    return [canciones, setCanciones] as const;
}

export default useCanciones;