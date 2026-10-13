// CAPA: Presentación
import { useState } from 'react';
import { SesionService } from '../services/sesionService.js';
import '../styles/tailwind.css';

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

const CAMPO =
    'w-full min-h-[42px] rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-texto outline-none transition placeholder:text-sutil focus:border-accent focus:ring-2 focus:ring-accent/40 [&>option]:bg-surface-3 [&>option]:text-texto';
const ETIQUETA = 'mb-1 block text-xs font-semibold text-[#e5e0ef]';
const AYUDA = 'font-normal text-sutil';
const FILA = 'grid gap-3 sm:grid-cols-2';

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
        <section id="crear" className="scroll-mt-5 rounded-2xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="workspace-eyebrow">NUEVA RESERVA</p>
                    <h2 className="text-xl font-bold tracking-tight text-texto">Crear sesión</h2>
                </div>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/15 text-accent" aria-hidden="true">
                    ◷
                </span>
            </div>
            <p className="mb-4 text-sm leading-6 text-sutil">Completa los datos para registrar una sesión en la agenda del estudio.</p>

            <form className="grid gap-4" onSubmit={guardarSesion}>
                <label className="grid min-w-0 gap-2">
                    <span className={ETIQUETA}>Nombre de la sesión <span className={AYUDA}>(opcional)</span></span>
                    <input
                        className={CAMPO}
                        name="titulo"
                        onChange={cambiarCampo}
                        placeholder="Ej. Grabación de nuevo sencillo"
                        value={formulario.titulo}
                    />
                </label>

                <div className={FILA}>
                    <label className="grid min-w-0 gap-2">
                        <span className={ETIQUETA}>Tipo de sesión</span>
                        <select className={CAMPO} name="tipo" onChange={cambiarCampo} value={formulario.tipo}>
                            <option>Grabación</option>
                            <option>Mezcla</option>
                            <option>Masterización</option>
                            <option>Ensayo</option>
                            <option>Producción</option>
                        </select>
                    </label>
                    <label className="grid min-w-0 gap-2">
                        <span className={ETIQUETA}>Estado</span>
                        <select className={CAMPO} name="estado" onChange={cambiarCampo} value={formulario.estado}>
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="cancelada">Cancelada</option>
                        </select>
                    </label>
                </div>

                <div className={FILA}>
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
                    </label>
                    <label className="grid min-w-0 gap-2">
                        <span className={ETIQUETA}>Hora de inicio</span>
                        <input
                            className={CAMPO}
                            name="hora_inicio"
                            onChange={cambiarCampo}
                            required
                            type="time"
                            value={formulario.hora_inicio}
                        />
                    </label>
                </div>

                <div className={FILA}>
                    <label className="grid min-w-0 gap-2">
                        <span className={ETIQUETA}>Duración</span>
                        <select className={CAMPO} name="duracion" onChange={cambiarCampo} value={formulario.duracion}>
                            <option value="1">1 hora</option>
                            <option value="1.5">1 hora y media</option>
                            <option value="2">2 horas</option>
                            <option value="3">3 horas</option>
                            <option value="4">4 horas</option>
                            <option value="6">6 horas</option>
                            <option value="8">8 horas</option>
                        </select>
                    </label>
                    <label className="grid min-w-0 gap-2">
                        <span className={ETIQUETA}>Cabina</span>
                        <select className={CAMPO} name="sala_id" onChange={cambiarCampo} required value={formulario.sala_id}>
                            <option value="">Selecciona una cabina</option>
                            {salas.map((sala) => (
                                <option key={sala.id} value={sala.id}>{sala.nombre}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <label className="grid min-w-0 gap-2">
                    <span className={ETIQUETA}>Artista / productor</span>
                    <select
                        className={CAMPO}
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

                {mensaje && (
                    <p className="rounded-lg border border-exito/30 bg-exito/10 px-3 py-2 text-sm text-exito" role="status">{mensaje}</p>
                )}
                {error && (
                    <p className="rounded-lg border border-peligro/30 bg-peligro/10 px-3 py-2 text-sm text-peligro" role="alert">{error}</p>
                )}

                <button
                    className="min-h-[44px] rounded-lg bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-4 text-sm font-bold text-white transition hover:brightness-110"
                    type="submit"
                >
                    Guardar sesión
                </button>
                <p className="text-center text-xs text-sutil/80">Los datos quedan guardados en este navegador.</p>
            </form>
        </section>
    );
}