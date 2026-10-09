// CAPA: Presentación
import { useState } from 'react';
import { colaboradorRepo } from '../repositories/colaboradorRepo.js';

export function useColaboradores(soloActivos = false) {
    return useState(() => {
        const colaboradores = colaboradorRepo.listar();
        return soloActivos
            ? colaboradores.filter((colaborador) => colaborador.activo !== false)
            : colaboradores;
    });
}

export default useColaboradores;
