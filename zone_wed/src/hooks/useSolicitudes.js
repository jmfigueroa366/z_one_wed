// CAPA: Presentación
import { useState } from 'react';
import { SolicitudService } from '../services/solicitudService.js';

export function useSolicitudes() {
    return useState(() => SolicitudService.listar());
}

export default useSolicitudes;
