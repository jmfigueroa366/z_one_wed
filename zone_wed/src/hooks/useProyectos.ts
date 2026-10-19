// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { proyectoRepo } from '../repositories/proyectoRepo.ts';

export function useProyectos(usuarioId: number | string | null | undefined) {
    const listar = () => (usuarioId == null ? proyectoRepo.listar() : proyectoRepo.listarPorUsuario(usuarioId));
    const [proyectos, setProyectos] = useState(listar);

    useEffect(
        () => ReactiveStore.suscribirse(() => setProyectos(listar())),
        [usuarioId]
    );

    return [proyectos, setProyectos] as const;
}

export default useProyectos;