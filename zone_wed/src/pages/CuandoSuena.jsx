// CAPA: Presentación
import { useEffect, useMemo, useRef } from 'react';
import anime from 'animejs';
import { Activity, CalendarDays, Clock, Flame, Sparkles, TrendingUp } from 'lucide-react';
import { FondoHero } from '../components/Animados.jsx';
import { MapaCalor } from '../components/Graficos.jsx';
import { useSesiones } from '../hooks/useSesiones.js';
import { useSpotlight } from '../hooks/useSpotlight.js';
import { EstadisticasService } from '../services/estadisticasService.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

const TARJETA = 'relative overflow-hidden rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur transition duration-300 hover:border-accent/40';

export default function CuandoSuena() {
    const [sesiones] = useSesiones();
    const contenedorRef = useRef(null);
    const [heroRef, seguirSpotlight] = useSpotlight();

    const datos = useMemo(() => EstadisticasService.obtenerAnalitica(), [sesiones]);

    const mapa = datos.mapaCalor;
    const total = useMemo(
        () => mapa.celdas.reduce((suma, fila) => suma + fila.reduce((a, b) => a + b, 0), 0),
        [mapa]
    );

    const lecturas = useMemo(() => {
        const sumasFilas = mapa.celdas.map((fila, i) => ({
            etiqueta: mapa.filas[i],
            valor: fila.reduce((a, b) => a + b, 0),
        }));
        const sumasColumnas = (mapa.celdas[0] ?? [])
            .map((_, j) => mapa.celdas.reduce((suma, fila) => suma + (fila[j] ?? 0), 0))
            .map((valor, j) => ({ etiqueta: mapa.columnas[j], valor }));
        const diaPico = [...sumasFilas].sort((a, b) => b.valor - a.valor)[0];
        const franjaPico = [...sumasColumnas].sort((a, b) => b.valor - a.valor)[0];
        const celdasActivas = mapa.celdas.flat().filter((valor) => valor > 0).length;
        const promedioDia = total > 0 ? Math.round((total / mapa.filas.length) * 10) / 10 : 0;
        return { diaPico, franjaPico, celdasActivas, promedioDia };
    }, [mapa, total]);

    useEffect(() => {
        const contenedor = contenedorRef.current;
        if (!contenedor || MENOS_MOVIMIENTO()) return undefined;
        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-aparece]'),
            opacity: [0, 1],
            translateY: [26, 0],
            duration: 640,
            delay: anime.stagger(90),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [datos]);

    const sinActividad = total === 0;

    return (
        <main className="workspace-content" data-page="cuando-suena">
            <header className="page-heading relative border-l-4 border-accent pl-4">
                <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-10 h-56 w-56 animate-aurora rounded-full bg-[#f04fa6]/20 blur-3xl" />
                <p className="workspace-eyebrow">RITMO · Z-ONE</p>
                <h1>Cuándo suena el estudio</h1>
                <p>La distribución de la operación por día y franja horaria, como un latido de calor.</p>
            </header>

            <div ref={contenedorRef} className="mt-6 grid gap-5">
                <section
                    data-aparece
                    ref={heroRef}
                    onMouseMove={seguirSpotlight}
                    className="group/hero relative overflow-hidden rounded-[2.25rem] border border-accent/25 p-6 sm:p-8"
                    style={{
                        background:
                            'radial-gradient(ellipse at 88% 4%, rgba(240, 79, 166, 0.32), transparent 48%), radial-gradient(ellipse at 4% 100%, rgba(111, 75, 187, 0.36), transparent 52%), linear-gradient(120deg, rgba(111, 75, 187, 0.38), rgba(23, 19, 34, 0.97) 72%)',
                    }}
                >
                    <FondoHero acento="#f04fa6" />
                    <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 animate-aurora rounded-full bg-[#e34ba6]/25 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 select-none text-[11rem] font-black leading-none tracking-tighter text-white/[0.04] lg:block">
                        Z·1
                    </div>
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-exito/40 bg-exito/10 px-3 py-1 text-xs font-bold text-exito-soft">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-exito" aria-hidden="true" />
                                Calor del estudio
                            </span>
                            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                                La semana <span className="texto-degradado">arde en horas exactas.</span>
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-sutil">
                                {lecturas.diaPico.valor > 0
                                    ? `${lecturas.diaPico.etiqueta} concentra la mayor actividad y ${lecturas.franjaPico.etiqueta} la franja más caliente de la semana.`
                                    : 'Sin sesiones registradas todavía: el mapa espera sus primeras manchas de calor.'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                                <strong className="block text-2xl font-black tracking-tight text-texto-soft">
                                    <Contador valor={total} />
                                </strong>
                                <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Sesiones</span>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                                <strong className="block text-2xl font-black tracking-tight text-texto-soft">
                                    {lecturas.diaPico.valor > 0 ? lecturas.diaPico.etiqueta : '—'}
                                </strong>
                                <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Día pico</span>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                                <strong className="block text-2xl font-black tracking-tight text-texto-soft">
                                    {lecturas.franjaPico.valor > 0 ? lecturas.franjaPico.etiqueta : '—'}
                                </strong>
                                <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Franja pico</span>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                                <strong className="block text-2xl font-black tracking-tight text-texto-soft">
                                    <Contador valor={lecturas.promedioDia} />
                                </strong>
                                <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">/día</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section data-aparece className={TARJETA}>
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="workspace-eyebrow flex items-center gap-2">
                                <Flame className="h-3.5 w-3.5" aria-hidden="true" /> MAPA DE CALOR
                            </p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-texto-soft">Cuándo suena el estudio</h2>
                            <p className="mt-1 text-sm text-sutil">Sesiones por día y franja horaria</p>
                        </div>
                        <span className="rounded-full border border-accent-soft/30 px-3 py-1 text-[0.68rem] font-extrabold tracking-[0.1em] text-accent-soft">
                            {String(total).padStart(2, '0')} REGISTROS
                        </span>
                    </div>

                    {sinActividad ? (
                        <p className="py-10 text-center text-sm text-sutil">Aún no hay sesiones que dibujen el calor del estudio.</p>
                    ) : (
                        <>
                            <MapaCalor
                                filas={mapa.filas}
                                columnas={mapa.columnas}
                                celdas={mapa.celdas}
                                max={mapa.max}
                                grande
                            />
                            <div className="mt-5 flex items-center justify-end gap-2 text-xs font-semibold text-sutil">
                                <span>Menos activo</span>
                                <span aria-hidden="true" className="h-2 w-28 rounded-full bg-gradient-to-r from-white/[0.06] via-[#9365f2] to-[#e34ba6]" />
                                <span>Más activo</span>
                            </div>
                        </>
                    )}
                </section>

                <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Lecturas del calor">
                    {[
                        {
                            etiqueta: 'Día pico',
                            valor: lecturas.diaPico.valor > 0 ? lecturas.diaPico.etiqueta : '—',
                            nota:
                                lecturas.diaPico.valor > 0
                                    ? `${lecturas.diaPico.valor} sesión(es) en su jornada más cargada`
                                    : 'Sin picos todavía',
                            Icono: CalendarDays,
                            detalle: lecturas.diaPico.valor,
                            tono: 'from-[#9365f2] to-[#6f4bbb]',
                        },
                        {
                            etiqueta: 'Franja más caliente',
                            valor: lecturas.franjaPico.valor > 0 ? lecturas.franjaPico.etiqueta : '—',
                            nota:
                                lecturas.franjaPico.valor > 0
                                    ? `${lecturas.franjaPico.valor} sesión(es) arrancan en esta franja`
                                    : 'Sin franja dominante',
                            Icono: Clock,
                            detalle: lecturas.franjaPico.valor,
                            tono: 'from-[#f04fa6] to-[#b1306f]',
                        },
                        {
                            etiqueta: 'Celdas activas',
                            valor: <Contador valor={lecturas.celdasActivas} />,
                            nota: 'Franjas con al menos una sesión',
                            Icono: Activity,
                            detalle: lecturas.celdasActivas,
                            tono: 'from-[#c9b6ff] to-[#8f6fd8]',
                        },
                        {
                            etiqueta: 'Ritmo semanal',
                            valor: <Contador valor={lecturas.promedioDia} />,
                            nota: 'Media de sesiones por día',
                            Icono: TrendingUp,
                            detalle: lecturas.promedioDia,
                            tono: 'from-[#7be0b0] to-[#3fae82]',
                        },
                    ].map((tarjeta) => (
                        <article
                            key={tarjeta.etiqueta}
                            data-aparece
                            className="group relative overflow-hidden rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-2xl hover:shadow-black/40"
                        >
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#9365f2]/20 blur-2xl transition duration-300 group-hover:bg-[#e34ba6]/30"
                            />
                            <div className="relative flex items-center justify-between">
                                <span className="text-sm text-sutil">{tarjeta.etiqueta}</span>
                                <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${tarjeta.tono} text-white shadow-lg`}>
                                    <tarjeta.Icono className="h-4 w-4" aria-hidden="true" />
                                </span>
                            </div>
                            <strong className="relative mt-3 block text-4xl font-extrabold tracking-tight text-texto-soft">
                                {tarjeta.valor}
                            </strong>
                            <span className="relative mt-1 block text-xs text-sutil/80">{tarjeta.nota}</span>
                            <span aria-hidden="true" className="relative mt-3 block h-1 rounded-full bg-gradient-to-r from-[#9365f2] to-[#e34ba6] opacity-70" />
                        </article>
                    ))}
                </section>

                <section data-aparece className={`${TARJETA} flex flex-col`}>
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 animate-aurora rounded-full bg-[#e34ba6]/20 blur-3xl [animation-delay:-5s]" />
                    <p className="workspace-eyebrow relative flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> LECTURA
                    </p>
                    <div className="relative mt-4 flex flex-1 flex-col items-center justify-center text-center">
                        <p className="max-w-2xl text-base leading-7 text-sutil">
                            {sinActividad
                                ? 'Registra las primeras sesiones en la agenda y este mapa empezará a mostrar dónde y cuándo quiere sonar Z-ONE.'
                                : `El estudio prefiere ${lecturas.diaPico.etiqueta} (${lecturas.diaPico.valor} sesión(es)) y cobra vida entre ${lecturas.franjaPico.etiqueta}. Esa es la ventana donde tu operación concentra el calor: úsala para abrir más cabinas, reservar talento y empujar la promoción exactamente cuando el público ya está conectado.`}
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}