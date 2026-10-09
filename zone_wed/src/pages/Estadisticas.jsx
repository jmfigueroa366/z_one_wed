// CAPA: Presentación
import { useMemo } from 'react';
import { useSesiones } from '../hooks/useSesiones.js';
import { useSolicitudes } from '../hooks/useSolicitudes.js';
import { EstadisticasService } from '../services/estadisticasService.js';
import { clasePillEstado } from '../styles/clases.js';
import '../styles/tailwind.css';

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
    const [sesiones] = useSesiones();
    const [solicitudes] = useSolicitudes();
    const resumen = useMemo(() => EstadisticasService.obtenerResumen(), [sesiones, solicitudes]);
    const ultimasSesiones = useMemo(() => [...sesiones].slice(0, 5), [sesiones]);
    const ultimasSolicitudes = useMemo(() => [...solicitudes].slice(0, 5), [solicitudes]);

    const cards = [
        { label: 'Sesiones totales', valor: resumen.totalSesiones, detalle: 'Registro del estudio' },
        { label: 'Sesiones completadas', valor: resumen.sesionesCompletadas, detalle: 'Cierre exitoso' },
        { label: 'Solicitudes abiertas', valor: resumen.solicitudesAbiertas, detalle: 'Pendientes por resolver' },
        { label: 'Solicitudes registradas', valor: resumen.totalSolicitudes, detalle: 'Volumen total' },
    ];

    return (
        <main className="workspace-content" data-page="estadisticas">
            <header className="page-heading border-l-4 border-exito/70 pl-4">
                <p className="workspace-eyebrow">ESPACIO DE TRABAJO</p>
                <h1>Estadísticas</h1>
                <p>Resumen de actividad del estudio.</p>
            </header>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Métricas generales de Z-ONE">
                {cards.map((card) => (
                    <article key={card.label} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface/70 p-5">
                        <span className="text-xs font-bold uppercase tracking-wider text-sutil">{card.label}</span>
                        <strong className="text-4xl font-extrabold leading-none text-texto-soft">{card.valor}</strong>
                        <small className="text-sm text-sutil">{card.detalle}</small>
                    </article>
                ))}
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-2">
                <article className="rounded-3xl border border-border bg-surface/70 p-6">
                    <h2 className="mb-5 text-lg font-bold text-texto-soft">Sesiones recientes</h2>
                    {ultimasSesiones.length ? (
                        <ul className="grid gap-3.5">
                            {ultimasSesiones.map((sesion) => (
                                <li
                                    key={sesion.id ?? `${sesion.titulo}-${sesion.fecha}`}
                                    className="flex items-center justify-between gap-3 border-b border-border/50 pb-3.5 last:border-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <strong className="block truncate text-texto-soft">{sesion.titulo}</strong>
                                        <small className="text-sutil">{sesion.fecha} · {sesion.hora_inicio} - {sesion.hora_fin}</small>
                                    </div>
                                    <span className={clasePillEstado(sesion.estado)}>
                                        {etiquetasEstado[sesion.estado] ?? sesion.estado}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-sutil">Aún no hay sesiones registradas.</p>
                    )}
                </article>

                <article className="rounded-3xl border border-border bg-surface/70 p-6">
                    <h2 className="mb-5 text-lg font-bold text-texto-soft">Solicitudes activas</h2>
                    {ultimasSolicitudes.length ? (
                        <ul className="grid gap-3.5">
                            {ultimasSolicitudes.map((solicitud) => (
                                <li
                                    key={solicitud.id ?? `${solicitud.colaborador_id}-${solicitud.fecha}`}
                                    className="flex items-center justify-between gap-3 border-b border-border/50 pb-3.5 last:border-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <strong className="block truncate text-texto-soft">Colaborador #{solicitud.colaborador_id}</strong>
                                        <small className="text-sutil">{solicitud.fecha} · {solicitud.franja}</small>
                                    </div>
                                    <span className={clasePillEstado(solicitud.estado)}>
                                        {etiquetasEstado[solicitud.estado] ?? solicitud.estado}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-sutil">Aún no hay solicitudes registradas.</p>
                    )}
                </article>
            </section>
        </main>
    );
}
