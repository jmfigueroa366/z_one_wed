// CAPA: Presentación
import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import anime from 'animejs';
import { ArrowRight, Disc3, Mic, SlidersHorizontal, Sparkles, Wand2 } from 'lucide-react';
import { useSalas } from '../hooks/useSalas.js';
import { useSpotlight } from '../hooks/useSpotlight.js';
import { useAuth } from '../context/AuthContext.jsx';
import { esCliente } from '../config/roles.js';
import { RUTAS } from '../config/rutas.js';
import { Contador, Ecualizador, FondoHero } from '../components/Animados.jsx';
import { BOTON_PRIMARIO } from '../styles/clases.js';
import { formatearMoneda } from '../utils/helpers.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SERVICIOS = [
    { nombre: 'Grabación', descripcion: 'Captura voces e instrumentos en una sesión de estudio.', icono: Mic, acento: '#9ecbff' },
    { nombre: 'Producción musical', descripcion: 'Desarrolla arreglos, sonido y dirección para tus canciones.', icono: Wand2, acento: '#a477ff' },
    { nombre: 'Mezcla', descripcion: 'Equilibra pistas y prepara la mezcla de tu proyecto.', icono: SlidersHorizontal, acento: '#f04fa6' },
    { nombre: 'Masterización', descripcion: 'Da el acabado final y prepara el audio para su distribución.', icono: Disc3, acento: '#7be0b0' },
];

const ARTE_SALA = [
    {
        fondo: 'radial-gradient(ellipse at 78% 8%, rgba(240, 79, 166, 0.5), transparent 46%), radial-gradient(ellipse at 10% 96%, rgba(111, 75, 187, 0.5), transparent 52%), linear-gradient(150deg, #3a2456, #120c1e 82%)',
        acento: '#f04fa6',
    },
    {
        fondo: 'radial-gradient(ellipse at 20% 12%, rgba(164, 119, 255, 0.5), transparent 48%), radial-gradient(ellipse at 88% 92%, rgba(83, 147, 218, 0.45), transparent 54%), linear-gradient(150deg, #2a1f4d, #120c1e 82%)',
        acento: '#a477ff',
    },
    {
        fondo: 'radial-gradient(ellipse at 70% 14%, rgba(158, 203, 255, 0.42), transparent 48%), radial-gradient(ellipse at 12% 90%, rgba(240, 79, 166, 0.4), transparent 52%), linear-gradient(150deg, #233248, #120c1e 82%)',
        acento: '#9ecbff',
    },
];

export default function Catalogo() {
    const [salas] = useSalas();
    const { usuario } = useAuth();
    const destinoReserva = esCliente(usuario) ? `${RUTAS.SOLICITUDES}#nueva-reserva` : `${RUTAS.SESIONES}#crear`;
    const contenedorRef = useRef(null);
    const [heroRef, seguirSpotlight] = useSpotlight();

    const salasActivas = useMemo(() => salas.filter((sala) => sala.activo !== false), [salas]);
    const precioMinimo = useMemo(() => {
        const precios = salasActivas.map((sala) => Number(sala.precio_hora) || 0).filter((valor) => valor > 0);
        return precios.length ? Math.min(...precios) : 0;
    }, [salasActivas]);

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const contenedor = contenedorRef.current;
        if (!contenedor) return undefined;
        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-tile]'),
            opacity: [0, 1],
            translateY: [26, 0],
            duration: 620,
            delay: anime.stagger(90),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [salasActivas.length]);

    return (
        <main className="workspace-content" data-page="catalogo">
            <header className="page-heading border-l-4 border-magenta pl-4">
                <p className="workspace-eyebrow">ESPACIOS Y SERVICIOS</p>
                <h1>Catálogo del estudio</h1>
                <p>Consulta las salas disponibles, sus tarifas y los servicios que puedes coordinar con Z-ONE.</p>
            </header>

            <div ref={contenedorRef} className="mt-6 grid gap-6">
                <section
                    data-tile
                    ref={heroRef}
                    onMouseMove={seguirSpotlight}
                    className="group/hero relative overflow-hidden rounded-[2.5rem] border border-accent/30 p-7 sm:p-10"
                    style={{
                        background:
                            'radial-gradient(ellipse at 88% 4%, rgba(240, 79, 166, 0.34), transparent 44%), radial-gradient(ellipse at 6% 100%, rgba(111, 75, 187, 0.4), transparent 52%), linear-gradient(120deg, rgba(60, 40, 96, 0.55), rgba(18, 12, 30, 0.98) 72%)',
                    }}
                >
                    <FondoHero acento="#f04fa6" />
                    <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 animate-aurora rounded-full bg-[#e34ba6]/30 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-24 h-64 w-64 animate-aurora rounded-full bg-[#9365f2]/25 blur-3xl [animation-delay:-7s]" />
                    <div aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 select-none text-[11rem] font-black leading-none tracking-tighter text-white/[0.045] lg:block">
                        Z·1
                    </div>

                    <div className="relative max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-accent-soft/30 bg-black/25 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-accent-soft">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-exito" />
                            {salasActivas.length} cabinas operativas
                        </span>
                        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-5xl">
                            Sonido hecho <span className="texto-degradado">espacio.</span>
                        </h2>
                        <p className="mt-4 max-w-xl text-sm leading-7 text-sutil sm:text-base">
                            Cabinas tratadas y una sala de mezcla listas para tu próximo proyecto. Elige tu
                            espacio, revisa la tarifa y agenda la sesión en minutos.
                        </p>

                        <div className="mt-7 flex flex-wrap items-center gap-3">
                            <Link to={destinoReserva} className={BOTON_PRIMARIO}>
                                <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" /> Reservar cabina
                            </Link>
                            <a
                                href="#catalogo-servicios"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-texto transition hover:-translate-y-0.5 hover:border-accent/50 hover:bg-white/[0.08]"
                            >
                                Ver servicios <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </a>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-4">
                            {precioMinimo > 0 && (
                                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
                                    <span className="block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Desde</span>
                                    <strong className="text-lg font-extrabold text-texto-soft">{formatearMoneda(precioMinimo)}</strong>
                                    <span className="text-xs text-sutil">/hora</span>
                                </div>
                            )}
                            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
                                <span className="block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Servicios</span>
                                <strong className="text-lg font-extrabold text-texto-soft"><Contador valor={SERVICIOS.length} pad={2} /></strong>
                                <span className="text-xs text-sutil"> flujo integral</span>
                            </div>
                            <Ecualizador desde="#f04fa6" hasta="#a477ff" alto={40} />
                        </div>
                    </div>
                </section>

                <section data-tile className="rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur sm:p-7" aria-labelledby="catalog-rooms-title">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="workspace-eyebrow">ESPACIOS Z-ONE</p>
                            <h2 id="catalog-rooms-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                                Salas de grabación
                            </h2>
                        </div>
                        <span className="rounded-full border border-exito/40 bg-exito/10 px-3 py-1.5 text-xs font-bold text-exito-soft">
                            {salasActivas.length} disponibles
                        </span>
                    </div>

                    {salasActivas.length ? (
                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {salasActivas.map((sala, index) => {
                                const arte = ARTE_SALA[index % ARTE_SALA.length];
                                return (
                                    <article
                                        key={sala.id ?? sala.nombre}
                                        className="tarjeta-brillo group relative overflow-hidden rounded-[1.75rem] border border-border bg-[#120c1e]/85 transition duration-300 hover:-translate-y-1.5 hover:border-accent/50 hover:shadow-2xl hover:shadow-black/50"
                                    >
                                        <div className="relative flex h-40 items-end justify-between overflow-hidden p-4" style={{ background: arte.fondo }}>
                                            <span className="text-xs font-extrabold tracking-[0.12em] text-white/60">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                            <span className="select-none text-8xl font-black leading-none tracking-tighter text-white/12 transition duration-500 group-hover:scale-110 group-hover:text-white/25">
                                                Z
                                            </span>
                                            <span
                                                className="pointer-events-none absolute inset-x-0 -bottom-2 h-20 opacity-0 blur-2xl transition duration-500 group-hover:opacity-70"
                                                style={{ background: arte.acento }}
                                            />
                                            <span
                                                className="absolute bottom-4 right-4 inline-flex items-baseline gap-1 rounded-xl border px-3 py-1.5 backdrop-blur"
                                                style={{ borderColor: `${arte.acento}66`, background: 'rgba(0,0,0,0.4)' }}
                                            >
                                                <strong className="text-sm font-extrabold text-texto-soft">{formatearMoneda(sala.precio_hora)}</strong>
                                                <span className="text-[0.62rem] text-sutil">/h</span>
                                            </span>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-2.5">
                                                <h3 className="text-base font-bold text-texto-soft">{sala.nombre}</h3>
                                                <span className="shrink-0 rounded-full border border-exito/40 bg-exito/10 px-2 py-0.5 text-[0.66rem] font-bold text-exito-soft">
                                                    Activa
                                                </span>
                                            </div>
                                            <p className="my-3 text-sm leading-6 text-sutil">
                                                Espacio del estudio disponible para coordinar sesiones de producción musical.
                                            </p>
                                            <div className="flex items-baseline justify-between border-t border-border/60 pt-3">
                                                <span className="text-xs text-sutil">Tarifa por hora</span>
                                                <strong className="text-lg font-extrabold text-texto-soft">{formatearMoneda(sala.precio_hora)}</strong>
                                            </div>
                                            <Link
                                                className="mt-3 inline-flex items-center gap-2 text-sm font-bold transition group-hover:gap-3"
                                                style={{ color: arte.acento }}
                                                to={destinoReserva}
                                            >
                                                Programar una sesión <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="mt-5 py-3 text-center text-sutil">En este momento no hay salas activas en el catálogo.</p>
                    )}
                </section>

                <section
                    data-tile
                    id="catalogo-servicios"
                    className="rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur sm:p-8"
                    aria-labelledby="catalog-services-title"
                >
                    <div>
                        <p className="workspace-eyebrow">FLUJO DE PRODUCCIÓN</p>
                        <h2 id="catalog-services-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                            Servicios del estudio
                        </h2>
                    </div>
                    <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <span aria-hidden="true" className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent lg:block" />
                        {SERVICIOS.map((servicio, index) => {
                            const Icono = servicio.icono;
                            return (
                                <article
                                    key={servicio.nombre}
                                    className="group relative min-h-[188px] overflow-hidden rounded-2xl border border-border bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:bg-white/[0.05]"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition duration-500 group-hover:opacity-60"
                                        style={{ background: `${servicio.acento}55` }}
                                    />
                                    <div className="relative flex items-center justify-between">
                                        <span
                                            className="grid h-11 w-11 place-items-center rounded-xl text-white transition duration-500 group-hover:scale-110"
                                            style={{ background: `linear-gradient(135deg, ${servicio.acento}, #5b418f)` }}
                                            aria-hidden="true"
                                        >
                                            <Icono className="h-5 w-5" />
                                        </span>
                                        <span className="text-xs font-extrabold tracking-[0.12em]" style={{ color: servicio.acento }}>
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                    </div>
                                    <h3 className="relative mt-4 text-base font-bold text-texto-soft">{servicio.nombre}</h3>
                                    <p className="relative mt-2 text-sm leading-6 text-sutil">{servicio.descripcion}</p>
                                </article>
                            );
                        })}
                    </div>
                </section>
            </div>
        </main>
    );
}
