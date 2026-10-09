// CAPA: Presentación
import { useEffect, useMemo, useState } from 'react';
import FormularioSesion from '../components/FormularioSesion.jsx';
import { useColaboradores } from '../hooks/useColaboradores.js';
import { useSalas } from '../hooks/useSalas.js';
import { useSesiones } from '../hooks/useSesiones.js';
import { formatearFecha } from '../utils/helpers.js';
import '../styles/sesiones.css';

const ESTADOS = {
    confirmada: 'Confirmada',
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    completada: 'Completada',
    cancelada: 'Cancelada',
};

export default function Sesiones() {
    const [sesiones] = useSesiones();
    const [salas] = useSalas(true);
    const [colaboradores] = useColaboradores(true);
    const [filtro, setFiltro] = useState('todas');

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

                <FormularioSesion salas={salas} colaboradores={colaboradores} />
            </section>
        </main>
    );
}