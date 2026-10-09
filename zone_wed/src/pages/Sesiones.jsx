// CAPA: Presentación
import { useEffect, useMemo, useState } from 'react';
import { useColaboradores } from '../hooks/useColaboradores.js';
import { useSalas } from '../hooks/useSalas.js';
import { useSesiones } from '../hooks/useSesiones.js';
import { SesionService } from '../services/sesionService.js';
import { formatearFecha } from '../utils/helpers.js';
import '../styles/sesiones.css';

function fechaLocal(fecha = new Date()) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function sumarHoras(hora, horas) {
    const [horaInicio, minutos] = hora.split(':').map(Number);
    const totalMinutos = horaInicio * 60 + minutos + Number(horas) * 60;
    const horaFin = Math.floor(totalMinutos / 60) % 24;
    const minutosFin = totalMinutos % 60;
    return `${String(horaFin).padStart(2, '0')}:${String(minutosFin).padStart(2, '0')}`;
}

const ESTADOS = {
    confirmada: 'Confirmada',
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    completada: 'Completada',
    cancelada: 'Cancelada',
};

export default function Sesiones() {
    const [sesiones, setSesiones] = useSesiones();
    const [salas] = useSalas(true);
    const [colaboradores] = useColaboradores(true);
    const [filtro, setFiltro] = useState('todas');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [formulario, setFormulario] = useState({
        titulo: '',
        tipo: 'Grabación',
        fecha: fechaLocal(),
        hora_inicio: '10:00',
        duracion: '2',
        sala_id: '',
        colaborador_id: '',
        estado: 'pendiente',
    });

    const sesionesFiltradas = useMemo(
        () => sesiones.filter((sesion) => filtro === 'todas' || sesion.estado === filtro),
        [sesiones, filtro]
    );

    useEffect(() => {
        if (window.location.hash) {
            document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const cambiarCampo = (event) => {
        const { name, value } = event.target;
        setFormulario((actual) => ({ ...actual, [name]: value }));
    };

    const guardarSesion = (event) => {
        event.preventDefault();
        setError('');
        setMensaje('');

        const sala = salas.find((item) => String(item.id) === formulario.sala_id);
        const colaborador = colaboradores.find((item) => String(item.id) === formulario.colaborador_id);
        const duracion = Number(formulario.duracion);

        if (!sala || !colaborador || !Number.isFinite(duracion) || duracion <= 0 || duracion > 12) {
            setError('Completa todos los campos y selecciona una duración entre 0 y 12 horas.');
            return;
        }

        try {
            const sesionCreada = SesionService.crear({
                ...formulario,
                titulo: formulario.titulo.trim() || `${formulario.tipo} · ${colaborador.nombre}`,
                sala_id: sala.id,
                colaborador_id: colaborador.id,
                hora_fin: sumarHoras(formulario.hora_inicio, duracion),
                duracion,
            });
            setSesiones((actuales) => [...actuales, sesionCreada]);
            setMensaje('Sesión guardada correctamente.');
            setFormulario((actual) => ({
                ...actual,
                titulo: '',
                fecha: fechaLocal(),
                hora_inicio: '10:00',
                duracion: '2',
            }));
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#registrar`);
            document.getElementById('registrar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la sesión.');
        }
    };

    const obtenerNombreSala = (id) =>
        salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';
    const obtenerNombreColaborador = (id) =>
        colaboradores.find((colaborador) => String(colaborador.id) === String(id))?.nombre ?? 'Sin asignar';

    return (
        <main className="workspace-content sessions-content">
            <header className="sessions-heading">
                <p className="workspace-eyebrow">GESTIÓN · ESTUDIO</p>
                <h1>Agenda de cabinas y sesiones</h1>
                <p>Registra sesiones y consulta la programación del estudio para coordinar cabinas y horarios.</p>
            </header>

            <section className="sessions-overview" aria-label="Resumen de sesiones">
                <article>
                    <span>Sesiones registradas</span>
                    <strong>{sesiones.length}</strong>
                </article>
                <article>
                    <span>Confirmadas</span>
                    <strong>{sesiones.filter((sesion) => sesion.estado === 'confirmada').length}</strong>
                </article>
                <article>
                    <span>Cabinas disponibles</span>
                    <strong>{salas.length}</strong>
                </article>
            </section>

            <section className="sessions-layout">
                <section className="sessions-panel sessions-list-panel" id="registrar">
                    <div className="sessions-panel-heading">
                        <div>
                            <p className="workspace-eyebrow">PROGRAMACIÓN</p>
                            <h2>Sesiones registradas</h2>
                        </div>
                        <a className="sessions-inline-link" href="#crear">+ Nueva sesión</a>
                    </div>

                    <div className="sessions-filters" aria-label="Filtrar sesiones">
                        {[
                            ['todas', 'Todas'],
                            ['confirmada', 'Confirmadas'],
                            ['pendiente', 'Pendientes'],
                            ['cancelada', 'Canceladas'],
                        ].map(([value, label]) => (
                            <button
                                className={filtro === value ? 'sessions-filter is-active' : 'sessions-filter'}
                                key={value}
                                onClick={() => setFiltro(value)}
                                type="button"
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {sesionesFiltradas.length > 0 ? (
                        <div className="sessions-table-scroll">
                            <table className="sessions-table">
                                <thead>
                                    <tr>
                                        <th>Fecha y hora</th>
                                        <th>Sesión</th>
                                        <th>Cabina</th>
                                        <th>Artista / productor</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sesionesFiltradas.map((sesion) => (
                                        <tr key={sesion.id}>
                                            <td>
                                                <strong>{formatearFecha(sesion.fecha, { day: 'numeric' }) || 'Sin fecha'}</strong>
                                                <span>{sesion.hora_inicio ?? '--:--'}–{sesion.hora_fin ?? '--:--'}</span>
                                            </td>
                                            <td>{sesion.titulo || sesion.tipo || 'Sesión de estudio'}</td>
                                            <td>{obtenerNombreSala(sesion.sala_id)}</td>
                                            <td>{obtenerNombreColaborador(sesion.colaborador_id)}</td>
                                            <td>
                                                <span className={`session-status status-${sesion.estado}`}>
                                                    {ESTADOS[sesion.estado] ?? sesion.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="sessions-empty">No hay sesiones en esta categoría.</p>
                    )}
                </section>

                <section className="sessions-panel sessions-form-panel" id="crear">
                    <div className="sessions-panel-heading">
                        <div>
                            <p className="workspace-eyebrow">NUEVA RESERVA</p>
                            <h2>Crear sesión</h2>
                        </div>
                        <span className="sessions-heading-icon" aria-hidden="true">◷</span>
                    </div>
                    <p className="sessions-form-intro">Completa los datos para registrar una sesión en la agenda del estudio.</p>

                    <form className="sessions-form" onSubmit={guardarSesion}>
                        <label>
                            <span>Nombre de la sesión <small>(opcional)</small></span>
                            <input
                                name="titulo"
                                onChange={cambiarCampo}
                                placeholder="Ej. Grabación de nuevo sencillo"
                                value={formulario.titulo}
                            />
                        </label>

                        <div className="sessions-form-row">
                            <label>
                                <span>Tipo de sesión</span>
                                <select name="tipo" onChange={cambiarCampo} value={formulario.tipo}>
                                    <option>Grabación</option>
                                    <option>Mezcla</option>
                                    <option>Masterización</option>
                                    <option>Ensayo</option>
                                    <option>Producción</option>
                                </select>
                            </label>
                            <label>
                                <span>Estado</span>
                                <select name="estado" onChange={cambiarCampo} value={formulario.estado}>
                                    <option value="pendiente">Pendiente</option>
                                    <option value="confirmada">Confirmada</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </label>
                        </div>

                        <div className="sessions-form-row">
                            <label>
                                <span>Fecha</span>
                                <input
                                    min={fechaLocal()}
                                    name="fecha"
                                    onChange={cambiarCampo}
                                    required
                                    type="date"
                                    value={formulario.fecha}
                                />
                            </label>
                            <label>
                                <span>Hora de inicio</span>
                                <input
                                    name="hora_inicio"
                                    onChange={cambiarCampo}
                                    required
                                    type="time"
                                    value={formulario.hora_inicio}
                                />
                            </label>
                        </div>

                        <div className="sessions-form-row">
                            <label>
                                <span>Duración</span>
                                <select name="duracion" onChange={cambiarCampo} value={formulario.duracion}>
                                    <option value="1">1 hora</option>
                                    <option value="1.5">1 hora y media</option>
                                    <option value="2">2 horas</option>
                                    <option value="3">3 horas</option>
                                    <option value="4">4 horas</option>
                                    <option value="6">6 horas</option>
                                    <option value="8">8 horas</option>
                                </select>
                            </label>
                            <label>
                                <span>Cabina</span>
                                <select name="sala_id" onChange={cambiarCampo} required value={formulario.sala_id}>
                                    <option value="">Selecciona una cabina</option>
                                    {salas.map((sala) => (
                                        <option key={sala.id} value={sala.id}>{sala.nombre}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <label>
                            <span>Artista / productor</span>
                            <select
                                name="colaborador_id"
                                onChange={cambiarCampo}
                                required
                                value={formulario.colaborador_id}
                            >
                                <option value="">Selecciona una persona</option>
                                {colaboradores.map((colaborador) => (
                                    <option key={colaborador.id} value={colaborador.id}>
                                        {colaborador.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {mensaje && <p className="sessions-feedback sessions-feedback-success" role="status">{mensaje}</p>}
                        {error && <p className="sessions-feedback sessions-feedback-error" role="alert">{error}</p>}

                        <button className="sessions-submit" type="submit">Guardar sesión</button>
                        <p className="sessions-storage-note">Los datos quedan guardados en este navegador.</p>
                    </form>
                </section>
            </section>
        </main>
    );
}
