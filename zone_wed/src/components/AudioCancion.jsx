// CAPA: Presentación
import { useState } from 'react';
import { useGrabaciones } from '../hooks/useGrabaciones.js';
import GrabadorAudio from './GrabadorAudio.jsx';
import '../styles/tailwind.css';

export default function AudioCancion({ cancion, estilo }) {
    const [abierto, setAbierto] = useState(false);
    const [grabaciones] = useGrabaciones(cancion.id);
    const partes = cancion.partes ?? [];

    return (
        <>
            <button
                className={estilo}
                onClick={() => setAbierto((actual) => !actual)}
                type="button"
                aria-expanded={abierto}
                aria-label={`Audio de ${cancion.nombre}`}
            >
                🎙 Audio{grabaciones.length > 0 ? ` (${grabaciones.length})` : ''}
            </button>

            {abierto && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <GrabadorAudio cancionId={cancion.id} parte="" />
                    {partes.map((parte) => (
                        <GrabadorAudio key={parte} cancionId={cancion.id} parte={parte} />
                    ))}
                </div>
            )}
        </>
    );
}