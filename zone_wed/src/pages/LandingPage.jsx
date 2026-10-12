// CAPA: Presentación
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { Disc3, Mic, Play, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RUTAS } from '../config/rutas.js';
import { cancionesArtistas } from '../data/cancionesArtistas.js';
import { salaRepo } from '../repositories/salaRepo.js';
import { formatearMoneda } from '../utils/helpers.js';
import { useSpotlight } from '../hooks/useSpotlight.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FUENTE_TITULO = { fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" };
const BOTON_PRIMARIO =
    'group relative inline-flex min-h-[52px] items-center justify-center overflow-hidden rounded-md bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-7 text-sm font-bold text-white shadow-lg shadow-accent/25 transition duration-300 hover:brightness-110';
const BOTON_SECUNDARIO =
    'inline-flex min-h-[52px] items-center justify-center rounded-md border border-white/20 px-7 text-sm font-semibold text-texto-soft transition duration-300 hover:border-magenta/60 hover:bg-magenta/10';

const IMAGENES_SALON = [
    '/landing/piano.jpg',
    '/landing/diseno.jpg',
    '/landing/produccion-visual.jpg',
];

const ARTISTA_DESTACADO = cancionesArtistas[0];
const CANCION_DESTACADA = ARTISTA_DESTACADO.canciones[0];

const ONDAS_DESTACADA = [40, 75, 100, 55, 30, 85, 45, 95, 60, 75, 35, 60, 90, 50, 70, 40];
const ONDAS_HERO = [18, 34, 62, 44, 92, 66, 122, 50, 30, 76, 98, 42, 64, 112, 58, 26, 46, 82, 38, 62, 88, 48, 24, 56, 96, 70, 110, 40, 92, 52, 30, 68, 104, 46, 74, 36, 60, 100, 80, 28];

const acortar = (texto, maximo = 17) =>
    texto.length > maximo ? `${texto.slice(0, maximo - 1)}…` : texto;

const SERVICIOS = [
    { n: '01', icono: Mic, t: 'Grabación', d: 'Cabinas tratadas acústicamente para voces, instrumentos y ensayos, con ingeniero de sonido.' },
    { n: '02', icono: SlidersHorizontal, t: 'Producción y mezcla', d: 'Sesiones de producción y mezcla con fecha, duración y responsable definidos desde la agenda.' },
    { n: '03', icono: Disc3, t: 'Masterización', d: 'El cierre de tu proyecto: nivel, tono y consistencia finales para su publicación.' },
];

const PASOS = [
    { n: '01', t: 'Elige el espacio', d: 'Revisa las cabinas y salas disponibles y selecciona la que necesitas.' },
    { n: '02', t: 'Programa tu sesión', d: 'Define fecha, hora y tipo de trabajo en pocos pasos.' },
    { n: '03', t: 'Haz que suceda', d: 'Sigue tus reservas y el avance de tu proyecto desde un solo lugar.' },
];

const FAQ = [
    { p: '¿Qué tipos de sesión puedo registrar?', r: 'Grabación, mezcla, masterización, ensayo o producción musical. Eliges el tipo al crear la sesión.' },
    { p: '¿Qué necesito para crear una reserva?', r: 'Una fecha, hora de inicio, duración, la cabina y el artista o productor. El nombre de la sesión es opcional.' },
    { p: '¿Necesito iniciar sesión?', r: 'Sí. Al elegir «Reservar una sesión» te llevamos al acceso y luego continúas con el formulario.' },
    { p: '¿Puedo cambiar mi reserva después?', r: 'Tu reserva queda guardada con el estado que selecciones y puedes consultarla o ajustarla cuando quieras desde el área de sesiones.' },
];

const modificadorReveal = (indice) => ({ 'data-revelar-delay': String(indice * 90) });

function Etiqueta({ children, className = '' }) {
    return (
        <p className={`flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-magenta ${className}`}>
            <span aria-hidden="true" className="h-px w-7 bg-magenta/50" />
            {children}
        </p>
    );
}

function Palabras({ texto, className, style, resaltar }) {
    const animar = !MENOS_MOVIMIENTO();
    const palabras = texto.split(' ');
    return (
        <span className={className} style={style}>
            {palabras.map((palabra, indice) => (
                <Fragment key={`${palabra}-${indice}`}>
                    <span
                        data-word
                        className={`inline-block will-change-transform ${indice === resaltar ? 'texto-degradado' : ''}`}
                        style={animar ? { opacity: 0, transform: 'translateY(28px)' } : undefined}
                    >
                        {palabra}
                    </span>
                    {indice < palabras.length - 1 ? ' ' : ''}
                </Fragment>
            ))}
        </span>
    );
}

function Numero({ valor, relleno = false }) {
    const ref = useRef(null);
    const objetivo = Number(valor) || 0;
    const formatear = (n) => (relleno ? String(n).padStart(2, '0') : String(n));

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        if (MENOS_MOVIMIENTO()) {
            el.textContent = formatear(objetivo);
            return undefined;
        }
        const estado = { v: 0 };
        const animacion = anime({
            targets: estado,
            v: objetivo,
            round: 1,
            duration: 1500,
            easing: 'easeOutExpo',
            update() {
                el.textContent = formatear(estado.v);
            },
        });
        return () => animacion.pause();
    }, [objetivo, relleno]);

    return <span ref={ref}>{MENOS_MOVIMIENTO() ? formatear(objetivo) : formatear(0)}</span>;
}

const SURCOS = Array.from({ length: 24 }, (_, i) => 96 + i * 4.25);

function Disco({ titulo, artista }) {
    return (
        <svg
            viewBox="0 0 400 400"
            role="img"
            aria-label={`Vinilo de la canción ${titulo}`}
            className="relative z-10 h-auto w-[min(78%,340px)] will-change-transform [animation:girar_26s_linear_infinite] hover:[animation-play-state:paused] drop-shadow-[0_48px_90px_rgba(0,0,0,0.75)]"
        >
            <defs>
                <radialGradient id="dBase" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1c1931" />
                    <stop offset="55%" stopColor="#0c0a16" />
                    <stop offset="100%" stopColor="#05040a" />
                </radialGradient>
                <linearGradient id="dBrilo" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
                    <stop offset="30%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
                </linearGradient>
                <linearGradient id="dAnillo" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#9365f2" />
                    <stop offset="50%" stopColor="#e34ba6" />
                    <stop offset="100%" stopColor="#9365f2" />
                </linearGradient>
                <linearGradient id="dEtiqueta" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#9365f2" />
                    <stop offset="100%" stopColor="#e34ba6" />
                </linearGradient>
                <filter id="dHalo">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b" />
                    <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <clipPath id="dClip">
                    <circle cx="200" cy="200" r="198" />
                </clipPath>
                <mask id="dGiro">
                    <rect x="0" y="0" width="400" height="400" fill="white" />
                    <circle cx="200" cy="200" r="86" fill="black" />
                </mask>
            </defs>
            <circle cx="200" cy="200" r="198" fill="url(#dBase)" />
            <g clipPath="url(#dClip)" fill="none" stroke="#ffffff" strokeOpacity="0.035">
                {SURCOS.map((radio) => (
                    <circle key={radio} cx="200" cy="200" r={radio} />
                ))}
            </g>
            <rect x="0" y="0" width="400" height="400" fill="url(#dBrilo)" clipPath="url(#dClip)" />
            <circle
                cx="200"
                cy="200"
                r="84"
                fill="none"
                stroke="url(#dAnillo)"
                strokeWidth="8"
                opacity="0.9"
                filter="url(#dHalo)"
                strokeLinecap="round"
                strokeDasharray="22 20"
                mask="url(#dGiro)"
                className="[animation:girar_12s_linear_infinite_reverse]"
            />
            <circle
                cx="200"
                cy="200"
                r="72"
                fill="none"
                stroke="#e34ba6"
                strokeWidth="3"
                opacity="0.35"
                strokeDasharray="14 12"
                mask="url(#dGiro)"
                className="[animation:girar_16s_linear_infinite_reverse]"
            />
            <circle cx="200" cy="200" r="80" fill="#0a0813" stroke="#ffffff" strokeOpacity="0.08" />
            <circle cx="200" cy="200" r="34" fill="url(#dEtiqueta)" />
            <text x="200" y="190" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700" letterSpacing="3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Z-ONE
            </text>
            <text x="200" y="205" textAnchor="middle" fill="#ffffff" opacity="0.8" fontSize="8" style={{ fontFamily: 'monospace' }}>
                {acortar(titulo, 22)}
            </text>
            <text x="200" y="216" textAnchor="middle" fill="#ffffff" opacity="0.55" fontSize="7" style={{ fontFamily: 'monospace' }}>
                {acortar(artista, 26)}
            </text>
            <circle cx="200" cy="200" r="3.5" fill="#05040a" />
        </svg>
    );
}

export default function LandingPage() {
    const landingRef = useRef(null);
    const [compacto, setCompacto] = useState(false);
    const [spotRef, seguirSpotlight] = useSpotlight();
    const salas = salaRepo.listar().filter((sala) => sala.activo !== false);
    const animar = !MENOS_MOVIMIENTO();
    const oculto = animar ? { opacity: 0 } : undefined;

    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth';
        return () => { document.documentElement.style.scrollBehavior = ''; };
    }, []);

    useEffect(() => {
        const landing = landingRef.current;
        if (!landing) return undefined;

        let raf = 0;
        const actualizar = () => {
            raf = 0;
            const y = window.scrollY || 0;
            setCompacto(y > 12);
            const barra = landing.querySelector('[data-progreso]');
            const alcance = document.documentElement.scrollHeight - window.innerHeight;
            if (barra) {
                barra.style.transform = `scaleX(${alcance > 0 ? Math.min(1, y / alcance) : 0})`;
            }
        };
        const alDesplazar = () => {
            if (!raf) raf = requestAnimationFrame(actualizar);
        };
        window.addEventListener('scroll', alDesplazar, { passive: true });
        actualizar();
        return () => {
            window.removeEventListener('scroll', alDesplazar);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    useLayoutEffect(() => {
        const landing = landingRef.current;
        if (!landing || MENOS_MOVIMIENTO()) return undefined;

        const entrada = anime.timeline({ easing: 'easeOutQuart' })
            .add({ targets: landing.querySelector('[data-header]'), opacity: [0, 1], translateY: [-10, 0], duration: 420 })
            .add({ targets: landing.querySelector('[data-hero-art]'), opacity: [0, 1], translateY: [12, 0], duration: 720 }, '-=180')
            .add({ targets: landing.querySelectorAll('[data-hero-art] [data-media]'), scale: [1.08, 1], duration: 1200, easing: 'easeOutQuart' }, '-=760')
            .add({ targets: landing.querySelector('[data-hero-eyebrow]'), opacity: [0, 1], translateY: [14, 0], duration: 500 }, '-=900')
            .add({ targets: landing.querySelectorAll('[data-word]'), translateY: [28, 0], opacity: [0, 1], duration: 840, delay: anime.stagger(55) }, '-=340')
            .add({ targets: landing.querySelector('[data-hero-text]'), opacity: [0, 1], translateY: [16, 0], duration: 560 }, '-=560')
            .add({ targets: landing.querySelector('[data-hero-actions]'), opacity: [0, 1], translateY: [16, 0], duration: 560 }, '-=440')
            .add({ targets: landing.querySelector('[data-hero-stats]'), opacity: [0, 1], translateY: [16, 0], duration: 600 }, '-=420');

        const reveleables = landing.querySelectorAll('[data-revelar]');
        const observador = new IntersectionObserver((entradas, observer) => {
            entradas.forEach((entradaVisible) => {
                if (!entradaVisible.isIntersecting) return;
                anime({
                    targets: entradaVisible.target,
                    opacity: [0, 1],
                    translateY: [26, 0],
                    duration: 680,
                    delay: Number(entradaVisible.target.dataset.revelarDelay || 0),
                    easing: 'easeOutQuart',
                });
                observer.unobserve(entradaVisible.target);
            });
        }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
        reveleables.forEach((elemento) => {
            elemento.style.opacity = '0';
            observador.observe(elemento);
        });

        const preguntas = landing.querySelectorAll('details[data-faq]');
        const animarRespuesta = (event) => {
            if (!event.currentTarget.open) return;
            anime({ targets: event.currentTarget.querySelector('p'), opacity: [0, 1], translateY: [-8, 0], duration: 320, easing: 'easeOutCubic' });
        };
        preguntas.forEach((pregunta) => pregunta.addEventListener('toggle', animarRespuesta));

        return () => {
            entrada.pause();
            observador.disconnect();
            preguntas.forEach((pregunta) => {
                pregunta.removeEventListener('toggle', animarRespuesta);
                anime.remove(pregunta.querySelector('p'));
            });
        };
    }, []);

    return (
        <main
            ref={landingRef}
            className="min-h-screen overflow-x-hidden bg-bg text-texto-soft"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-soft-light"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
            />
            <div data-progreso aria-hidden="true" className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-[#9365f2] to-[#e34ba6]" />

            <header
                data-header
                style={oculto}
                className={`sticky top-0 z-30 border-b backdrop-blur transition-colors duration-300 ${compacto ? 'border-border bg-bg/95' : 'border-border/60 bg-bg/80'}`}
            >
                <div className={`mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 transition-[height] duration-300 lg:px-10 ${compacto ? 'h-14' : 'h-16'}`}>
                    <Link className="flex items-center gap-2.5" to="/" aria-label="Z-ONE inicio">
                        <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-sm font-black text-white">Z</span>
                        <span className="text-base font-bold tracking-tight text-texto-soft" style={FUENTE_TITULO}>Z-ONE</span>
                    </Link>
                    <nav className="hidden items-center gap-8 text-sm font-medium text-sutil lg:flex" aria-label="Navegación principal">
                        {[
                            { etiqueta: 'Servicios', href: '#servicios' },
                            { etiqueta: 'Espacios', href: '#espacios' },
                            { etiqueta: 'Cómo funciona', href: '#proceso' },
                            { etiqueta: 'Preguntas', href: '#preguntas' },
                            { etiqueta: 'Contacto', href: '#contacto' },
                        ].map((enlace) => (
                            <a key={enlace.href} className="group relative transition hover:text-texto-soft" href={enlace.href}>
                                {enlace.etiqueta}
                                <span aria-hidden="true" className="absolute -bottom-1.5 left-0 h-px w-0 bg-magenta transition-all duration-300 group-hover:w-full" />
                            </a>
                        ))}
                    </nav>
                    <Link className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition duration-300 hover:border-magenta/60 hover:bg-magenta/10 hover:text-magenta" to={RUTAS.LOGIN}>
                        Acceder
                    </Link>
                </div>
            </header>

            <section ref={spotRef} onMouseMove={seguirSpotlight} className="relative border-b border-border/60">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-500 lg:block [background:radial-gradient(460px_circle_at_var(--mx,22%)_var(--my,32%),rgba(240,79,166,0.16),transparent_62%)]"
                />
                <div className="mx-auto grid max-w-[1280px] items-stretch lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="relative z-10 flex flex-col justify-center px-6 py-20 lg:py-28 lg:pr-14 lg:pl-10">
                        <p data-hero-eyebrow style={oculto}>
                            <Etiqueta>Estudio de grabación · Colombia</Etiqueta>
                        </p>
                        <h1 className="mt-6 max-w-[16ch] text-[clamp(2.6rem,6vw,4.6rem)] font-bold leading-[1.0] tracking-[-0.03em] text-texto-soft">
                            <Palabras texto="Tu próximo sonido empieza aquí." resaltar={2} style={FUENTE_TITULO} />
                        </h1>
                        <p data-hero-text style={oculto} className="mt-6 max-w-[46ch] text-base leading-8 text-sutil">
                            Un espacio para grabar, producir, mezclar y llevar tus ideas musicales desde la primera nota hasta el resultado final.
                        </p>
                        <div data-hero-actions style={oculto} className="mt-9 flex flex-wrap gap-3">
                            <Link className={BOTON_PRIMARIO} to={`${RUTAS.SESIONES}#crear`}>
                                <span className="relative z-10">Reservar una sesión</span>
                                <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                            </Link>
                            <a className={BOTON_SECUNDARIO} href="#espacios">Ver espacios</a>
                        </div>
                        <dl data-hero-stats style={oculto} className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-7">
                            {[
                                { v: String(salas.length).padStart(2, '0'), l: 'Cabinas y salas', n: salas.length },
                                { v: '06', l: 'Servicios de audio', n: 6 },
                                { v: 'Lun–Dom', l: 'Horario del estudio' },
                            ].map((stat) => (
                                <div key={stat.l}>
                                    <dt style={FUENTE_TITULO} className="text-2xl font-bold tracking-tight text-texto-soft">
                                        {stat.n != null ? <Numero valor={stat.n} relleno /> : stat.v}
                                    </dt>
                                    <dd className="mt-1 text-xs leading-5 text-sutil">{stat.l}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <div data-hero-art style={oculto} className="relative min-h-[520px] overflow-hidden border-t border-border/60 lg:min-h-[560px] lg:border-l lg:border-t-0" aria-label="Disco de vinilo con la vista de audio del estudio Z-ONE">
                        <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-[24rem] w-[24rem] rounded-full bg-[#9365f2]/25 blur-[120px]" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-20 h-[26rem] w-[26rem] rounded-full bg-[#e34ba6]/20 blur-[130px]" />
                        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a477ff]/15 blur-[140px]" />
                        <div className="absolute inset-0 flex items-center justify-center px-6 py-10 [animation:kenburns_30s_ease-in-out_infinite_alternate_reverse]">
                            <div
                                data-media
                                className="relative flex items-center justify-center will-change-transform"
                                onMouseMove={(event) => {
                                    const rect = event.currentTarget.getBoundingClientRect();
                                    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
                                    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 6;
                                    event.currentTarget.style.setProperty('--rx', `${y * 0.8}deg`);
                                    event.currentTarget.style.setProperty('--ry', `${-x}deg`);
                                }}
                                onMouseLeave={(event) => {
                                    event.currentTarget.style.setProperty('--rx', '0deg');
                                    event.currentTarget.style.setProperty('--ry', '0deg');
                                }}
                                style={{ transform: 'perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))' }}
                            >
                                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute h-[120%] w-[120%] rounded-full bg-gradient-to-r from-[#9365f2]/0 via-[#e34ba6]/10 to-[#9365f2]/0 opacity-70 blur-3xl [animation:girar_40s_linear_infinite]"
                />
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute h-[150%] w-[150%] rounded-full bg-gradient-to-r from-[#a477ff]/0 via-[#f04fa6]/8 to-[#a477ff]/0 opacity-40 blur-[100px] [animation:girar_60s_linear_infinite_reverse]"
                />
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute h-[90%] w-[90%] rounded-full bg-[#f04fa6]/20 opacity-60 blur-[60px] [animation:pulse_2.8s_ease-in-out_infinite]"
                />
                <Disco titulo={CANCION_DESTACADA.titulo} artista={ARTISTA_DESTACADO.artista} />
                            </div>
                        </div>
                        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)]">
                            <div className="mx-auto flex h-20 w-[min(92%,470px)] items-end gap-1 pb-3 opacity-70">
                                {ONDAS_HERO.map((altura, i) => (
                                    <span
                                        key={i}
                                        className="w-1 shrink-0 rounded-full bg-gradient-to-t from-[#9365f2]/50 to-[#e34ba6]/80 opacity-0 [animation:ecu_2.2s_ease-in-out_infinite]"
                                        style={{ height: `${altura}%`, animationDelay: `${i * 110}ms`, animationDuration: `${1.6 + (i % 5) * 0.35}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent lg:bg-gradient-to-r lg:from-bg/55 lg:via-transparent lg:to-transparent" />
                        <span className="absolute left-6 top-6 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-white/75">Sala de control — Z-ONE</span>
                        <div className="absolute bottom-5 left-5 z-10 w-[min(19rem,calc(100%-2.5rem))] rounded-xl border border-white/10 bg-[#0d0a17]/85 p-3.5 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <img src={ARTISTA_DESTACADO.imagen} alt="" className="h-11 w-11 rounded-lg object-cover" />
                                <div className="min-w-0 flex-1">
                                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-magenta">Sonando ahora</p>
                                    <p className="mt-0.5 truncate text-sm font-semibold text-texto-soft">{CANCION_DESTACADA.titulo}</p>
                                    <p className="truncate text-xs text-sutil">{ARTISTA_DESTACADO.artista}</p>
                                </div>
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-texto-soft">
                                    <Play className="h-4 w-4" />
                                </span>
                            </div>
                            <div className="mt-3 flex h-5 items-end gap-0.5">
                                {ONDAS_DESTACADA.map((altura, i) => (
                                    <i
                                        key={i}
                                        className="w-1 origin-bottom rounded-full bg-gradient-to-t from-[#9365f2] to-[#e34ba6] [animation:ecu_1.3s_ease-in-out_infinite]"
                                        style={{ height: `${altura}%`, animationDelay: `${i * 90}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="border-b border-border/60 bg-[#140f23]">
                <div className="mx-auto max-w-[1280px] px-6 py-7 lg:px-10">
                    <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-sutil">
                        <span aria-hidden="true" className="h-px w-7 bg-magenta/50" />
                        Voces que graban en Z-ONE
                    </p>
                    <div className="mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
                        <div className="flex w-max animate-marquee items-center gap-3 pr-3 hover:[animation-play-state:paused]">
                            {[...cancionesArtistas, ...cancionesArtistas].map((artista, i) => (
                                <div key={`${artista.artista}-${i}`} className="flex shrink-0 items-center gap-3 rounded-full border border-border bg-surface/60 py-1.5 pl-1.5 pr-5">
                                    <img src={artista.imagen} alt="" loading="lazy" className="h-9 w-9 rounded-full object-cover" />
                                    <span className="whitespace-nowrap text-sm font-semibold text-texto-soft">{artista.artista}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <section className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-24 lg:px-10" id="servicios">
                <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
                    <div data-revelar {...modificadorReveal(0)}>
                        <Etiqueta>Qué hacemos</Etiqueta>
                        <h2 style={FUENTE_TITULO} className="mt-5 max-w-[20ch] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-texto-soft">
                            Todo lo que tu música necesita.
                        </h2>
                        <p className="mt-5 max-w-[42ch] text-base leading-7 text-sutil">
                            Desde una primera toma hasta el máster final, cada etapa del estudio está pensada para tu proyecto.
                        </p>
                    </div>
                    <div className="divide-y divide-border border-t border-border">
                        {SERVICIOS.map((servicio, indice) => (
                            <article key={servicio.n} data-revelar {...modificadorReveal(indice)} className="group relative grid gap-4 py-7 transition-colors sm:grid-cols-[auto_1fr] sm:gap-8">
                                <div className="flex items-start gap-4">
                                    <span className="font-mono text-sm text-magenta">{servicio.n}</span>
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-surface text-magenta transition-colors duration-300 group-hover:border-magenta/50 group-hover:text-texto-soft">
                                        <servicio.icono aria-hidden="true" className="h-[18px] w-[18px]" />
                                    </span>
                                </div>
                                <div>
                                    <h3 style={FUENTE_TITULO} className="text-xl font-bold tracking-tight text-texto-soft">{servicio.t}</h3>
                                    <p className="mt-2 max-w-[52ch] text-sm leading-7 text-sutil">{servicio.d}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="scroll-mt-24 border-y border-border/60 bg-[#140f23]" id="espacios">
                <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                        <div data-revelar {...modificadorReveal(0)}>
                            <Etiqueta>Espacios</Etiqueta>
                            <h2 style={FUENTE_TITULO} className="mt-5 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-texto-soft">Elige dónde trabajar.</h2>
                        </div>
                        <p className="max-w-[34ch] text-sm leading-7 text-sutil">Cabinas para grabar, salas para mezclar y producir. Todas disponibles por hora.</p>
                    </div>

                    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {salas.map((sala, index) => (
                            <article key={sala.id ?? sala.nombre} data-revelar {...modificadorReveal(index)} className="group relative overflow-hidden rounded-lg border border-border bg-surface transition duration-500 hover:-translate-y-1 hover:border-magenta/60 hover:shadow-[0_28px_60px_-24px_rgba(0,0,0,0.9)]">
                                <span aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-px origin-left scale-x-0 bg-magenta transition-transform duration-500 group-hover:scale-x-100" />
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <img
                                        src={IMAGENES_SALON[index % IMAGENES_SALON.length]}
                                        alt={`${sala.nombre} del estudio Z-ONE`}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition duration-[900ms] ease-out group-hover:scale-105"
                                    />
                                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg/70 to-transparent" />
                                    <span className="absolute left-4 top-4 font-mono text-[0.65rem] tracking-[0.2em] text-white/80">{String(index + 1).padStart(2, '0')}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 px-5 py-4">
                                    <div>
                                        <h3 style={FUENTE_TITULO} className="text-base font-bold tracking-tight text-texto-soft">{sala.nombre}</h3>
                                        <p className="mt-0.5 font-mono text-[0.7rem] text-sutil">Por hora</p>
                                    </div>
                                    <strong style={FUENTE_TITULO} className="text-base font-bold text-texto-soft">{formatearMoneda(sala.precio_hora)}</strong>
                                </div>
                                <Link className="flex items-center justify-between border-t border-border px-5 py-3.5 text-sm font-semibold text-texto-soft transition group-hover:text-magenta" to={`${RUTAS.SESIONES}#crear`}>
                                    Reservar <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
                                </Link>
                            </article>
                        ))}
                        {salas.length === 0 && <p className="text-sutil">Pronto anunciaremos los espacios disponibles.</p>}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-24 lg:px-10" id="proceso">
                <div data-revelar {...modificadorReveal(0)} className="max-w-[40ch]">
                    <Etiqueta>Cómo funciona</Etiqueta>
                    <h2 style={FUENTE_TITULO} className="mt-5 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-texto-soft">Reservar toma tres pasos.</h2>
                </div>
                <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
                    {PASOS.map((paso, indice) => (
                        <div key={paso.n} data-revelar {...modificadorReveal(indice)} className="group relative bg-bg p-7 transition-colors duration-500 hover:bg-[#140f23]">
                            <span style={FUENTE_TITULO} className="inline-block text-4xl font-bold text-magenta transition-transform duration-500 group-hover:-translate-y-1">{paso.n}</span>
                            <h3 style={FUENTE_TITULO} className="mt-6 text-lg font-bold tracking-tight text-texto-soft">{paso.t}</h3>
                            <p className="mt-2 text-sm leading-7 text-sutil">{paso.d}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="scroll-mt-24 border-y border-border/60 bg-[#140f23]" id="preguntas">
                <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
                    <div data-revelar {...modificadorReveal(0)}>
                        <Etiqueta>Preguntas frecuentes</Etiqueta>
                        <h2 style={FUENTE_TITULO} className="mt-5 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-texto-soft">Antes de reservar.</h2>
                        <p className="mt-5 max-w-[38ch] text-sm leading-7 text-sutil">Lo esencial para preparar tu sesión en Z-ONE.</p>
                    </div>
                    <div className="border-t border-border">
                        {FAQ.map((faq, indice) => (
                            <details key={faq.p} data-faq data-revelar {...modificadorReveal(indice)} className="group border-b border-border">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-base font-semibold text-texto-soft transition-colors hover:text-magenta [&::-webkit-details-marker]:hidden">
                                    {faq.p}
                                    <span className="text-xl text-magenta transition-transform duration-300 group-open:rotate-45" aria-hidden="true">+</span>
                                </summary>
                                <p className="max-w-[62ch] pb-6 pr-8 text-sm leading-7 text-sutil">{faq.r}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden border-t border-border/60 bg-gradient-to-br from-[#1b1430] via-[#161022] to-[#120d1b]" id="contacto">
                <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#e34ba6]/25 blur-3xl" />
                <div className="relative mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 px-6 py-16 lg:flex-row lg:items-center lg:px-10">
                    <div data-revelar {...modificadorReveal(0)}>
                        <Etiqueta>¿Listo para empezar?</Etiqueta>
                        <h2 style={FUENTE_TITULO} className="mt-4 max-w-[24ch] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-texto-soft">Hagamos que tu música suceda.</h2>
                    </div>
                    <Link className={`${BOTON_PRIMARIO} shrink-0`} to={`${RUTAS.SESIONES}#crear`}>
                        <span className="relative z-10">Reservar una sesión</span>
                        <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    </Link>
                </div>
            </section>

            <footer className="bg-bg">
                <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-5 px-6 py-10 sm:flex-row sm:items-center lg:px-10">
                    <Link className="flex items-center gap-2.5" to="/" aria-label="Z-ONE inicio">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-xs font-black text-white">Z</span>
                        <span className="text-sm font-bold tracking-tight text-texto-soft" style={FUENTE_TITULO}>Z-ONE</span>
                    </Link>
                    <p className="text-sm text-sutil">Un espacio para hacer que la música suceda.</p>
                    <Link className="text-sm text-sutil transition hover:text-texto-soft" to={RUTAS.LOGIN}>Acceso de usuarios</Link>
                </div>
            </footer>
        </main>
    );
}
