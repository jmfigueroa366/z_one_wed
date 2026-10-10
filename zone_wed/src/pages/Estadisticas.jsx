// CAPA: Presentación
import { useEffect, useMemo, useRef } from 'react';
import anime from 'animejs';
import { useSesiones } from '../hooks/useSesiones.js';
import { useSolicitudes } from '../hooks/useSolicitudes.js';
import { EstadisticasService } from '../services/estadisticasService.js';
import { formatearMoneda } from '../utils/helpers.js';
import { clasePillEstado } from '../styles/clases.js';
import { Donut, BarrasHorizontales, ColumnasDias, Anillo } from '../components/Graficos.jsx';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const etiquetasEstado = {
    completada: 'Completada',
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
    solicitud: 'Solicitud',
    en_negociacion: 'En negociación',
    rechazada: 'Rechazada',
    expirada: 'Expirada',
    pendiente: 'Pendiente',
};

const TONOS = {
    exito: 'border-exito/25 bg-exito/[0.07] text-exito-soft',
    aviso: 'border-aviso/25 bg-aviso/[0.07] text-aviso-soft',
    accent: 'border-accent/25 bg-accent/[0.07] text-accent-soft',
    magenta: 'border-magenta/25 bg-magenta/[0.07] text-magenta',
};

const TARJETA = 'relative overflow-hidden rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur';

const ESTADOS_ORDEN = { pagada: 'Cobrado', facturada: 'Por cobrar', borrador: 'Borrador' };

function Contador({ valor, sufijo = '' }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const objetivo = Number(valor) || 0;
        if (MENOS_MOVIMIENTO()) {
            el.textContent = `${objetivo}${sufijo}`;
            return undefined;
        }
        const estado = { actual: 0 };
        const animacion = anime({
            targets: estado,
            actual: objetivo,
            round: 1,
            duration: 1200,
            easing: 'easeOutExpo',
            update() {
                el.textContent = `${estado.actual}${sufijo}`;
            },
        });
        return () => animacion.pause();
    }, [valor, sufijo]);

    return <span ref={ref}>0{sufijo}</span>;
}

export default function Estadisticas() {
    const [sesiones] = useSesiones();
    const [solicitudes] = useSolicitudes();
    const contenedorRef = useRef(null);

    const datos = useMemo(() => EstadisticasService.obtenerAnalitica(), [sesiones, solicitudes]);

    const ultimasSesiones = useMemo(() => [...sesiones].slice(0, 5), [sesiones]);
    const ultimasSolicitudes = useMemo(() => [...solicitudes].slice(0, 5), [solicitudes]);

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const contenedor = contenedorRef.current;
        if (!contenedor) return undefined;
        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-tile]'),
            opacity: [0, 1],
            translateY: [24, 0],
            duration: 640,
            delay: anime.stagger(80),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [datos]);

    const kpis = [
        { etiqueta: 'Sesiones totales', valor: datos.kpis.totalSesiones, nota: `${datos.kpis.confirmadas} por confirmar`, icono: '✦' },
        { etiqueta: 'Sesiones completadas', valor: datos.kpis.completadas, nota: 'Cierre exitoso', icono: '✓' },
        { etiqueta: 'Ocupación semanal', valor: datos.kpis.ocupacion, sufijo: '%', nota: 'Sobre capacidad operativa', icono: '◍' },
        { etiqueta: 'Solicitudes abiertas', valor: datos.kpis.solicitudesAbiertas, nota: 'En petición o negociación', icono: '✎' },
    ];

    const datosSala = datos.porSala.map((sala, indice) => ({
        etiqueta: sala.nombre,
        valor: sala.sesiones,
        color: indice === 0 ? '#f04fa6' : '#a477ff',
        colorB: indice === 0 ? '#a477ff' : '#6f4bbb',
    }));

    const datosColaborador = datos.porColaborador.map((item) => ({
        etiqueta: item.nombre,
        valor: item.valor,
        color: '#9ecbff',
        colorB: '#a477ff',
    }));

    const totalIngresos = datos.ordenes.total || 1;
    const segmentosIngreso = [
        { etiqueta: 'Cobrado', valor: datos.ordenes.cobrado, color: '#7be0b0' },
        { etiqueta: 'Por cobrar', valor: datos.ordenes.porCobrar, color: '#ffd166' },
        { etiqueta: 'En borrador', valor: datos.ordenes.borrador, color: '#9ecbff' },
    ];

    return (
        <main className="workspace-content" data-page="estadisticas">
            <header className="page-heading relative border-l-4 border-accent pl-4">
                <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-10 h-56 w-56 animate-aurora rounded-full bg-[#9365f2]/20 blur-3xl" />
                <p className="workspace-eyebrow">OBSERVATORIO · Z-ONE</p>
                <h1>Estadísticas</h1>
                <p>Lectura viva del pulso del estudio: ocupación, tendencias y señales que conviene notar.</p>
            </header>

            <div ref={contenedorRef} className="mt-6 grid gap-5">
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Métricas generales">
                    {kpis.map((kpi) => (
                        <article key={kpi.etiqueta} data-tile className={TARJETA}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-sutil">{kpi.etiqueta}</span>
                                <span className="text-accent-soft" aria-hidden="true">{kpi.icono}</span>
                            </div>
                            <strong className="mt-3 block text-4xl font-extrabold tracking-tight text-texto-soft">
                                <Contador valor={kpi.valor} sufijo={kpi.sufijo} />
                            </strong>
                            <span className="mt-1 block text-xs text-sutil/80">{kpi.nota}</span>
                            <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#9365f2]/20 blur-2xl" />
                        </article>
                    ))}
                </section>

                <section className="grid gap-5 lg:grid-cols-3">
                    <article data-tile className={`${TARJETA} lg:col-span-2`}>
                        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="workspace-eyebrow">COMPOSICIÓN</p>
                                <h2 className="mt-1 text-xl font-bold tracking-tight text-texto-soft">Distribución de sesiones</h2>
                            </div>
                            <span className="rounded-full border border-accent-soft/30 px-3 py-1 text-[0.68rem] font-extrabold tracking-[0.1em] text-accent-soft">
                                {String(datos.kpis.totalSesiones).padStart(2, '0')} REGISTROS
                            </span>
                        </div>
                        {datos.porEstado.length ? (
                            <Donut datos={datos.porEstado} total={datos.kpis.totalSesiones} etiquetaCentral="Sesiones" />
                        ) : (
                            <p className="py-6 text-center text-sm text-sutil">Aún no hay sesiones que analizar.</p>
                        )}
                    </article>

                    <article data-tile className={`${TARJETA} flex flex-col`}>
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 animate-aurora rounded-full bg-[#e34ba6]/20 blur-3xl [animation-delay:-5s]" />
                        <p className="workspace-eyebrow relative">SÍNTESIS</p>
                        <div className="relative mt-4 flex flex-1 flex-col items-center justify-center">
                            <Anillo valor={datos.indice.valor} etiqueta="Índice Z·1" />
                            <p className="mt-3 text-center text-sm font-semibold text-texto-soft">{datos.indice.descriptor}</p>
                            <div className="mt-4 grid w-full gap-2">
                                {[
                                    ['Intensidad', datos.indice.componentes.intensidad],
                                    ['Comercial', datos.indice.componentes.comercial],
                                    ['Conversión', datos.indice.componentes.conversion],
                                ].map(([titulo, valor]) => (
                                    <div key={titulo} className="flex items-center gap-3">
                                        <span className="w-24 shrink-0 text-xs text-sutil">{titulo}</span>
                                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                                            <span className="block h-full rounded-full bg-gradient-to-r from-[#9365f2] to-[#e34ba6]" style={{ width: `${valor}%` }} />
                                        </span>
                                        <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-texto-soft">{valor}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </article>
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                    <article data-tile className={TARJETA}>
                        <div className="mb-5">
                            <p className="workspace-eyebrow">CABINAS</p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-texto-soft">Actividad por espacio</h2>
                        </div>
                        {datosSala.some((dato) => dato.valor > 0) ? (
                            <>
                                <BarrasHorizontales datos={datosSala} />
                                <p className="mt-4 text-xs text-sutil">
                                    {datos.porSala.map((sala) => `${sala.nombre}: ${sala.horas} h`).join(' · ')}
                                </p>
                            </>
                        ) : (
                            <p className="py-6 text-center text-sm text-sutil">Sin actividad registrada por cabina.</p>
                        )}
                    </article>

                    <article data-tile className={TARJETA}>
                        <div className="mb-5">
                            <p className="workspace-eyebrow">RITMO</p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-texto-soft">Pulso semanal</h2>
                        </div>
                        <ColumnasDias datos={datos.conteoDias} />
                    </article>
                </section>

                <section className="grid gap-5 lg:grid-cols-3">
                    <article data-tile className={TARJETA}>
                        <div className="mb-5">
                            <p className="workspace-eyebrow">INGRESOS</p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-texto-soft">Órdenes de servicio</h2>
                        </div>
                        <strong className="block text-3xl font-extrabold tracking-tight text-texto-soft">
                            {formatearMoneda(datos.ordenes.total)}
                        </strong>
                        <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white/[0.05]">
                            {segmentosIngreso.map((segmento) => (
                                <span
                                    key={segmento.etiqueta}
                                    className="h-full"
                                    style={{ width: `${(segmento.valor / totalIngresos) * 100}%`, backgroundColor: segmento.color }}
                                />
                            ))}
                        </div>
                        <ul className="mt-4 grid gap-2.5">
                            {segmentosIngreso.map((segmento) => (
                                <li key={segmento.etiqueta} className="flex items-center gap-3 text-sm">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segmento.color }} />
                                    <span className="flex-1 text-sutil">{segmento.etiqueta}</span>
                                    <strong className="tabular-nums text-texto-soft">{formatearMoneda(segmento.valor)}</strong>
                                </li>
                            ))}
                        </ul>
                        {datos.ordenes.porEstado.length > 0 && (
                            <p className="mt-4 border-t border-border/60 pt-3 text-xs text-sutil">
                                {datos.ordenes.porEstado
                                    .map((item) => `${ESTADOS_ORDEN[item.estado] ?? item.estado}: ${formatearMoneda(item.valor)}`)
                                    .join(' · ')}
                            </p>
                        )}
                    </article>

                    <article data-tile className={TARJETA}>
                        <div className="mb-5">
                            <p className="workspace-eyebrow">TALENTO</p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-texto-soft">Voces más activas</h2>
                        </div>
                        {datosColaborador.length ? (
                            <BarrasHorizontales datos={datosColaborador} />
                        ) : (
                            <p className="py-6 text-center text-sm text-sutil">Aún sin asignaciones registradas.</p>
                        )}
                    </article>

                    <article data-tile className={TARJETA}>
                        <div className="mb-5">
                            <p className="workspace-eyebrow">SEÑALES</p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-texto-soft">Lecturas del estudio</h2>
                        </div>
                        <ul className="grid gap-3">
                            {datos.insights.map((insight) => (
                                <li key={insight.etiqueta} className={`rounded-2xl border p-3.5 ${TONOS[insight.tono] ?? TONOS.accent}`}>
                                    <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em] opacity-80">{insight.etiqueta}</span>
                                    <p className="mt-1 text-sm font-bold text-texto-soft">{insight.titulo}</p>
                                    <p className="mt-0.5 text-xs leading-5 text-sutil">{insight.texto}</p>
                                </li>
                            ))}
                        </ul>
                    </article>
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                    <article data-tile className={TARJETA}>
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

                    <article data-tile className={TARJETA}>
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
            </div>
        </main>
    );
}
