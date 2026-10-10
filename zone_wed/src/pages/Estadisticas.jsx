// CAPA: Presentación
import { useEffect, useMemo, useRef } from 'react';
import anime from 'animejs';
import { Activity, CheckCircle2, Gauge, Inbox, Flame, Sparkles, TrendingUp, Radio } from 'lucide-react';
import { useSesiones } from '../hooks/useSesiones.js';
import { useSolicitudes } from '../hooks/useSolicitudes.js';
import { EstadisticasService } from '../services/estadisticasService.js';
import { formatearMoneda } from '../utils/helpers.js';
import { clasePillEstado } from '../styles/clases.js';
import { Donut, BarrasHorizontales, ColumnasDias, Anillo, MapaCalor } from '../components/Graficos.jsx';
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

const TARJETA = 'relative overflow-hidden rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur transition duration-300 hover:border-accent/40';

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
            translateY: [26, 0],
            duration: 640,
            delay: anime.stagger(80),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [datos]);

    const kpis = [
        { etiqueta: 'Sesiones totales', valor: datos.kpis.totalSesiones, nota: `${datos.kpis.confirmadas} confirmadas`, Icono: Activity, tono: 'from-[#9365f2] to-[#6f4bbb]' },
        { etiqueta: 'Sesiones completadas', valor: datos.kpis.completadas, nota: 'Cierre exitoso', Icono: CheckCircle2, tono: 'from-[#7be0b0] to-[#3fae82]' },
        { etiqueta: 'Ocupación semanal', valor: datos.kpis.ocupacion, sufijo: '%', nota: 'Sobre capacidad operativa', Icono: Gauge, tono: 'from-[#f04fa6] to-[#b1306f]' },
        { etiqueta: 'Solicitudes abiertas', valor: datos.kpis.solicitudesAbiertas, nota: 'En petición o negociación', Icono: Inbox, tono: 'from-[#ffd166] to-[#d99b26]' },
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

    const metricasHero = [
        { etiqueta: 'Sesiones', valor: datos.kpis.totalSesiones, sufijo: '' },
        { etiqueta: 'Ocupación', valor: datos.kpis.ocupacion, sufijo: '%' },
        { etiqueta: 'Por gestionar', valor: datos.kpis.solicitudesAbiertas, sufijo: '' },
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
                <section
                    data-tile
                    className="relative overflow-hidden rounded-[2.25rem] border border-accent/25 p-6 sm:p-8"
                    style={{
                        background:
                            'radial-gradient(ellipse at 88% 4%, rgba(240, 79, 166, 0.3), transparent 46%), radial-gradient(ellipse at 4% 100%, rgba(111, 75, 187, 0.34), transparent 50%), linear-gradient(120deg, rgba(111, 75, 187, 0.36), rgba(23, 19, 34, 0.97) 72%)',
                    }}
                >
                    <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 animate-aurora rounded-full bg-[#e34ba6]/25 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 select-none text-[11rem] font-black leading-none tracking-tighter text-white/[0.04] lg:block">
                        Z·1
                    </div>
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-exito/40 bg-exito/10 px-3 py-1 text-xs font-bold text-exito-soft">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-exito" aria-hidden="true" />
                                En vivo
                            </span>
                            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                                El estudio, latiendo en tiempo real.
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-sutil">
                                Ocupación, ingresos y talento en una sola lectura. Detecta el ritmo de la semana y dónde poner el foco.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {metricasHero.map((metrica) => (
                                <div key={metrica.etiqueta} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                                    <strong className="block text-2xl font-black tracking-tight text-texto-soft">
                                        <Contador valor={metrica.valor} sufijo={metrica.sufijo} />
                                    </strong>
                                    <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">{metrica.etiqueta}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Métricas generales">
                    {kpis.map(({ etiqueta, valor, sufijo, nota, Icono, tono }) => (
                        <article
                            key={etiqueta}
                            data-tile
                            className={`${TARJETA} group hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40`}
                        >
                            <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#9365f2]/20 blur-2xl transition duration-300 group-hover:bg-[#e34ba6]/30" />
                            <div className="relative flex items-center justify-between">
                                <span className="text-sm text-sutil">{etiqueta}</span>
                                <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${tono} text-white shadow-lg`}>
                                    <Icono className="h-4 w-4" aria-hidden="true" />
                                </span>
                            </div>
                            <strong className="relative mt-3 block text-4xl font-extrabold tracking-tight text-texto-soft">
                                <Contador valor={valor} sufijo={sufijo} />
                            </strong>
                            <span className="relative mt-1 block text-xs text-sutil/80">{nota}</span>
                            <span aria-hidden="true" className="relative mt-3 block h-1 rounded-full bg-gradient-to-r from-[#9365f2] to-[#e34ba6] opacity-70" />
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
                        <p className="workspace-eyebrow relative flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> SÍNTESIS
                        </p>
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

                <section data-tile className={TARJETA}>
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="workspace-eyebrow flex items-center gap-2">
                                <Flame className="h-3.5 w-3.5" aria-hidden="true" /> INTENSIDAD
                            </p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-texto-soft">Cuándo suena el estudio</h2>
                        </div>
                        <span className="text-xs text-sutil">Sesiones por día y franja horaria</span>
                    </div>
                    <MapaCalor
                        filas={datos.mapaCalor.filas}
                        columnas={datos.mapaCalor.columnas}
                        celdas={datos.mapaCalor.celdas}
                        max={datos.mapaCalor.max}
                    />
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
                            <p className="workspace-eyebrow flex items-center gap-2">
                                <Radio className="h-3.5 w-3.5" aria-hidden="true" /> RITMO
                            </p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-texto-soft">Pulso semanal</h2>
                        </div>
                        <ColumnasDias datos={datos.conteoDias} />
                    </article>
                </section>

                <section className="grid gap-5 lg:grid-cols-3">
                    <article data-tile className={TARJETA}>
                        <div className="mb-5">
                            <p className="workspace-eyebrow flex items-center gap-2">
                                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> INGRESOS
                            </p>
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
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segmento.color, boxShadow: `0 0 10px ${segmento.color}` }} />
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
                                <li key={insight.etiqueta} className={`rounded-2xl border p-3.5 transition hover:brightness-110 ${TONOS[insight.tono] ?? TONOS.accent}`}>
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
