// CAPA: Presentación
import { useState } from 'react';
import { SesionService } from '../services/sesionService.js';

export function useSesiones() {
    return useState(() => SesionService.listar());
}

export default useSesiones;
