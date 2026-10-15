// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.js';
import { proyectoRepo } from '../repositories/proyectoRepo.js';

export function useProyectos(usuarioId) {
    const listar = () => (usuarioId == null ? proyectoRepo.listar() : proyectoRepo.listarPorUsuario(usuarioId));
    const [proyectos, setProyectos] = useState(listar);

    useEffect(
        () => ReactiveStore.suscribirse(() => setProyectos(listar())),
        [usuarioId]
    );

    return [proyectos, setProyectos];
}

export default useProyectos;