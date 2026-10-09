// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.js';
import { cancionRepo } from '../repositories/cancionRepo.js';
import { proyectoRepo } from '../repositories/proyectoRepo.js';

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

function cancionesDeUsuario(usuarioId) {
    const idsProyectos = new Set(proyectoRepo.listarPorUsuario(usuarioId).map((proyecto) => String(proyecto.id)));
    return cancionRepo.listar().filter((cancion) => idsProyectos.has(String(cancion.proyecto_id)));
}

export function useCancionesDeUsuario(usuarioId) {
    const [canciones, setCanciones] = useState(() => cancionesDeUsuario(usuarioId));

    useEffect(
        () => ReactiveStore.suscribirse(() => setCanciones(cancionesDeUsuario(usuarioId))),
        [usuarioId]
    );

    return [canciones, setCanciones];
}

export default useCanciones;