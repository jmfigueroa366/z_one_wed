// CAPA: Presentación
import { useState } from 'react';
import { ArtistaService } from '../services/artistaService.js';

export function useArtistas() {
    return useState(() => ArtistaService.listar());
}

export default useArtistas;