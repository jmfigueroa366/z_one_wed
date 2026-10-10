// CAPA: Presentación
import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import anime from 'animejs';
import {
    Activity,
    ArrowRight,
    BarChart3,
    BookOpen,
    CalendarDays,
    Inbox,
    Mic,
    Mic2,
    MessageCircle,
    Music,
    Play,
    Settings,
    ShieldCheck,
    SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSesiones } from '../hooks/useSesiones.js';
import { artistasDestacados } from '../data/artistasDestacados.js';
import { productoresDestacados } from '../data/productoresDestacados.js';
import { cancionesArtistas } from '../data/cancionesArtistas.js';
import { RUTAS, rutasPermitidasPorRol } from '../config/rutas.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TARJETA =
    'group relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-6 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-2xl hover:shadow-black/40';

function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function saludoDelDia() {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

function fechaLarga() {
    try {
        return capitalizar(
            new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
        );
    } catch {
        return '';
    }
}

function Contador({ valor, relleno = false }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const objetivo = Number(valor) || 0;

        if (MENOS_MOVIMIENTO()) {
            el.textContent = relleno ? String(objetivo).padStart(2, '0') : String(objetivo);
            return undefined;
        }

        const estado = { actual: 0 };
        const animacion = anime({
            targets: estado,
            actual: objetivo,
            round: 1,
            duration: 1300,
            easing: 'easeOutExpo',
            update() {
                el.textContent = relleno ? String(estado.actual).padStart(2, '0') : String(estado.actual);
            },
        });

        return () => animacion.pause();
    }, [valor, relleno]);

    return <span ref={ref}>0</span>;
}

const ACCESOS = [
    { ruta: RUTAS.ESTUDIO, icono: Play, etiqueta: 'Escuchar artistas', descripcion: 'Reproductor del estudio' },
    { ruta: RUTAS.AGENDA, icono: CalendarDays, etiqueta: 'Agenda', descripcion: 'Reservas y actividades' },
    { ruta: RUTAS.SESIONES, icono: Mic, etiqueta: 'Sesiones', descripcion: 'Programa y registra' },
    { ruta: RUTAS.SOLICITUDES, icono: Inbox, etiqueta: 'Solicitudes', descripcion: 'Peticiones del estudio' },
    { ruta: RUTAS.PROYECTOS, icono: Music, etiqueta: 'Proyectos', descripcion: 'Canciones y avances' },
    { ruta: RUTAS.ARTISTAS, icono: Mic2, etiqueta: 'Artistas', descripcion: 'Talento del estudio' },
    { ruta: RUTAS.PRODUCTORES, icono: SlidersHorizontal, etiqueta: 'Productores', descripcion: 'Equipo de producción' },
    { ruta: RUTAS.CATALOGO, icono: BookOpen, etiqueta: 'Catálogo', descripcion: 'Servicios y tarifas' },
    { ruta: RUTAS.ESTADISTICAS, icono: BarChart3, etiqueta: 'Estadísticas', descripcion: 'Métricas del estudio' },
    { ruta: RUTAS.PERMISOS, icono: ShieldCheck, etiqueta: 'Permisos', descripcion: 'Roles y accesos' },
    { ruta: RUTAS.CHATBOT, icono: MessageCircle, etiqueta: 'Chatbot', descripcion: 'Asistente virtual' },
    { ruta: RUTAS.CONFIGURACION, icono: Settings, etiqueta: 'Configuración', descripcion: 'Ajustes de cuenta' },
];

export default function MenuPrincipal() {
    const { usuario } = useAuth();
    const rutasPermitidas = rutasPermitidasPorRol(usuario?.rol);
    const [sesiones] = useSesiones();
    const contenedorRef = useRef(null);
    const heroRef = useRef(null);

    const seguirSpotlight = (evento) => {
        const hero = heroRef.current;
        if (!hero) return;
        const caja = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', `${evento.clientX - caja.left}px`);
        hero.style.setProperty('--my', `${evento.clientY - caja.top}px`);
    };

    const sesionesActivas = sesiones.filter((sesion) => ['confirmada', 'en_proceso'].includes(sesion.estado)).length;
    const totalCanciones = useMemo(
        () => cancionesArtistas.reduce((suma, item) => suma + item.canciones.length, 0),
        []
    );

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const contenedor = contenedorRef.current;
        if (!contenedor) return undefined;

        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-tile]'),
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 620,
            delay: anime.stagger(70),
            easing: 'easeOutCubic',
        });

        return () => animacion.pause();
    }, []);

    const accesos = ACCESOS.filter((item) => rutasPermitidas.includes(item.ruta)).slice(0, 8);

    const metricas = [
        { etiqueta: 'Sesiones activas', valor: sesionesActivas, nota: 'Confirmadas o en proceso', icono: Activity, destacada: true },
        { etiqueta: 'Sesiones registradas', valor: sesiones.length, nota: 'En la agenda del estudio', icono: CalendarDays },
        { etiqueta: 'Artistas', valor: artistasDestacados.length, nota: 'Perfiles destacados', icono: Mic2, relleno: true },
        { etiqueta: 'Canciones', valor: totalCanciones, nota: 'Listas para escuchar', icono: Music, relleno: true },
    ];

    return (
        <main className="workspace-content" data-page="principal">
            <div ref={contenedorRef} className="grid gap-6">
                <section
                    className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2"
                    aria-label="Resumen del estudio"
                >
                    <article
                        ref={heroRef}
                        onMouseMove={seguirSpotlight}
                        data-tile
                        className="group/hero relative flex flex-col overflow-hidden rounded-[2rem] border border-accent/25 p-7 sm:col-span-2 sm:p-9 lg:col-span-2 lg:row-span-2"
                        style={{
                            background:
                                'radial-gradient(ellipse at 85% 10%, rgba(214, 70, 169, 0.28), transparent 45%), linear-gradient(120deg, rgba(111, 75, 187, 0.35), rgba(24, 19, 38, 0.96) 70%)',
                        }}
                    >
                        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 animate-aurora rounded-full bg-[#9365f2]/30 blur-3xl" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 animate-aurora rounded-full bg-[#e34ba6]/25 blur-3xl [animation-delay:-6s]" />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_50%_50%,black,transparent_75%)]"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/hero:opacity-100 [background:radial-gradient(360px_circle_at_var(--mx,50%)_var(--my,50%),rgba(240,79,166,0.25),transparent_62%)]"
                        />

                        {[
                            { t: '12%', l: '62%', d: '0s', s: 5 },
                            { t: '72%', l: '78%', d: '1.4s', s: 3 },
                            { t: '34%', l: '90%', d: '2.6s', s: 4 },
                            { t: '80%', l: '46%', d: '0.8s', s: 3 },
                        ].map((p, indice) => (
                            <span
                                key={indice}
                                aria-hidden="true"
                                className="pointer-events-none absolute rounded-full bg-white/70 blur-[1px] [animation:flotar_7s_ease-in-out_infinite]"
                                style={{ top: p.t, left: p.l, width: p.s, height: p.s, animationDelay: p.d }}
                            />
                        ))}

                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 lg:block xl:-right-2"
                        >
                            <div
                                className="relative grid h-60 w-60 place-items-center rounded-full border border-white/10 shadow-[0_25px_90px_rgba(0,0,0,0.55)] [animation:girar_22s_linear_infinite]"
                                style={{ background: 'repeating-radial-gradient(circle,#29282d 0 2px,#36343a 3px 4px,#252429 5px 7px),#302f35' }}
                            >
                                <span className="absolute inset-[12%] rounded-full border border-white/[0.06]" />
                                <span className="absolute inset-[26%] rounded-full border border-white/[0.05]" />
                                <div className="grid h-24 w-24 place-items-center rounded-full border-[6px] border-[#27252b] bg-gradient-to-br from-[#db479b] to-[#8657c6] shadow-lg">
                                    <span className="text-2xl font-black leading-none text-white">Z</span>
                                </div>
                            </div>
                            <div className="mt-5 flex h-12 items-end justify-center gap-1.5" aria-hidden="true">
                                {[40, 70, 100, 55, 85, 45, 95, 60, 75, 35].map((altura, indice) => (
                                    <span
                                        key={indice}
                                        className="w-1.5 origin-bottom rounded-full bg-gradient-to-t from-[#e34ba6] to-[#9365f2] [animation:ecu_1.4s_ease-in-out_infinite]"
                                        style={{ height: `${altura}%`, animationDelay: `${indice * 110}ms` }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="relative flex h-full flex-col">
                            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent-soft/30 bg-black/20 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-accent-soft">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-exito" />
                                Estudio en línea
                            </span>

                            <p className="mt-6 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-accent-soft">
                                {fechaLarga()}
                            </p>
                            <h1 className="mt-2 max-w-md text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                                {saludoDelDia()}, {usuario?.nombre ?? 'usuario'}.
                            </h1>
                            <p className="mt-2 max-w-md text-2xl font-black leading-tight tracking-[-0.03em] text-texto-soft sm:text-3xl">
                                <span className="texto-degradado">Tu sonido, en su mejor versión.</span>
                            </p>
                            <p className="mt-3 max-w-lg text-sm leading-7 text-sutil">
                                Coordina las sesiones, descubre a los artistas y controla la producción del estudio
                                desde un solo lugar.
                            </p>

                            <div className="mt-7 flex flex-wrap gap-3">
                                {rutasPermitidas.includes(RUTAS.SESIONES) && (
                                    <Link
                                        to={`${RUTAS.SESIONES}#crear`}
                                        className="inline-flex min-h-[46px] items-center justify-center rounded-xl bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-5 text-sm font-bold text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:brightness-110"
                                    >
                                        Crear sesión
                                    </Link>
                                )}
                                <Link
                                    to={RUTAS.ESTUDIO}
                                    className="inline-flex min-h-[46px] items-center gap-2 rounded-xl border border-border bg-white/[0.05] px-5 text-sm font-bold text-texto transition hover:-translate-y-0.5 hover:border-accent/60"
                                >
                                    <Play className="h-4 w-4" aria-hidden="true" /> Escuchar artistas
                                </Link>
                            </div>

                            <div className="mt-auto flex flex-wrap items-center gap-4 pt-9">
                                <div className="flex -space-x-3">
                                    {artistasDestacados.slice(0, 5).map((artista) => (
                                        <img
                                            key={artista.nombre}
                                            src={artista.imagen}
                                            alt=""
                                            className="h-11 w-11 rounded-full border-2 border-surface object-cover"
                                        />
                                    ))}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-texto-soft">
                                        {totalCanciones} canciones para explorar
                                    </p>
                                    <Link
                                        to={RUTAS.ESTUDIO}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-accent-soft transition hover:text-magenta"
                                    >
                                        Abrir reproductor <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </article>

                    {metricas.map((metrica) => {
                        const Icono = metrica.icono;
                        return (
                            <article key={metrica.etiqueta} data-tile className={`${TARJETA} tarjeta-brillo flex flex-col justify-between`}>
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
                                />
                                <div className="flex items-start justify-between gap-3">
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05] text-accent-soft transition group-hover:bg-accent/15" aria-hidden="true">
                                        <Icono className="h-5 w-5" />
                                    </span>
                                    {metrica.destacada && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-exito/30 bg-exito/10 px-2.5 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.1em] text-exito">
                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-exito" />
                                            En vivo
                                        </span>
                                    )}
                                </div>
                                <div className="mt-5">
                                    <strong className="block text-4xl font-extrabold tracking-tight text-texto-soft">
                                        <Contador valor={metrica.valor} relleno={metrica.relleno} />
                                    </strong>
                                    <p className="mt-1 text-sm font-semibold text-texto-soft">{metrica.etiqueta}</p>
                                    <span className="mt-0.5 block text-xs text-sutil/80">{metrica.nota}</span>
                                </div>
                                {metrica.destacada && (
                                    <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#9365f2]/25 blur-2xl" />
                                )}
                            </article>
                        );
                    })}
                </section>

                <section data-tile className="rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur sm:p-8">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="workspace-eyebrow">ACCESOS DIRECTOS</p>
                            <h2 className="mt-1 text-2xl font-bold tracking-tight text-texto-soft">Todo a un toque</h2>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {accesos.map((acceso) => {
                            const Icono = acceso.icono;
                            return (
                                <Link
                                    key={acceso.ruta}
                                    to={acceso.ruta}
                                    className="group/acceso flex items-center gap-3 rounded-2xl border border-border bg-white/[0.02] p-3.5 transition hover:-translate-y-0.5 hover:border-accent/50 hover:bg-white/[0.05]"
                                >
                                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#5b418f]/50 to-surface-2 text-accent-soft transition group-hover/acceso:from-[#9365f2]/60 group-hover/acceso:to-[#e34ba6]/40 group-hover/acceso:text-white">
                                        <Icono className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold text-texto-soft">{acceso.etiqueta}</span>
                                        <span className="block truncate text-xs text-sutil">{acceso.descripcion}</span>
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <section data-tile className="overflow-hidden rounded-[2rem] border border-border bg-surface/60 py-6 backdrop-blur">
                    <div className="flex flex-wrap items-end justify-between gap-3 px-6 sm:px-8">
                        <div>
                            <p className="workspace-eyebrow">VOCES QUE INSPIRAN</p>
                            <h2 className="mt-1 text-2xl font-bold tracking-tight text-texto-soft">Artistas destacados</h2>
                        </div>
                        <Link to={RUTAS.ESTUDIO} className="text-sm font-bold text-accent-soft transition hover:text-magenta">
                            Escuchar <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                    <div className="group relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
                        <div className="flex w-max animate-marquee gap-4 px-2 group-hover:[animation-play-state:paused]">
                            {[...artistasDestacados, ...artistasDestacados].map((artista, indice) => (
                                <div key={`${artista.nombre}-${indice}`} className="flex w-36 shrink-0 flex-col items-center gap-2 text-center">
                                    <div className="rounded-full bg-gradient-to-br from-[#9365f2] to-[#e34ba6] p-[2px]">
                                        <img
                                            src={artista.imagen}
                                            alt=""
                                            loading="lazy"
                                            className="h-24 w-24 rounded-full object-cover transition duration-300 hover:scale-105"
                                        />
                                    </div>
                                    <p className="w-full truncate text-sm font-bold text-texto-soft">{artista.nombre}</p>
                                    <p className="w-full truncate text-[0.7rem] text-sutil">{artista.origen}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section data-tile className="rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur sm:p-8">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="workspace-eyebrow">ARQUITECTOS DEL SONIDO</p>
                            <h2 className="mt-1 text-2xl font-bold tracking-tight text-texto-soft">Productores destacados</h2>
                        </div>
                        <span className="rounded-full border border-accent-soft/30 px-3 py-1.5 text-[0.68rem] font-extrabold tracking-[0.1em] text-accent-soft">
                            {String(productoresDestacados.length).padStart(2, '0')} PRODUCTORES
                        </span>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {productoresDestacados.map((productor) => (
                            <article key={productor.nombre} className="group relative overflow-hidden rounded-2xl border border-border">
                                <img
                                    src={productor.imagen}
                                    alt={productor.textoAlternativo ?? productor.nombre}
                                    loading="lazy"
                                    className="h-52 w-full object-cover transition duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0812] via-[#0b0812]/30 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <h3 className="text-base font-bold text-texto-soft">{productor.nombre}</h3>
                                    <p className="mt-0.5 text-[0.72rem] text-sutil">{productor.origen}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
