// CAPA: Presentación
import { useMemo } from 'react';
import { EstadisticasService } from '../services/estadisticasService.js';
import { sesionRepo } from '../repositories/sesionRepo.js';
import { solicitudRepo } from '../repositories/solicitudRepo.js';
import '../styles/estadisticas.css';

const etiquetasEstado = {
    completada: 'Completada',
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
    solicitud: 'Solicitud',
    en_negociacion: 'En negociación',
    rechazada: 'Rechazada',
    expirada: 'Expirada',
};

export default function Estadisticas() {
    const resumen = useMemo(() => EstadisticasService.obtenerResumen(), []);
    const sesiones = useMemo(() => [...sesionRepo.listar()].slice(0, 5), []);
    const solicitudes = useMemo(() => [...solicitudRepo.listar()].slice(0, 5), []);

    const cards = [
        { label: 'Sesiones totales', valor: resumen.totalSesiones, detalle: 'Registro del estudio' },
        { label: 'Sesiones completadas', valor: resumen.sesionesCompletadas, detalle: 'Cierre exitoso' },
        { label: 'Solicitudes abiertas', valor: resumen.solicitudesAbiertas, detalle: 'Pendientes por resolver' },
        { label: 'Solicitudes registradas', valor: resumen.totalSolicitudes, detalle: 'Volumen total' },
    ];

    return (
        <main className="workspace-content" data-page="estadisticas">
            <header className="page-heading">
                <p className="workspace-eyebrow">ESPACIO DE TRABAJO</p>
                <h1>Estadísticas</h1>
                <p>Resumen de actividad del estudio.</p>
            </header>

            <section className="estadisticas-grid" aria-label="Métricas generales de Z-ONE">
                {cards.map((card) => (
                    <article key={card.label} className="stat-card">
                        <span>{card.label}</span>
                        <strong>{card.valor}</strong>
                        <small>{card.detalle}</small>
                    </article>
                ))}
            </section>

            <section className="estadisticas-panels">
                <article className="panel-block">
                    <header>
                        <h2>Sesiones recientes</h2>
                    </header>
                    <ul className="list-block">
                        {sesiones.map((sesion) => (
                            <li key={sesion.id ?? `${sesion.titulo}-${sesion.fecha}`}>
                                <div>
                                    <strong>{sesion.titulo}</strong>
                                    <small>{sesion.fecha} · {sesion.hora_inicio} - {sesion.hora_fin}</small>
                                </div>
                                <span className={`pill estado-${sesion.estado}`}>
                                    {etiquetasEstado[sesion.estado] ?? sesion.estado}
                                </span>
                            </li>
                        ))}
                    </ul>
                </article>

                <article className="panel-block">
                    <header>
                        <h2>Solicitudes activas</h2>
                    </header>
                    <ul className="list-block">
                        {solicitudes.map((solicitud) => (
                            <li key={solicitud.id ?? `${solicitud.colaborador_id}-${solicitud.fecha}`}>
                                <div>
                                    <strong>Colaborador #{solicitud.colaborador_id}</strong>
                                    <small>{solicitud.fecha} · {solicitud.franja}</small>
                                </div>
                                <span className={`pill estado-${solicitud.estado}`}>
                                    {etiquetasEstado[solicitud.estado] ?? solicitud.estado}
                                </span>
                            </li>
                        ))}
                    </ul>
                </article>
            </section>
        </main>
    );
}
