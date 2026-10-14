// CAPA: Presentación
import { useRef, useState } from 'react';
import { GrabacionService } from '../services/grabacionService.js';
import '../styles/tailwind.css';

const MIME_GRABADOR = (() => {
    if (typeof MediaRecorder === 'undefined') return null;
    return ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find((tipo) =>
        MediaRecorder.isTypeSupported(tipo)
    ) ?? null;
})();

function formatearTiempo(segundos) {
    const total = Math.max(0, Number(segundos) || 0);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function extesionDe(mimeType) {
    return mimeType && mimeType.includes('ogg') ? 'ogg' : 'webm';
}

function nombreDescarga(cancionId, parte) {
    const nombre = parte ? `${parte}` : `Cancion-${cancionId}`;
    return `${nombre.replace(/[^\w]+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}`;
}

export default function GrabadorAudio({ cancionId, parte = '', mostrarEtiqueta = true }) {
    const [grabacion, setGrabacion] = useState(() => GrabacionService.obtener(cancionId, parte));
    const [enGrabacion, setEnGrabacion] = useState(false);
    const [segundos, setSegundos] = useState(0);
    const [clip, setClip] = useState(null);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const grabadorRef = useRef(null);
    const flujoRef = useRef(null);
    const partesRef = useRef([]);
    const inicioRef = useRef(0);
    const temporizadorRef = useRef(null);

    const detenerFlujo = () => {
        flujoRef.current?.getTracks().forEach((pista) => pista.stop());
        flujoRef.current = null;
    };

    const limpiarTemporizador = () => {
        if (temporizadorRef.current) {
            clearInterval(temporizadorRef.current);
            temporizadorRef.current = null;
        }
    };

    const iniciar = async () => {
        setError('');
        setMensaje('');
        if (enGrabacion) return;
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            setError('Este navegador no permite grabar audio desde el micrófono.');
            return;
        }

        try {
            const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
            const grabador = new MediaRecorder(flujo, MIME_GRABADOR ? { mimeType: MIME_GRABADOR } : undefined);
            partesRef.current = [];
            grabador.ondataavailable = (evento) => {
                if (evento.data.size > 0) partesRef.current.push(evento.data);
            };
            grabador.onstop = async () => {
                const blob = new Blob(partesRef.current, { type: grabador.mimeType || 'audio/webm' });
                const url = URL.createObjectURL(blob);
                const duracion = Math.round((Date.now() - inicioRef.current) / 1000);
                const dataUrl = await new Promise((resolver) => {
                    const lector = new FileReader();
                    lector.onload = () => resolver(lector.result);
                    lector.readAsDataURL(blob);
                });
                setClip({ url, dataUrl, duracion, mimeType: grabador.mimeType || 'audio/webm' });
                detenerFlujo();
            };
            grabador.start();
            grabadorRef.current = grabador;
            flujoRef.current = flujo;
            inicioRef.current = Date.now();
            setSegundos(0);
            setEnGrabacion(true);
            temporizadorRef.current = setInterval(
                () => setSegundos(Math.round((Date.now() - inicioRef.current) / 1000)),
                1000
            );
        } catch (errorGrabacion) {
            setError('No se pudo acceder al micrófono. Revisa el permiso del navegador.');
        }
    };

    const detener = () => {
        limpiarTemporizador();
        grabadorRef.current?.stop();
        grabadorRef.current = null;
        setEnGrabacion(false);
        setSegundos(0);
    };

    const guardar = () => {
        if (!clip) return;
        setError('');
        setMensaje('');
        try {
            const registro = GrabacionService.guardar({
                cancion_id: cancionId,
                parte,
                dataUrl: clip.dataUrl,
                duracion: clip.duracion,
            });
            setGrabacion(registro);
            setMensaje('Audio guardado.');
        } catch (errorGuardar) {
            setError('No hay espacio para guardar el audio. Borra otro audio o graba uno más corto.');
        }
    };

    const eliminar = () => {
        setError('');
        setMensaje('');
        GrabacionService.eliminar(cancionId, parte);
        if (clip) {
            URL.revokeObjectURL(clip.url);
            setClip(null);
        }
        setGrabacion(null);
        setMensaje('Audio eliminado.');
    };

    const descargar = () => {
        const dataUrl = clip?.dataUrl ?? grabacion?.dataUrl;
        if (!dataUrl) return;
        const enlace = document.createElement('a');
        enlace.href = dataUrl;
        enlace.download = `${nombreDescarga(cancionId, parte)}.${extesionDe(clip?.mimeType ?? grabacion?.mimeType)}`;
        enlace.click();
    };

    const hayAudio = Boolean(clip || grabacion);
    const fuente = clip?.url ?? grabacion?.dataUrl;
    const etiqueta = parte || 'Canción completa';

    return (
        <div className="rounded-xl border border-border bg-surface-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    {enGrabacion ? (
                        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-peligro" aria-hidden="true" />
                    ) : (
                        <span className="text-sm text-accent" aria-hidden="true">🎙</span>
                    )}
                    {mostrarEtiqueta && (
                        <span className="truncate font-medium text-texto">{etiqueta}</span>
                    )}
                    {enGrabacion && (
                        <span className="shrink-0 text-xs font-semibold text-peligro">
                            {formatearTiempo(segundos)}
                        </span>
                    )}
                    {!enGrabacion && !hayAudio && (
                        <span className="shrink-0 text-xs text-sutil">sin grabar</span>
                    )}
                    {!enGrabacion && grabacion && (
                        <span className="shrink-0 text-xs text-exito">
                            grabado {formatearTiempo(grabacion.duracion)}
                        </span>
                    )}
                </div>

                <div className="flex gap-2">
                    {!enGrabacion ? (
                        <button
                            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-bg transition hover:brightness-110"
                            type="button"
                            onClick={iniciar}
                        >
                            Grabar
                        </button>
                    ) : (
                        <button
                            className="rounded-lg border border-peligro/60 bg-peligro/10 px-3 py-1.5 text-xs font-bold text-peligro transition hover:bg-peligro/20"
                            type="button"
                            onClick={detener}
                        >
                            Detener
                        </button>
                    )}
                    {hayAudio && (
                        <button
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-texto transition hover:border-accent/60"
                            type="button"
                            onClick={descargar}
                        >
                            Descargar
                        </button>
                    )}
                    {grabacion && !clip && (
                        <button
                            className="rounded-lg border border-peligro/50 px-3 py-1.5 text-xs font-semibold text-peligro transition hover:bg-peligro/10"
                            type="button"
                            onClick={eliminar}
                        >
                            Eliminar
                        </button>
                    )}
                </div>
            </div>

            {enGrabacion && (
                <p className="mt-2 text-xs text-sutil">
                    Grabando… Habla y toca <strong className="text-texto">Detener</strong> cuando termines.
                </p>
            )}

            {!enGrabacion && clip && !grabacion && (
                <p className="mt-2 text-xs text-aviso">
                    Audio capturado pero aún no guardado. Toca <strong className="text-texto">Guardar audio</strong>.
                </p>
            )}

            {hayAudio && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <audio className="min-w-0 flex-1" controls src={fuente} preload="metadata" />
                    {clip && (
                        <button
                            className="rounded-lg bg-exito/15 px-3 py-1.5 text-xs font-bold text-exito transition hover:bg-exito/25"
                            type="button"
                            onClick={guardar}
                        >
                            Guardar audio
                        </button>
                    )}
                </div>
            )}

            {error && <p className="mt-2 text-xs text-peligro" role="alert">{error}</p>}
            {mensaje && <p className="mt-2 text-xs text-exito" role="status">{mensaje}</p>}
        </div>
    );
}