// CAPA: Presentación
import { useMemo, useState } from 'react';
import { CancionService } from '../services/cancionService.js';
import { ProyectoService } from '../services/proyectoService.js';
import { SesionService } from '../services/sesionService.js';
import { useSalas } from '../hooks/useSalas.js';
import { useSesiones } from '../hooks/useSesiones.js';
import { aMinutos, franjasOcupadas, seSolapan } from '../utils/solicitudes.js';
import { formatearMoneda } from '../utils/helpers.js';
import '../styles/tailwind.css';

const MAX_SESIONES = 8;
const ESTILO_CAMPO = 'w-full rounded-lg border border-border bg-surface-3 px-3 py-2 text-sm text-texto outline-none transition focus:border-accent';
const ETIQUETA = 'mb-1 block text-xs font-semibold tracking-wide text-sutil';
const CHIP_ACTIVO = 'cursor-pointer rounded-full border border-accent bg-accent/20 px-2.5 py-1 text-xs font-medium text-texto transition';
const CHIP_INACTIVO = 'cursor-pointer rounded-full border border-border bg-surface-3 px-2.5 py-1 text-xs text-sutil transition hover:border-accent/50';

function repartirPartes(partes, numeroSesiones) {
    const filas = Array.from({ length: numeroSesiones }, (_, i) => ({
        id: i + 1,
        sala_id: '',
        fecha: '',
        hora_inicio: '09:00',
        hora_fin: '12:00',
        partes: [],
    }));
    (partes ?? []).forEach((parte, i) => filas[i % numeroSesiones].partes.push(parte));
    return filas;
}

export default function RegistroGrabacionSesiones({ productor, onCerrar }) {
    const [sesiones] = useSesiones();
    const [salas] = useSalas(true);
    const [canciones] = useState(() => CancionService.listar());
    const [proyectos] = useState(() => ProyectoService.listar());

    const [cancion_id, setCancion_id] = useState('');
    const [numSesiones, setNumSesiones] = useState(2);
    const [filas, setFilas] = useState([]);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const cancion = useMemo(
        () => canciones.find((c) => String(c.id) === String(cancion_id)) ?? null,
        [canciones, cancion_id]
    );
    const proyectoDeCancion = useMemo(
        () => proyectos.find((p) => p.canciones?.some((c) => String(c) === String(cancion_id))),
        [proyectos, cancion_id]
    );

    const elegirCancion = (id) => {
        setCancion_id(id);
        setError('');
        setMensaje('');
        const seleccionada = canciones.find((c) => String(c.id) === String(id));
        setFilas(id ? repartirPartes(seleccionada?.partes ?? [], numSesiones) : []);
    };

    const cambiarNumeroSesiones = (numero) => {
        const cantidad = Math.min(MAX_SESIONES, Math.max(1, Number(numero) || 1));
        setNumSesiones(cantidad);
        setError('');
        setMensaje('');
        setFilas((actual) =>
            repartirPartes(cancion?.partes ?? [], cantidad).map((fila, i) => {
                const previa = actual[i];
                return previa
                    ? { ...fila, sala_id: previa.sala_id, fecha: previa.fecha, hora_inicio: previa.hora_inicio, hora_fin: previa.hora_fin }
                    : fila;
            })
        );
    };

    const alternarParte = (filaId, parte) => {
        setFilas((actual) =>
            actual.map((fila) =>
                fila.id === filaId
                    ? { ...fila, partes: fila.partes.includes(parte) ? fila.partes.filter((p) => p !== parte) : [...fila.partes, parte] }
                    : fila
            )
        );
    };

    const cambiarCampoFila = (filaId, campo, valor) => {
        setFilas((actual) => actual.map((fila) => (fila.id === filaId ? { ...fila, [campo]: valor } : fila)));
    };

    const crearSesiones = (event) => {
        event.preventDefault();
        setError('');
        setMensaje('');

        if (!cancion) {
            setError('Elige una canción para dividir la grabación.');
            return;
        }

        const partes = cancion.partes ?? [];
        if (partes.length === 0) {
            setError('La canción no tiene partes. Agrégales partes en "Mis proyectos" antes de dividir la grabación.');
            return;
        }

        const conteo = new Map();
        filas.forEach((fila) => fila.partes.forEach((parte) => conteo.set(parte, (conteo.get(parte) ?? 0) + 1)));
        const noAsignadas = partes.filter((parte) => !conteo.has(parte));
        const duplicadas = [...conteo.keys()].filter((parte) => conteo.get(parte) > 1);

        if (duplicadas.length > 0) {
            setError(`Estas partes quedaron en más de una sesión: ${duplicadas.join(', ')}.`);
            return;
        }
        if (noAsignadas.length > 0) {
            setError(`Estas partes quedaron sin sesión: ${noAsignadas.join(', ')}.`);
            return;
        }

        for (const fila of filas) {
            if (!fila.sala_id) return setError(`Sesión ${fila.id}: elige la cabina.`);
            if (!fila.fecha) return setError(`Sesión ${fila.id}: elige la fecha.`);
            if (!Number.isFinite(aMinutos(fila.hora_inicio)) || !Number.isFinite(aMinutos(fila.hora_fin)) || aMinutos(fila.hora_fin) <= aMinutos(fila.hora_inicio)) {
                return setError(`Sesión ${fila.id}: la franja de horas es inválida.`);
            }
        }

        const choqueEntreNuevas = filas.find((fila, indice) =>
            filas.slice(indice + 1).some((otra) =>
                String(otra.sala_id) === String(fila.sala_id)
                && otra.fecha === fila.fecha
                && seSolapan(`${fila.hora_inicio}-${fila.hora_fin}`, `${otra.hora_inicio}-${otra.hora_fin}`)
            )
        );
        if (choqueEntreNuevas) {
            setError('Las sesiones se solapan entre sí. Revisa cabinas y franjas.');
            return;
        }

        for (const fila of filas) {
            const ocupadas = franjasOcupadas({ fecha: fila.fecha, salaId: fila.sala_id, sesiones });
            const choque = ocupadas.find((franja) => seSolapan(franja, `${fila.hora_inicio}-${fila.hora_fin}`));
            if (choque) {
                setError(`Sesión ${fila.id}: la cabina ya está ocupada esa fecha en la franja ${choque}.`);
                return;
            }
        }

        filas.forEach((fila) => {
            SesionService.crear({
                titulo: `Grabación ${cancion.nombre}${proyectoDeCancion ? ` · ${proyectoDeCancion.nombre}` : ''} · Sesión ${fila.id}`,
                sala_id: Number(fila.sala_id),
                colaborador_id: productor.id,
                fecha: fila.fecha,
                hora_inicio: fila.hora_inicio,
                hora_fin: fila.hora_fin,
                estado: 'pendiente',
                cancion_id: cancion.id,
                partes: [...fila.partes],
            });
        });

        setMensaje(`Se crearon ${filas.length} sesiones de grabación para "${cancion.nombre}".`);
        setCancion_id('');
        setFilas([]);
        setNumSesiones(2);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
            onClick={onCerrar}
            role="presentation"
        >
            <form
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
                onSubmit={crearSesiones}
            >
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold tracking-widest uppercase text-accent">Grabación por sesiones</p>
                        <h2 className="mt-1 text-xl font-bold text-texto">
                            {productor?.nombre}
                        </h2>
                        <p className="mt-1 text-sm text-sutil">
                            Divide la grabación de una canción repartiendo sus partes en varias sesiones de estudio.
                        </p>
                    </div>
                    <button className="rounded-lg p-2 text-sutil transition hover:bg-surface-2 hover:text-texto" type="button" onClick={onCerrar} aria-label="Cerrar">
                        ✕
                    </button>
                </div>

                {error && (
                    <p className="mb-4 rounded-lg border border-peligro/40 bg-peligro/10 px-3 py-2 text-sm text-peligro" role="alert">
                        {error}
                    </p>
                )}
                {mensaje && (
                    <p className="mb-4 rounded-lg border border-exito/40 bg-exito/10 px-3 py-2 text-sm text-exito" role="status">
                        {mensaje}
                    </p>
                )}

                {canciones.length > 0 ? (
                    <div className="mb-5 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="grabacion-cancion" className={ETIQUETA}>
                                Canción a grabar
                            </label>
                            <select
                                id="grabacion-cancion"
                                className={ESTILO_CAMPO}
                                value={cancion_id}
                                onChange={(event) => elegirCancion(event.target.value)}
                            >
                                <option value="">Elegir canción…</option>
                                {canciones.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre}
                                        {proyectos.find((p) => p.canciones?.some((id) => String(id) === String(c.id)))
                                            ? ` · ${proyectos.find((p) => p.canciones?.some((id) => String(id) === String(c.id))).nombre}`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="grabacion-sesiones" className={ETIQUETA}>
                                Nº de sesiones
                            </label>
                            <input
                                id="grabacion-sesiones"
                                className={ESTILO_CAMPO}
                                type="number"
                                min="1"
                                max={MAX_SESIONES}
                                value={numSesiones}
                                onChange={(event) => cambiarNumeroSesiones(event.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="mb-5 rounded-lg border border-aviso/40 bg-aviso/10 px-3 py-2 text-sm text-aviso">
                        No hay canciones registradas. Agrégales una canción con partes al cliente desde "Mis proyectos".
                    </p>
                )}

                {cancion && filas.length > 0 && (
                    <div className="mb-5 space-y-4">
                        {filas.map((fila) => (
                            <fieldset className="rounded-xl border border-border bg-surface-2 p-4" key={fila.id}>
                                <legend className="px-1 text-sm font-semibold text-texto">Sesión {fila.id}</legend>

                                <div className="mb-3 flex flex-wrap gap-2">
                                    {(cancion.partes ?? []).map((parte) => {
                                        const activa = fila.partes.includes(parte);
                                        return (
                                            <button
                                                className={activa ? CHIP_ACTIVO : CHIP_INACTIVO}
                                                key={parte}
                                                type="button"
                                                onClick={() => alternarParte(fila.id, parte)}
                                                aria-pressed={activa}
                                            >
                                                {parte}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label htmlFor={`sesion-${fila.id}-sala`} className={ETIQUETA}>Cabina</label>
                                        <select
                                            id={`sesion-${fila.id}-sala`}
                                            className={ESTILO_CAMPO}
                                            value={fila.sala_id}
                                            onChange={(event) => cambiarCampoFila(fila.id, 'sala_id', event.target.value)}
                                        >
                                            <option value="">Elegir cabina…</option>
                                            {salas.map((sala) => (
                                                <option key={sala.id} value={sala.id}>
                                                    {sala.nombre} · {formatearMoneda(sala.precio_hora)}/hora
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor={`sesion-${fila.id}-fecha`} className={ETIQUETA}>Fecha</label>
                                        <input
                                            id={`sesion-${fila.id}-fecha`}
                                            className={ESTILO_CAMPO}
                                            type="date"
                                            value={fila.fecha}
                                            onChange={(event) => cambiarCampoFila(fila.id, 'fecha', event.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`sesion-${fila.id}-ini`} className={ETIQUETA}>Inicio</label>
                                        <input
                                            id={`sesion-${fila.id}-ini`}
                                            className={ESTILO_CAMPO}
                                            type="time"
                                            value={fila.hora_inicio}
                                            onChange={(event) => cambiarCampoFila(fila.id, 'hora_inicio', event.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`sesion-${fila.id}-fin`} className={ETIQUETA}>Fin</label>
                                        <input
                                            id={`sesion-${fila.id}-fin`}
                                            className={ESTILO_CAMPO}
                                            type="time"
                                            value={fila.hora_fin}
                                            onChange={(event) => cambiarCampoFila(fila.id, 'hora_fin', event.target.value)}
                                        />
                                    </div>
                                </div>
                            </fieldset>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        className="rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-sutil transition hover:border-accent/60 hover:text-texto"
                        type="button"
                        onClick={onCerrar}
                    >
                        Cancelar
                    </button>
                    <button
                        className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-bg transition hover:brightness-110"
                        type="submit"
                        disabled={!cancion || filas.length === 0}
                    >
                        Crear {numSesiones} {numSesiones === 1 ? 'sesión' : 'sesiones'}
                    </button>
                </div>
            </form>
        </div>
    );
}