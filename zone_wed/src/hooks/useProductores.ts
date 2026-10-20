// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { ProductorService } from '../services/productorService.ts';

export function useProductores() {
    const [productores, setProductores] = useState(() => ProductorService.listar());

    useEffect(
        () => ReactiveStore.suscribirse(() => setProductores(ProductorService.listar())),
        []
    );

    return [productores, setProductores] as const;
}

export default useProductores;