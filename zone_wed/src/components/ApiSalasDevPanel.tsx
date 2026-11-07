import { useState } from 'react';
import { obtenerSalasApi } from '../lib/apiClient.ts';
import type { SalaApi } from '../lib/apiClient.ts';

export default function ApiSalasDevPanel() {
    const [salas, setSalas] = useState<SalaApi[] | null>(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    async function consultar() {
        setCargando(true);
        setError('');
        try {
            const datos = await obtenerSalasApi();
            console.log('[API C#] salas:', datos);
            setSalas(datos);
        } catch (fallo) {
            const mensaje = fallo instanceof Error ? fallo.message : String(fallo);
            console.error('[API C#] error:', mensaje);
            setError(mensaje);
            setSalas(null);
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-surface/95 p-4 text-sm text-texto-soft shadow-2xl shadow-black/40 backdrop-blur">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-accent-soft">
                Prueba API C# (DEV)
            </p>
            <button
                type="button"
                onClick={consultar}
                disabled={cargando}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {cargando ? 'Consultando...' : 'GET /publico/salas'}
            </button>

            {error && (
                <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {error}
                </p>
            )}

            {salas && (
                <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
                    {salas.length === 0 && <li className="text-xs text-sutil">La API devolvió una lista vacía.</li>}
                    {salas.map((sala) => (
                        <li key={sala.id} className="rounded-lg border border-border bg-white/[0.03] px-3 py-2">
                            <span className="font-bold">{sala.nombre}</span>
                            <span className="ml-2 text-xs text-sutil">
                                ${sala.precioHora}/h · {sala.activo ? 'activa' : 'inactiva'}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
