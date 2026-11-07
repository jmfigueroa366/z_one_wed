import { useCallback, useEffect, useState } from 'react';

interface ResultadoApi<T> {
    datos: T | null;
    error: string | null;
    cargando: boolean;
    recargar: () => void;
}

export function useApi<T>(cargador: () => Promise<T>): ResultadoApi<T> {
    const [datos, setDatos] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(true);

    const recargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const resultado = await cargador();
            setDatos(resultado);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No pudimos cargar la información.');
        } finally {
            setCargando(false);
        }
    }, [cargador]);

    useEffect(() => {
        void recargar();
    }, [recargar]);

    return { datos, error, cargando, recargar };
}

export default useApi;
