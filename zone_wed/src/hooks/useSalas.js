// CAPA: Presentación
import { useState } from 'react';
import { salaRepo } from '../repositories/salaRepo.js';

export function useSalas(soloActivas = false) {
    return useState(() => {
        const salas = salaRepo.listar();
        return soloActivas ? salas.filter((sala) => sala.activo !== false) : salas;
    });
}

export default useSalas;
