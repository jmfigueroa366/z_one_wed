// CAPA: Presentación
import { useMemo, useState } from 'react';
import { colaboradorRepo } from '../repositories/colaboradorRepo.js';
import { salaRepo } from '../repositories/salaRepo.js';
import { SolicitudService } from '../services/solicitudService.js';
import { SesionService } from '../services/sesionService.js';
import '../styles/agenda.css';

const ETIQUETAS_ESTADO = {
    confirmada: 'Confirmada',
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    completada: 'Completada',
    cancelada: 'Cancelada',
};

function formatearFecha(fecha) {
    if (!fecha) return 'Fecha pendiente';
    return new Intl.DateTimeFormat('es', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(`${fecha}T00:00:00`));
}

function nombreColaborador(id, colaboradores) {
    return colaboradores.find((colaborador) => String(colaborador.id) === String(id))?.nombre ?? 'Sin asignar';
}

export default function Agenda() {
    const [sesiones] = useState(() => SesionService.listar());
    const [reservasConfirmadas] = useState(() =>
        SolicitudService.listar().filter((solicitud) => solicitud.estado === 'confirmada')
    );
    const [salas] = useState(() => salaRepo.listar());
    const [colaboradores] = useState(() => colaboradorRepo.listar());
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [filtroFecha, setFiltroFecha] = useState('');

    const eventosAgenda = useMemo(() => [
        ...sesiones.map((sesion) => ({
            ...sesion,
            eventoId: `sesion-${sesion.id}`,
            tipo: 'Sesión',
        })),
        ...reservasConfirmadas.map((solicitud) => {
            const horario = String(solicitud.franja ?? '').match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
            return {
                ...solicitud,
                id: solicitud.id,
                eventoId: `solicitud-${solicitud.id}`,
                titulo: `Reserva confirmada · ${nombreColaborador(solicitud.colaborador_id, colaboradores)}`,
                hora_inicio: horario?.[1] ?? '',
                hora_fin: horario?.[2] ?? '',
                estado: 'confirmada',
                tipo: 'Reserva aprobada',
            };
        }),
    ], [sesiones, reservasConfirmadas, colaboradores]);

    const sesionesFiltradas = useMemo(() => [...eventosAgenda]
        .filter((sesion) => filtroEstado === 'todas' || sesion.estado === filtroEstado)
        .filter((sesion) => !filtroFecha || sesion.fecha === filtroFecha)
        .sort((a, b) => {
            const fechaA = `${a.fecha ?? ''}T${a.hora_inicio ?? ''}`;
            const fechaB = `${b.fecha ?? ''}T${b.hora_inicio ?? ''}`;
            return fechaA.localeCompare(fechaB);
        }), [eventosAgenda, filtroEstado, filtroFecha]);

    const obtenerSala = (id) =>
        salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';

    return (
        <main className="workspace-content operations-page" data-page="agenda">
            <header className="page-heading operations-heading">
                <p className="workspace-eyebrow">PLANIFICACIÓN DEL ESTUDIO</p>
                <h1>Agenda de sesiones</h1>
                <p>Consulta los horarios, las salas y el equipo asignado a cada sesión.</p>
            </header>

            <section className="operations-summary" aria-label="Resumen de agenda">
                <article><span>Actividades en agenda</span><strong>{eventosAgenda.length}</strong></article>
                <article><span>Confirmadas</span><strong>{eventosAgenda.filter((sesion) => sesion.estado === 'confirmada').length}</strong></article>
                <article><span>Completadas</span><strong>{sesiones.filter((sesion) => sesion.estado === 'completada').length}</strong></article>
            </section>

            <section className="operations-panel" aria-labelledby="agenda-list-title">
                <div className="operations-panel-heading">
                    <div>
                        <p className="workspace-eyebrow">PROGRAMACIÓN</p>
                        <h2 id="agenda-list-title">Sesiones y reservas confirmadas</h2>
                    </div>
                    <label className="operations-date-filter">
                        <span>Buscar por fecha</span>
                        <input
                            aria-label="Filtrar agenda por fecha"
                            type="date"
                            value={filtroFecha}
                            onChange={(event) => setFiltroFecha(event.target.value)}
                        />
                    </label>
                </div>

                <div className="operations-filters" aria-label="Filtrar por estado">
                    {[
                        ['todas', 'Todas'],
                        ['pendiente', 'Pendientes'],
                        ['confirmada', 'Confirmadas'],
                        ['en_proceso', 'En proceso'],
                        ['completada', 'Completadas'],
                        ['cancelada', 'Canceladas'],
                    ].map(([estado, etiqueta]) => (
                        <button
                            className={filtroEstado === estado ? 'operations-filter is-active' : 'operations-filter'}
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            type="button"
                        >
                            {etiqueta}
                        </button>
                    ))}
                    {filtroFecha && (
                        <button className="operations-clear-filter" onClick={() => setFiltroFecha('')} type="button">
                            Limpiar fecha
                        </button>
                    )}
                </div>

                {sesionesFiltradas.length ? (
                    <div className="operations-table-scroll">
                        <table className="operations-table">
                            <thead>
                                <tr><th>Fecha y hora</th><th>Sesión</th><th>Sala</th><th>Artista / productor</th><th>Estado</th></tr>
                            </thead>
                            <tbody>
                                {sesionesFiltradas.map((sesion) => (
                                    <tr key={sesion.eventoId}>
                                        <td><strong>{formatearFecha(sesion.fecha)}</strong><span>{sesion.hora_inicio ?? 'Hora pendiente'}{sesion.hora_fin ? ` – ${sesion.hora_fin}` : ''}</span></td>
                                        <td><span className="operations-event-type">{sesion.tipo}</span>{sesion.titulo || 'Sesión sin título'}</td>
                                        <td>{obtenerSala(sesion.sala_id)}</td>
                                        <td>{nombreColaborador(sesion.colaborador_id, colaboradores)}</td>
                                        <td><span className={`operations-status status-${sesion.estado}`}>{ETIQUETAS_ESTADO[sesion.estado] ?? sesion.estado}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="operations-empty">No hay sesiones que coincidan con esos filtros.</p>
                )}
            </section>
        </main>
    );
}
