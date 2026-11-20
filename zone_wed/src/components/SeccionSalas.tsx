// CAPA: Presentación
// Gestión de salas para el administrador: listar, crear, editar y activar/desactivar.
// Habla directo con la API (/admin/salas) y después refresca la caché pública,
// que solo contiene salas activas (Catálogo, Agenda y selectores).
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Building2, Pencil, Plus, Power } from 'lucide-react';
import { actualizarSala, crearSala, listarSalasAdmin } from '../api/salasApi.ts';
import type { SalaApi } from '../api/salasApi.ts';
import { refrescarSalas } from '../repositories/salaRepo.ts';
import { formatearMoneda } from '../utils/helpers.ts';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, CAMPO, ETIQUETA } from '../styles/clases.ts';
import '../styles/tailwind.css';

const TARJETA = 'tarjeta-brillo relative overflow-hidden rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur transition duration-300 hover:border-accent/40';

function mensajeDe(error: unknown, porDefecto: string): string {
    return error instanceof Error && error.message ? error.message : porDefecto;
}

export default function SeccionSalas() {
    const [salas, setSalas] = useState<SalaApi[]>([]);
    const [cargando, setCargando] = useState(true);
    const [errorLista, setErrorLista] = useState('');
    const [mensaje, setMensaje] = useState('');

    const [formAbierto, setFormAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState('');

    const cargar = useCallback(async () => {
        setCargando(true);
        setErrorLista('');
        try {
            setSalas(await listarSalasAdmin());
        } catch (error) {
            setErrorLista(mensajeDe(error, 'No se pudieron cargar las salas.'));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    const abrirNueva = () => {
        setEditandoId(null);
        setNombre('');
        setPrecio('');
        setErrorForm('');
        setMensaje('');
        setFormAbierto(true);
    };

    const abrirEditar = (sala: SalaApi) => {
        setEditandoId(sala.id);
        setNombre(sala.nombre);
        setPrecio(String(sala.precioHora));
        setErrorForm('');
        setMensaje('');
        setFormAbierto(true);
    };

    const cerrarForm = () => {
        setFormAbierto(false);
        setEditandoId(null);
        setErrorForm('');
    };

    const guardar = async (evento: FormEvent<HTMLFormElement>) => {
        evento.preventDefault();
        if (guardando) return;

        const nombreLimpio = nombre.trim();
        const precioNumero = Number(precio);
        if (!nombreLimpio) {
            setErrorForm('Escribe el nombre de la sala.');
            return;
        }
        if (!Number.isFinite(precioNumero) || precioNumero <= 0) {
            setErrorForm('El precio por hora debe ser un número mayor que 0.');
            return;
        }

        setGuardando(true);
        setErrorForm('');
        try {
            const actual = editandoId == null ? undefined : salas.find((s) => s.id === editandoId);
            const request = {
                nombre: nombreLimpio,
                precioHora: precioNumero,
                activo: actual ? actual.activo !== false : true,
            };
            if (editandoId == null) {
                await crearSala(request);
            } else {
                await actualizarSala(editandoId, request);
            }
            await refrescarSalas();
            await cargar();
            setMensaje(editandoId == null ? 'Sala creada.' : 'Sala actualizada.');
            cerrarForm();
        } catch (error) {
            setErrorForm(mensajeDe(error, 'No se pudo guardar la sala.'));
        } finally {
            setGuardando(false);
        }
    };

    const alternarActiva = async (sala: SalaApi) => {
        const activa = sala.activo !== false;
        const pregunta = activa
            ? `¿Desactivar "${sala.nombre}"? Dejará de aparecer en el catálogo y en los selectores.`
            : `¿Activar "${sala.nombre}"? Volverá a aparecer en el catálogo y en los selectores.`;
        if (!window.confirm(pregunta)) return;

        setErrorLista('');
        setMensaje('');
        try {
            await actualizarSala(sala.id, {
                nombre: sala.nombre,
                precioHora: sala.precioHora,
                activo: !activa,
            });
            await refrescarSalas();
            await cargar();
            setMensaje(activa ? 'Sala desactivada.' : 'Sala activada.');
        } catch (error) {
            setErrorLista(mensajeDe(error, 'No se pudo cambiar el estado de la sala.'));
        }
    };

    return (
        <section className={TARJETA} data-page-section="salas">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secundario text-texto shadow-lg" aria-hidden="true">
                        <Building2 className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="workspace-eyebrow">ESTUDIO</p>
                        <h2 className="mt-0.5 text-lg font-bold tracking-tight text-texto-soft">Salas</h2>
                    </div>
                </div>
                {!formAbierto && (
                    <button className={BOTON_PRIMARIO} type="button" onClick={abrirNueva}>
                        <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Nueva sala
                    </button>
                )}
            </div>

            {mensaje && (
                <p className="mb-4 rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">{mensaje}</p>
            )}
            {errorLista && (
                <p className="mb-4 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">{errorLista}</p>
            )}

            {formAbierto && (
                <form className="mb-5 grid gap-4 rounded-2xl border border-accent/25 bg-black/20 p-4" onSubmit={guardar} noValidate>
                    <p className="text-sm font-bold text-texto-soft">
                        {editandoId == null ? 'Nueva sala' : 'Editar sala'}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="flex flex-col">
                            <span className={ETIQUETA}>Nombre</span>
                            <input
                                className={CAMPO}
                                type="text"
                                value={nombre}
                                maxLength={120}
                                onChange={(e) => setNombre(e.target.value)}
                                disabled={guardando}
                                autoFocus
                            />
                        </label>
                        <label className="flex flex-col">
                            <span className={ETIQUETA}>Precio por hora</span>
                            <input
                                className={CAMPO}
                                type="number"
                                min="1"
                                step="any"
                                value={precio}
                                onChange={(e) => setPrecio(e.target.value)}
                                disabled={guardando}
                            />
                        </label>
                    </div>
                    {errorForm && (
                        <p className="rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">{errorForm}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                        <button className={BOTON_PRIMARIO} type="submit" disabled={guardando}>
                            {guardando ? 'Guardando…' : editandoId == null ? 'Crear sala' : 'Guardar cambios'}
                        </button>
                        <button className={BOTON_SECUNDARIO} type="button" onClick={cerrarForm} disabled={guardando}>
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {cargando && <p className="text-sm text-sutil">Cargando salas…</p>}

            {!cargando && !errorLista && salas.length === 0 && (
                <p className="text-sm text-sutil">Todavía no hay salas. Crea la primera con «Nueva sala».</p>
            )}

            {!cargando && salas.length > 0 && (
                <ul className="grid gap-3">
                    {salas.map((sala) => {
                        const activa = sala.activo !== false;
                        return (
                            <li
                                key={sala.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-bold text-texto-soft">
                                        {sala.nombre}
                                        {!activa && (
                                            <span className="ml-2 rounded-full border border-peligro/30 bg-peligro/10 px-2 py-0.5 text-xs font-bold text-peligro-soft">
                                                Inactiva
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-sm text-sutil">{formatearMoneda(sala.precioHora)} por hora</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button className={BOTON_SECUNDARIO} type="button" onClick={() => abrirEditar(sala)}>
                                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Editar
                                    </button>
                                    <button className={BOTON_SECUNDARIO} type="button" onClick={() => void alternarActiva(sala)}>
                                        <Power className="mr-2 h-4 w-4" aria-hidden="true" /> {activa ? 'Desactivar' : 'Activar'}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}