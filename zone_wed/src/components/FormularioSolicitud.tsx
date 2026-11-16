// CAPA: Presentación
import { useCallback, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { Plus, Send, X } from 'lucide-react';
import { ApiError, obtenerSalasApi } from '../api/apiClient.ts';
import { listarColaboradoresPublicos } from '../api/colaboradoresApi.ts';
import { crearSolicitud } from '../api/solicitudesApi.ts';
import { useApi } from '../hooks/useApi.ts';
import { TIPOS_SOLICITUD } from '../models/Solicitud.ts';
import { aMinutos, etiquetaRol, etiquetaTipo } from '../utils/solicitudes.ts';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, CAMPO, ETIQUETA } from '../styles/clases.ts';
import '../styles/tailwind.css';

const MAX_COLABORADORES = 10;
const MAX_PARTES = 100;
const MAX_LONGITUD_PARTE = 100;
const MAX_DESCRIPCION = 2000;

interface FormularioSolicitudProps {
    onCreada?: () => void;
}

interface EstadoFormulario {
    titulo: string;
    descripcion: string;
    tipo: string;
    salaId: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
}

function fechaLocal(fecha = new Date()): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function crearFormularioInicial(): EstadoFormulario {
    return {
        titulo: '',
        descripcion: '',
        tipo: TIPOS_SOLICITUD.GRABACION,
        salaId: '',
        fecha: fechaLocal(),
        horaInicio: '10:00',
        horaFin: '12:00',
    };
}

function rolDesdePerfil(perfil: string | null | undefined): string | null {
    const valor = String(perfil ?? '').trim().toLowerCase();
    if (valor === 'artista') return 'artista';
    if (valor === 'productor') return 'productor';
    if (valor.startsWith('ingeniero')) return 'ingeniero';
    return null;
}

function erroresDeApi(errors: Record<string, string[]>): Record<string, string> {
    return Object.fromEntries(
        Object.entries(errors).map(([campo, mensajes]) => [campo, mensajes.join(' ')])
    );
}

function validar(formulario: EstadoFormulario, partes: string[], seleccionados: string[]): Record<string, string> {
    const errores: Record<string, string> = {};
    const titulo = formulario.titulo.trim();

    if (!titulo) {
        errores.titulo = 'El título es obligatorio.';
    } else if (titulo.length < 2) {
        errores.titulo = 'El título debe tener al menos 2 caracteres.';
    } else if (titulo.length > 150) {
        errores.titulo = 'El título no puede superar los 150 caracteres.';
    }

    if (formulario.descripcion.trim().length > MAX_DESCRIPCION) {
        errores.descripcion = `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres.`;
    }
    if (!formulario.tipo) {
        errores.tipo = 'Indica el tipo de solicitud.';
    }
    if (!formulario.salaId) {
        errores.salaId = 'Selecciona una sala.';
    }
    if (!formulario.fecha) {
        errores.fechaDeseada = 'Indica la fecha de la reserva.';
    } else if (formulario.fecha < fechaLocal()) {
        errores.fechaDeseada = 'La fecha no puede ser anterior a hoy.';
    }

    const inicio = aMinutos(formulario.horaInicio);
    const fin = aMinutos(formulario.horaFin);
    if (!formulario.horaInicio || !formulario.horaFin || Number.isNaN(inicio) || Number.isNaN(fin)) {
        errores.franja = 'Indica la hora de inicio y la hora de fin.';
    } else if (fin <= inicio) {
        errores.franja = 'La hora de fin debe ser mayor que la de inicio (misma fecha).';
    }

    if (partes.length > MAX_PARTES) {
        errores.partes = `No puedes agregar más de ${MAX_PARTES} partes.`;
    } else if (partes.some((parte) => parte.length > MAX_LONGITUD_PARTE)) {
        errores.partes = `Cada parte puede tener hasta ${MAX_LONGITUD_PARTE} caracteres.`;
    }

    if (seleccionados.length < 1) {
        errores.colaboradores = 'Selecciona al menos un colaborador.';
    } else if (seleccionados.length > MAX_COLABORADORES) {
        errores.colaboradores = `No puedes invitar a más de ${MAX_COLABORADORES} colaboradores.`;
    }

    return errores;
}

export default function FormularioSolicitud({ onCreada }: FormularioSolicitudProps) {
    const cargarSalas = useCallback(() => obtenerSalasApi(), []);
    const cargarColaboradores = useCallback(() => listarColaboradoresPublicos(), []);
    const {
        datos: salas,
        error: errorSalas,
        cargando: cargandoSalas,
        recargar: recargarSalas,
    } = useApi(cargarSalas);
    const {
        datos: colaboradores,
        error: errorColaboradores,
        cargando: cargandoColaboradores,
        recargar: recargarColaboradores,
    } = useApi(cargarColaboradores);

    const [formulario, setFormulario] = useState<EstadoFormulario>(crearFormularioInicial);
    const [partes, setPartes] = useState<string[]>([]);
    const [parteTexto, setParteTexto] = useState('');
    const [seleccionados, setSeleccionados] = useState<string[]>([]);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);

    const cargandoCatalogos = cargandoSalas || cargandoColaboradores;
    const errorCatalogos = [errorSalas, errorColaboradores].filter(Boolean).join(' ');

    const reintentarCatalogos = () => {
        recargarSalas();
        recargarColaboradores();
    };

    const limpiarError = (campo: string) => {
        setErrores((actual) => {
            if (!(campo in actual)) return actual;
            const copia = { ...actual };
            delete copia[campo];
            return copia;
        });
    };

    const cambiarCampo = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormulario((actual) => ({ ...actual, [name]: value }));
        const campoError = name === 'horaInicio' || name === 'horaFin'
            ? 'franja'
            : name === 'fecha'
                ? 'fechaDeseada'
                : name;
        limpiarError(campoError);
        setErrorGeneral('');
        setMensaje('');
    };

    const agregarParte = () => {
        const valor = parteTexto.trim();
        if (!valor) return;
        if (valor.length > MAX_LONGITUD_PARTE) {
            setErrores((actual) => ({
                ...actual,
                partes: `Cada parte puede tener hasta ${MAX_LONGITUD_PARTE} caracteres.`,
            }));
            return;
        }
        if (partes.length >= MAX_PARTES) {
            setErrores((actual) => ({
                ...actual,
                partes: `No puedes agregar más de ${MAX_PARTES} partes.`,
            }));
            return;
        }
        if (partes.includes(valor)) {
            setParteTexto('');
            return;
        }
        setPartes((actual) => [...actual, valor]);
        setParteTexto('');
        limpiarError('partes');
        setMensaje('');
    };

    const quitarParte = (indice: number) => {
        setPartes((actual) => actual.filter((_, posicion) => posicion !== indice));
        limpiarError('partes');
    };

    const manejarTeclaParte = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
            event.preventDefault();
            agregarParte();
        } else if (event.key === 'Backspace' && !parteTexto && partes.length > 0) {
            setPartes((actual) => actual.slice(0, -1));
        }
    };

    const alternarColaborador = (id: string) => {
        setSeleccionados((actual) => {
            if (actual.includes(id)) return actual.filter((item) => item !== id);
            if (actual.length >= MAX_COLABORADORES) return actual;
            return [...actual, id];
        });
        limpiarError('colaboradores');
        setErrorGeneral('');
        setMensaje('');
    };

    const enviar = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (enviando) return;

        setErrorGeneral('');
        setMensaje('');

        const encontrados = validar(formulario, partes, seleccionados);
        setErrores(encontrados);
        if (Object.keys(encontrados).length > 0) return;

        setEnviando(true);
        try {
            const invitaciones = seleccionados.map((colaboradorId) => {
                const colaborador = (colaboradores ?? []).find((item) => item.id === colaboradorId);
                const rol = rolDesdePerfil(colaborador?.perfil);
                return rol ? { colaboradorId, rol } : { colaboradorId };
            });

            await crearSolicitud({
                titulo: formulario.titulo.trim(),
                descripcion: formulario.descripcion.trim() || null,
                tipo: formulario.tipo,
                fechaDeseada: formulario.fecha,
                franja: `${formulario.horaInicio}-${formulario.horaFin}`,
                partes,
                salaId: Number(formulario.salaId),
                colaboradores: invitaciones,
            });

            setMensaje('Solicitud creada correctamente.');
            setErrores({});
            setFormulario(crearFormularioInicial());
            setPartes([]);
            setParteTexto('');
            setSeleccionados([]);
            onCreada?.();
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorGeneral(error.message);
                const erroresCampos = error.errors;
                if (erroresCampos) {
                    setErrores((actual) => ({ ...actual, ...erroresDeApi(erroresCampos) }));
                }
            } else {
                setErrorGeneral(error instanceof Error ? error.message : 'No se pudo crear la solicitud.');
            }
        } finally {
            setEnviando(false);
        }
    };

    return (
        <section
            id="crear-solicitud"
            className="scroll-mt-5 rounded-[2rem] border border-border bg-surface/60 p-5 backdrop-blur sm:p-6"
            aria-labelledby="crear-solicitud-title"
        >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="workspace-eyebrow">NUEVA SOLICITUD</p>
                    <h2 id="crear-solicitud-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                        Reserva tu sesión
                    </h2>
                </div>
                <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-white shadow-lg"
                    aria-hidden="true"
                >
                    <Send className="h-4 w-4" />
                </span>
            </div>
            <p className="mb-4 text-sm leading-6 text-sutil">
                Indica qué necesitas, cuándo y con quién. El equipo confirmará la disponibilidad.
            </p>

            {cargandoCatalogos && (
                <p className="mb-4 rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-sm text-sutil" role="status">
                    Cargando salas y colaboradores…
                </p>
            )}

            {errorCatalogos && (
                <div
                    className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft"
                    role="alert"
                >
                    <span>{errorCatalogos}</span>
                    <button
                        type="button"
                        onClick={reintentarCatalogos}
                        className="rounded-lg border border-peligro/40 px-3 py-1.5 text-xs font-bold transition hover:bg-peligro/10"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            <form className="grid gap-4" onSubmit={enviar} noValidate>
                <label className="grid min-w-0 gap-2">
                    <span className={ETIQUETA}>Título *</span>
                    <input
                        className={CAMPO}
                        maxLength={150}
                        name="titulo"
                        onChange={cambiarCampo}
                        placeholder="Ej. Grabación de nuevo sencillo"
                        required
                        value={formulario.titulo}
                    />
                    {errores.titulo && <span className="text-xs text-peligro-soft" role="alert">{errores.titulo}</span>}
                </label>

                <label className="grid min-w-0 gap-2">
                    <span className={ETIQUETA}>
                        Descripción <span className="font-normal text-sutil">(opcional)</span>
                    </span>
                    <textarea
                        className={CAMPO}
                        maxLength={MAX_DESCRIPCION}
                        name="descripcion"
                        onChange={cambiarCampo}
                        placeholder="Cuéntanos qué quieres lograr en la sesión…"
                        rows={3}
                        value={formulario.descripcion}
                    />
                    {errores.descripcion && <span className="text-xs text-peligro-soft" role="alert">{errores.descripcion}</span>}
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid min-w-0 gap-2">
                        <span className={ETIQUETA}>Tipo de solicitud</span>
                        <select className={CAMPO} name="tipo" onChange={cambiarCampo} required value={formulario.tipo}>
                            {Object.values(TIPOS_SOLICITUD).map((tipo) => (
                                <option key={tipo} value={tipo}>{etiquetaTipo(tipo)}</option>
                            ))}
                        </select>
                        {errores.tipo && <span className="text-xs text-peligro-soft" role="alert">{errores.tipo}</span>}
                    </label>
                    <label className="grid min-w-0 gap-2">
                        <span className={ETIQUETA}>Sala</span>
                        <select
                            className={CAMPO}
                            disabled={cargandoSalas}
                            name="salaId"
                            onChange={cambiarCampo}
                            required
                            value={formulario.salaId}
                        >
                            <option value="">{cargandoSalas ? 'Cargando salas…' : 'Selecciona una sala'}</option>
                            {(salas ?? []).map((sala) => (
                                <option key={sala.id} value={String(sala.id)}>{sala.nombre}</option>
                            ))}
                        </select>
                        {errores.salaId && <span className="text-xs text-peligro-soft" role="alert">{errores.salaId}</span>}
                    </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="grid min-w-0 gap-2">
                        <span className={ETIQUETA}>Fecha</span>
                        <input
                            className={CAMPO}
                            min={fechaLocal()}
                            name="fecha"
                            onChange={cambiarCampo}
                            required
                            type="date"
                            value={formulario.fecha}
                        />
                        {errores.fechaDeseada && <span className="text-xs text-peligro-soft" role="alert">{errores.fechaDeseada}</span>}
                    </label>
                    <label className="grid min-w-0 gap-2">
                        <span className={ETIQUETA}>Hora de inicio</span>
                        <input
                            className={CAMPO}
                            name="horaInicio"
                            onChange={cambiarCampo}
                            required
                            type="time"
                            value={formulario.horaInicio}
                        />
                    </label>
                    <label className="grid min-w-0 gap-2">
                        <span className={ETIQUETA}>Hora de fin</span>
                        <input
                            className={CAMPO}
                            name="horaFin"
                            onChange={cambiarCampo}
                            required
                            type="time"
                            value={formulario.horaFin}
                        />
                    </label>
                </div>
                {errores.franja && <p className="text-xs text-peligro-soft" role="alert">{errores.franja}</p>}

                <div className="grid gap-2">
                    <span className={ETIQUETA}>
                        Partes <span className="font-normal text-sutil">(opcional, agrega con Enter o coma)</span>
                    </span>
                    {partes.length > 0 && (
                        <ul className="flex flex-wrap gap-1.5" aria-label="Partes agregadas">
                            {partes.map((parte, indice) => (
                                <li
                                    key={`${parte}-${indice}`}
                                    className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-accent-soft"
                                >
                                    {parte}
                                    <button
                                        type="button"
                                        onClick={() => quitarParte(indice)}
                                        className="grid h-5 w-5 place-items-center rounded-full transition hover:bg-white/10"
                                        aria-label={`Quitar ${parte}`}
                                    >
                                        <X className="h-3 w-3" aria-hidden="true" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                        <input
                            aria-label="Agregar parte"
                            className={CAMPO}
                            onChange={(event) => setParteTexto(event.target.value)}
                            onKeyDown={manejarTeclaParte}
                            placeholder="Ej. Voz principal, coros, guitarra…"
                            value={parteTexto}
                        />
                        <button type="button" onClick={agregarParte} className={`${BOTON_SECUNDARIO} shrink-0`}>
                            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Agregar
                        </button>
                    </div>
                    {errores.partes && <p className="text-xs text-peligro-soft" role="alert">{errores.partes}</p>}
                </div>

                <fieldset className="grid gap-2">
                    <legend className={ETIQUETA}>
                        Colaboradores * <span className="font-normal text-sutil">(1 a {MAX_COLABORADORES})</span>
                    </legend>
                    {cargandoColaboradores ? (
                        <p className="rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-sm text-sutil" role="status">
                            Cargando colaboradores…
                        </p>
                    ) : (colaboradores ?? []).length > 0 ? (
                        <>
                            <div className="grid max-h-64 gap-1 overflow-y-auto rounded-xl border border-border bg-surface-2/60 p-2">
                                {(colaboradores ?? []).map((colaborador) => {
                                    const seleccionado = seleccionados.includes(colaborador.id);
                                    const limiteAlcanzado = seleccionados.length >= MAX_COLABORADORES;
                                    const rol = rolDesdePerfil(colaborador.perfil);
                                    return (
                                        <label
                                            key={colaborador.id}
                                            className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition ${seleccionado ? 'bg-accent/10 text-texto-soft' : 'text-texto hover:bg-white/[0.04]'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 shrink-0 accent-[#9365f2]"
                                                checked={seleccionado}
                                                disabled={!seleccionado && limiteAlcanzado}
                                                onChange={() => alternarColaborador(colaborador.id)}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-semibold">{colaborador.nombreArtistico}</span>
                                                {colaborador.especialidad && (
                                                    <span className="block truncate text-xs text-sutil">{colaborador.especialidad}</span>
                                                )}
                                            </span>
                                            <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-wider text-accent-soft">
                                                {rol ? etiquetaRol(rol) : colaborador.perfil.replace(/_/g, ' ')}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-sutil">
                                {seleccionados.length} de {MAX_COLABORADORES} seleccionados.
                            </p>
                        </>
                    ) : (
                        <p className="rounded-xl border border-dashed border-border bg-surface/40 px-4 py-3 text-sm text-sutil">
                            No hay colaboradores públicos disponibles.
                        </p>
                    )}
                    {errores.colaboradores && <p className="text-xs text-peligro-soft" role="alert">{errores.colaboradores}</p>}
                </fieldset>

                {errorGeneral && (
                    <p className="rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">
                        {errorGeneral}
                    </p>
                )}
                {mensaje && (
                    <p className="rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">
                        {mensaje}
                    </p>
                )}

                <button
                    type="submit"
                    className={`${BOTON_PRIMARIO} w-full sm:w-fit`}
                    disabled={enviando || cargandoCatalogos}
                >
                    <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                    {enviando ? 'Enviando…' : 'Crear solicitud'}
                </button>
            </form>
        </section>
    );
}
