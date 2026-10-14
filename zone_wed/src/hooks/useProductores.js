// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.js';
import { ProductorService } from '../services/productorService.js';

export function useProductores() {
    const [productores, setProductores] = useState(() => ProductorService.listar());

    useEffect(
        () => ReactiveStore.suscribirse(() => setProductores(ProductorService.listar())),
        []
    );

    return [productores, setProductores];
}

export default useProductores;