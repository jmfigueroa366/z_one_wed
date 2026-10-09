// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.js';
import { colaboradorRepo } from '../repositories/colaboradorRepo.js';

function obtenerColaboradores(soloActivos) {
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

    return [colaboradores, setColaboradores];
}

export default useColaboradores;