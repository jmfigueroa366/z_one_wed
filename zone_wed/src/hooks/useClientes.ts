// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { clienteRepo } from '../repositories/clienteRepo.ts';

export function useClientes() {
    const [clientes, setClientes] = useState(() => clienteRepo.listar());

    useEffect(() => {
        let vigente = true;
        const refrescar = () => {
            if (vigente) {
                setClientes(clienteRepo.listar());
            }
        };
        refrescar();
        void clienteRepo.sincronizar().then(refrescar);
        const desuscribir = ReactiveStore.suscribirse(refrescar);
        return () => {
            vigente = false;
            desuscribir();
        };
    }, []);

    return [clientes, setClientes] as const;
}

export default useClientes;
