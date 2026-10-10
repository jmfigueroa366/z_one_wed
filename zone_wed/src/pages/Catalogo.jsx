// CAPA: Presentación
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import anime from 'animejs';
import { useSalas } from '../hooks/useSalas.js';
import { RUTAS } from '../config/rutas.js';
import { formatearMoneda } from '../utils/helpers.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SERVICIOS = [
    { nombre: 'Grabación', descripcion: 'Captura voces e instrumentos en una sesión de estudio.', icono: '🎙' },
    { nombre: 'Producción musical', descripcion: 'Desarrolla arreglos, sonido y dirección para tus canciones.', icono: '🎛' },
    { nombre: 'Mezcla', descripcion: 'Equilibra pistas y prepara la mezcla de tu proyecto.', icono: '🎚' },
    { nombre: 'Masterización', descripcion: 'Da el acabado final y prepara el audio para su distribución.', icono: '💽' },
];

const ARTE_SALA = [
    {
        fondo: 'radial-gradient(ellipse at 75% 10%, rgba(240, 79, 166, 0.45), transparent 48%), linear-gradient(140deg, #3a2456, #171322 80%)',
        acento: '#f04fa6',
    },
    {
        fondo: 'radial-gradient(ellipse at 22% 14%, rgba(83, 147, 218, 0.42), transparent 50%), linear-gradient(140deg, #223a54, #171322 80%)',
        acento: '#9ecbff',
    },
    {
        fondo: 'radial-gradient(ellipse at 72% 12%, rgba(255, 209, 102, 0.38), transparent 50%), linear-gradient(140deg, #4a3a22, #171322 80%)',
        acento: '#ffd166',
    },
];

export default function Catalogo() {
    const [salas] = useSalas();
    const contenedorRef = useRef(null);
    const salasActivas = salas.filter((sala) => sala.activo !== false);
    const precios = salasActivas.map((sala) => Number(sala.precio_hora) || 0).filter((valor) => valor > 0);
    const precioMinimo = precios.length ? Math.min(...precios) : 0;

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const contenedor = contenedorRef.current;
        if (!contenedor) return undefined;
        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-tile]'),
            opacity: [0, 1],
            translateY: [22, 0],
            duration: 620,
            delay: anime.stagger(75),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, []);

    return (
        <main className="workspace-content" data-page="catalogo">
            <header className="page-heading border-l-4 border-[#f2b84b] pl-4">
                <p className="workspace-eyebrow">ESPACIOS Y SERVICIOS</p>
                <h1>Catálogo del estudio</h1>
                <p>Consulta las salas disponibles, sus tarifas registradas y los servicios que puedes coordinar con Z-ONE.</p>
            </header>

            <div ref={contenedorRef} className="mt-6 grid gap-5">
                <section
                    data-tile
                    className="relative overflow-hidden rounded-[2rem] border border-accent/25 p-7 sm:p-9"
                    style={{
                        background:
                            'radial-gradient(ellipse at 88% 6%, rgba(240, 79, 166, 0.28), transparent 46%), linear-gradient(120deg, rgba(111, 75, 187, 0.38), rgba(23, 19, 34, 0.97) 72%)',
                    }}
                >
                    <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 animate-aurora rounded-full bg-[#9365f2]/30 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-16 h-56 w-56 animate-aurora rounded-full bg-[#e34ba6]/25 blur-3xl [animation-delay:-6s]" />
                    <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 select-none text-[10rem] font-black leading-none tracking-tighter text-white/[0.04] lg:block">
                        Z·1
                    </div>

                    <div className="relative max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-accent-soft/30 bg-black/20 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-accent-soft">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-exito" />
                            {salasActivas.length} cabinas operativas
                        </span>
                        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                            Sonido hecho espacio.
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-sutil">
                            Cabinas tratadas y una sala de mezcla listas para tu próximo proyecto. Elige tu espacio y
                            agenda la sesión en minutos.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center gap-4">
                            {precioMinimo > 0 && (
                                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                                    <span className="block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Desde</span>
                                    <strong className="text-lg font-extrabold text-texto-soft">{formatearMoneda(precioMinimo)}</strong>
                                    <span className="text-xs text-sutil">/hora</span>
                                </div>
                            )}
                            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                                <span className="block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Servicios</span>
                                <strong className="text-lg font-extrabold text-texto-soft">{String(SERVICIOS.length).padStart(2, '0')}</strong>
                                <span className="text-xs text-sutil"> flujo integral</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section data-tile className="rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur" aria-labelledby="catalog-rooms-title">
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
                                const arte = ARTE_SALA[index % 3];
                                return (
                                    <article
                                        key={sala.id ?? sala.nombre}
                                        className="group relative overflow-hidden rounded-2xl border border-border bg-[#120f1d]/80 transition duration-300 hover:-translate-y-1.5 hover:border-accent/50 hover:shadow-2xl hover:shadow-black/50"
                                    >
                                        <div
                                            className="relative flex h-36 items-end justify-between overflow-hidden p-4"
                                            style={{ background: arte.fondo }}
                                            aria-hidden="true"
                                        >
                                            <span className="text-xs font-extrabold tracking-[0.12em] text-white/60">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                            <span className="select-none text-7xl font-black leading-none tracking-tighter text-white/15 transition duration-500 group-hover:scale-110 group-hover:text-white/25">
                                                Z
                                            </span>
                                            <span
                                                className="pointer-events-none absolute inset-x-0 -bottom-1 h-16 opacity-0 blur-2xl transition duration-500 group-hover:opacity-60"
                                                style={{ background: arte.acento }}
                                            />
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-2.5">
                                                <h3 className="text-base font-bold text-texto-soft">{sala.nombre}</h3>
                                                <span className="shrink-0 text-xs font-bold text-exito-soft">
                                                    <span aria-hidden="true">●</span> Activa
                                                </span>
                                            </div>
                                            <p className="my-3 text-sm leading-6 text-sutil">
                                                Espacio del estudio disponible para coordinar sesiones de producción musical.
                                            </p>
                                            <div className="flex items-baseline gap-2 border-t border-border/60 py-3">
                                                <strong className="text-xl font-bold text-texto-soft">{formatearMoneda(sala.precio_hora)}</strong>
                                                <span className="text-xs text-sutil">por hora</span>
                                            </div>
                                            <Link
                                                className="inline-flex items-center gap-2 text-sm font-bold text-accent-soft transition group-hover:gap-3 hover:text-magenta"
                                                to={`${RUTAS.SESIONES}#crear`}
                                            >
                                                Programar una sesión <span aria-hidden="true">→</span>
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

                <section data-tile className="rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur sm:p-8" aria-labelledby="catalog-services-title">
                    <div>
                        <p className="workspace-eyebrow">FLUJO DE PRODUCCIÓN</p>
                        <h2 id="catalog-services-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                            Servicios del estudio
                        </h2>
                    </div>
                    <div className="relative mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <span aria-hidden="true" className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent lg:block" />
                        {SERVICIOS.map((servicio, index) => (
                            <article
                                key={servicio.nombre}
                                className="group relative min-h-[172px] rounded-2xl border border-border bg-white/[0.025] p-5 transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:bg-white/[0.05]"
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#5b418f]/60 to-surface-2 text-lg transition group-hover:from-[#9365f2]/70 group-hover:to-[#e34ba6]/50"
                                        aria-hidden="true"
                                    >
                                        {servicio.icono}
                                    </span>
                                    <span className="text-xs font-extrabold tracking-[0.12em] text-accent-soft">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <h3 className="mt-4 text-base font-bold text-texto-soft">{servicio.nombre}</h3>
                                <p className="mt-2 text-sm leading-6 text-sutil">{servicio.descripcion}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
