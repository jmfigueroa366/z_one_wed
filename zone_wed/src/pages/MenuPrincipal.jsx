// CAPA: Presentación
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import anime from 'animejs';
import { useAuth } from '../context/AuthContext.jsx';
import { useSesiones } from '../hooks/useSesiones.js';
import { artistasDestacados } from '../data/artistasDestacados.js';
import { productoresDestacados } from '../data/productoresDestacados.js';
import { RUTAS, rutasPermitidasPorRol } from '../config/rutas.js';
import '../styles/tailwind.css';
import '../styles/principal.css';

const TARJETA =
    'group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-2/80 transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl hover:shadow-black/30';

function Creditos({ item }) {
    if (item.fotografia) {
        return (
            <p className="mt-auto pt-4 text-[0.68rem] leading-5 text-sutil/70">
                Foto:{' '}
                <a className="underline decoration-sutil/40 underline-offset-2 hover:text-accent-soft" href={item.fuenteFotografia} target="_blank" rel="noopener noreferrer">
                    {item.fotografia}
                </a>
                {' · '}
                <a className="underline decoration-sutil/40 underline-offset-2 hover:text-accent-soft" href={item.fuenteLicencia} target="_blank" rel="noopener noreferrer">
                    {item.licencia}
                </a>
            </p>
        );
    }

    return (
        <p className="mt-auto pt-4 text-[0.68rem] leading-5 text-sutil/70">
            Foto: {item.credito}
            {item.licencia ? ` · ${item.licencia}` : ''}
        </p>
    );
}

function Retrato({ item }) {
    if (item.imagen) {
        return (
            <div className="relative h-56 overflow-hidden bg-surface">
                <img
                    src={item.imagen}
                    alt={item.textoAlternativo}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-2 via-surface-2/10 to-transparent" />
            </div>
        );
    }

    return (
        <div className="relative grid h-56 place-items-center overflow-hidden bg-gradient-to-br from-[#2a1d3c] to-[#15111f]">
            <span className="text-6xl font-black tracking-tighter text-texto-soft">{item.iniciales}</span>
            <span className="mt-1 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-magenta">Princesa</span>
            <span className="absolute bottom-3 text-xs text-sutil">Retrato por confirmar</span>
        </div>
    );
}

export default function MenuPrincipal() {
    const { usuario } = useAuth();
    const rutasPermitidas = rutasPermitidasPorRol(usuario?.rol);
    const puedeGestionarSesiones = rutasPermitidas.includes(RUTAS.SESIONES);
    const [sesiones] = useSesiones();
    const showcaseRef = useRef(null);
    const sesionesActivas = sesiones.filter((sesion) =>
        ['confirmada', 'en_proceso'].includes(sesion.estado)
    ).length;

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return undefined;
        }

        const contenedor = showcaseRef.current;
        if (!contenedor) return undefined;

        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-menu-card]'),
            opacity: [0, 1],
            translateY: [22, 0],
            duration: 560,
            delay: anime.stagger(85),
            easing: 'easeOutCubic',
        });

        return () => animacion.pause();
    }, []);

    const resumenCards = [
        {
            icono: '●',
            etiqueta: 'Estado de la plataforma',
            valor: 'Producción activa',
            nota: 'Servicios del estudio disponibles',
            destacada: true,
        },
        {
            icono: '◷',
            etiqueta: 'Sesiones activas',
            valor: sesionesActivas,
            nota: 'Confirmadas o en proceso',
        },
        {
            icono: '✦',
            etiqueta: 'Sesiones registradas',
            valor: sesiones.length,
            nota: 'En la agenda del estudio',
        },
    ];

    return (
        <main className="workspace-content dashboard-content">
            <section
                className="relative overflow-hidden rounded-3xl border border-accent/25 p-8 sm:p-10"
                style={{
                    background:
                        'radial-gradient(ellipse at 82% 12%, rgba(214, 70, 169, 0.22), transparent 42%), linear-gradient(115deg, rgba(111, 75, 187, 0.28), rgba(31, 24, 47, 0.94) 68%)',
                }}
            >
                <p className="workspace-eyebrow">PANEL PRINCIPAL · GESTIÓN MUSICAL</p>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                    Hola, {usuario?.nombre ?? 'usuario'}.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-sutil">
                    Bienvenido al centro operativo de Z-ONE. Organiza la producción y coordina las sesiones del estudio
                    desde un panel pensado para el trabajo diario.
                </p>
                {puedeGestionarSesiones && (
                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link
                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-5 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:-translate-y-0.5 hover:brightness-110"
                            to={`${RUTAS.SESIONES}#crear`}
                        >
                            Crear sesión
                        </Link>
                        <Link
                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-white/[0.045] px-5 text-sm font-bold text-texto transition hover:-translate-y-0.5 hover:border-accent/60"
                            to={`${RUTAS.SESIONES}#registrar`}
                        >
                            Registrar sesión
                        </Link>
                    </div>
                )}
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Resumen del estudio">
                {resumenCards.map((card) => (
                    <article
                        key={card.etiqueta}
                        className={`flex flex-col gap-2 rounded-2xl border border-border p-5 ${
                            card.destacada
                                ? 'bg-gradient-to-br from-[#5b418f]/40 to-surface/80'
                                : 'bg-surface/70'
                        }`}
                    >
                        <span className="text-accent-soft" aria-hidden="true">{card.icono}</span>
                        <p className="text-sm text-sutil">{card.etiqueta}</p>
                        <strong
                            className={
                                card.destacada
                                    ? 'text-lg font-bold text-texto-soft'
                                    : 'text-3xl font-extrabold tracking-tight text-texto-soft'
                            }
                        >
                            {card.valor}
                        </strong>
                        <span className="text-xs text-sutil/80">{card.nota}</span>
                    </article>
                ))}
            </section>

            <section className="grid gap-5 rounded-3xl border border-border bg-surface/60 p-6 sm:p-8">
                <div>
                    <p className="workspace-eyebrow">INFORMACIÓN DE Z-ONE</p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-texto-soft">
                        Una gestión musical centralizada
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-sutil">
                        Z-ONE reúne la producción musical, el talento, las salas y la agenda para facilitar la
                        coordinación del estudio.
                    </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rutasPermitidas.includes(RUTAS.SESIONES) && (
                        <article className="flex flex-col rounded-2xl border border-border bg-white/[0.025] p-5 transition hover:border-accent/40">
                            <h3 className="text-base font-bold text-texto">Sesiones de grabación</h3>
                            <p className="mt-2 text-sm leading-6 text-sutil">
                                Crea, programa y registra las sesiones del estudio.
                            </p>
                            <Link className="mt-4 text-sm font-bold text-accent-soft transition hover:text-magenta" to={RUTAS.SESIONES}>
                                Ver sesiones <span aria-hidden="true">→</span>
                            </Link>
                        </article>
                    )}
                    {rutasPermitidas.includes(RUTAS.AGENDA) && (
                        <article className="flex flex-col rounded-2xl border border-border bg-white/[0.025] p-5 transition hover:border-accent/40">
                            <h3 className="text-base font-bold text-texto">Agenda</h3>
                            <p className="mt-2 text-sm leading-6 text-sutil">
                                Consulta las reservas y actividades programadas.
                            </p>
                            <Link className="mt-4 text-sm font-bold text-accent-soft transition hover:text-magenta" to={RUTAS.AGENDA}>
                                Abrir agenda <span aria-hidden="true">→</span>
                            </Link>
                        </article>
                    )}
                    {rutasPermitidas.includes(RUTAS.ARTISTAS) && (
                        <article className="flex flex-col rounded-2xl border border-border bg-white/[0.025] p-5 transition hover:border-accent/40">
                            <h3 className="text-base font-bold text-texto">Equipo creativo</h3>
                            <p className="mt-2 text-sm leading-6 text-sutil">
                                Explora artistas y productores del estudio.
                            </p>
                            <Link className="mt-4 text-sm font-bold text-accent-soft transition hover:text-magenta" to={RUTAS.ARTISTAS}>
                                Ver artistas <span aria-hidden="true">→</span>
                            </Link>
                        </article>
                    )}
                </div>
            </section>

            <div ref={showcaseRef} className="grid gap-6">
                <section className="grid gap-6 rounded-3xl border border-border bg-surface/60 p-6 sm:p-8" aria-labelledby="artist-showcase-title">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="workspace-eyebrow">VOCES QUE INSPIRAN</p>
                            <h2 id="artist-showcase-title" className="mt-1 text-2xl font-bold tracking-tight text-texto-soft">
                                Artistas destacados
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-7 text-sutil">
                                Un recorrido por artistas colombianos y latinos que dejan huella en distintos sonidos.
                            </p>
                        </div>
                        <span className="rounded-full border border-accent-soft/30 px-3 py-1.5 text-[0.68rem] font-extrabold tracking-[0.1em] text-accent-soft">
                            {String(artistasDestacados.length).padStart(2, '0')} PERFILES
                        </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {artistasDestacados.map((artista) => (
                            <article className={TARJETA} key={artista.nombre} data-menu-card>
                                <Retrato item={artista} />
                                <div className="flex flex-1 flex-col p-5">
                                    <p className="text-[0.72rem] font-bold tracking-wide text-accent-soft">{artista.origen}</p>
                                    <h3 className="mt-1 text-lg font-bold text-texto-soft">{artista.nombre}</h3>
                                    <span className="mt-2 inline-flex w-fit rounded-full bg-magenta/10 px-2.5 py-1 text-[0.7rem] font-semibold text-magenta">
                                        {artista.estilo}
                                    </span>
                                    <p className="mt-3 text-sm leading-6 text-sutil">{artista.historia}</p>
                                    <Creditos item={artista} />
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="grid gap-6 rounded-3xl border border-border bg-surface/60 p-6 sm:p-8" aria-labelledby="producer-showcase-title">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="workspace-eyebrow">ARQUITECTOS DEL SONIDO</p>
                            <h2 id="producer-showcase-title" className="mt-1 text-2xl font-bold tracking-tight text-texto-soft">
                                Productores destacados
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-7 text-sutil">
                                Cuatro productores cuya visión y trabajo ayudaron a transformar la historia de la música.
                            </p>
                        </div>
                        <span className="rounded-full border border-accent-soft/30 px-3 py-1.5 text-[0.68rem] font-extrabold tracking-[0.1em] text-accent-soft">
                            04 PRODUCTORES
                        </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {productoresDestacados.map((productor) => (
                            <article className={TARJETA} key={productor.nombre} data-menu-card>
                                <Retrato item={productor} />
                                <div className="flex flex-1 flex-col p-5">
                                    <p className="text-[0.72rem] font-bold tracking-wide text-accent-soft">{productor.origen}</p>
                                    <h3 className="mt-1 text-lg font-bold text-texto-soft">{productor.nombre}</h3>
                                    <span className="mt-2 inline-flex w-fit rounded-full bg-magenta/10 px-2.5 py-1 text-[0.7rem] font-semibold text-magenta">
                                        {productor.estilo}
                                    </span>
                                    <p className="mt-3 text-sm leading-6 text-sutil">{productor.historia}</p>
                                    <Creditos item={productor} />
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
