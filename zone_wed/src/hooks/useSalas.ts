// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { salaRepo } from '../repositories/salaRepo.ts';

function obtenerSalas(soloActivas: boolean) {
    const salas = salaRepo.listar();
    return soloActivas ? salas.filter((sala) => sala.activo !== false) : salas;
}

export function useSalas(soloActivas = false) {
    const [salas, setSalas] = useState(() => obtenerSalas(soloActivas));

    useEffect(
        () => ReactiveStore.suscribirse(() => setSalas(obtenerSalas(soloActivas))),
        [soloActivas]
    );

    return [salas, setSalas] as const;
}

export default useSalas;