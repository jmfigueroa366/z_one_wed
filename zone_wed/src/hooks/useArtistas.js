// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.js';
import { ArtistaService } from '../services/artistaService.js';

export function useArtistas() {
    const [artistas, setArtistas] = useState(() => ArtistaService.listar());

    useEffect(
        () => ReactiveStore.suscribirse(() => setArtistas(ArtistaService.listar())),
        []
    );

    return [artistas, setArtistas];
}

export default useArtistas;