// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.js';
import { proyectoRepo } from '../repositories/proyectoRepo.js';

export function useProyectos(usuarioId) {
    const [proyectos, setProyectos] = useState(() => proyectoRepo.listarPorUsuario(usuarioId));

    useEffect(
        () => ReactiveStore.suscribirse(() => setProyectos(proyectoRepo.listarPorUsuario(usuarioId))),
        [usuarioId]
    );

    return [proyectos, setProyectos];
}

export default useProyectos;