// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { colaboradorRepo } from '../repositories/colaboradorRepo.ts';

function obtenerColaboradores(soloActivos: boolean) {
    const colaboradores = colaboradorRepo.listar();
    return soloActivos
        ? colaboradores.filter((colaborador) => colaborador.activo !== false)
        : colaboradores;
}

export function useColaboradores(soloActivos = false) {
    const [colaboradores, setColaboradores] = useState(() => obtenerColaboradores(soloActivos));

    useEffect(
        () => ReactiveStore.suscribirse(() => setColaboradores(obtenerColaboradores(soloActivos))),
        [soloActivos]
    );

    return [colaboradores, setColaboradores] as const;
}

export default useColaboradores;