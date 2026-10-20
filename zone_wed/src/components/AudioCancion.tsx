import { useState } from 'react';
import { Mic } from 'lucide-react';
import { useGrabaciones } from '../hooks/useGrabaciones.ts';
import GrabadorAudio from './GrabadorAudio.tsx';
import '../styles/tailwind.css';
import type { Cancion } from '../models/Cancion.ts';

interface AudioCancionProps {
    cancion: Cancion;
    estilo: string;
}

export default function AudioCancion({ cancion, estilo }: AudioCancionProps) {
    const [abierto, setAbierto] = useState(false);
    const [grabaciones] = useGrabaciones(cancion.id);
    const partes = cancion.partes ?? [];

    return (
        <>
            <button
                className={`${estilo} gap-2`}
                onClick={() => setAbierto((actual) => !actual)}
                type="button"
                aria-expanded={abierto}
                aria-label={`Audio de ${cancion.nombre}`}
            >
                <Mic className="h-4 w-4" aria-hidden="true" /> Audio{grabaciones.length > 0 ? ` (${grabaciones.length})` : ''}
            </button>

            {abierto && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <GrabadorAudio cancionId={cancion.id as number} parte="" />
                    {partes.map((parte: string) => (
                        <GrabadorAudio key={parte} cancionId={cancion.id as number} parte={parte} />
                    ))}
                </div>
            )}
        </>
    );
}