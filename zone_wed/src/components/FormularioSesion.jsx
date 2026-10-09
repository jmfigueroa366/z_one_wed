// CAPA: Presentación
import { useState } from 'react';
import { SesionService } from '../services/sesionService.js';

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

export default function FormularioSesion({ salas, colaboradores }) {
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
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

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
            SesionService.crear({
                ...formulario,
                titulo: formulario.titulo.trim() || `${formulario.tipo} · ${colaborador.nombre}`,
                sala_id: sala.id,
                colaborador_id: colaborador.id,
                hora_fin: sumarHoras(formulario.hora_inicio, duracion),
                duracion,
            });
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

    return (
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
    );
}