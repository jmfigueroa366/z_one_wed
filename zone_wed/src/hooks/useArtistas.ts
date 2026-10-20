// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { ArtistaService } from '../services/artistaService.ts';

export function useArtistas() {
    const [artistas, setArtistas] = useState(() => ArtistaService.listar());

    useEffect(
        () => ReactiveStore.suscribirse(() => setArtistas(ArtistaService.listar())),
        []
    );

    return [artistas, setArtistas] as const;
}

export default useArtistas;