// CAPA: Presentación
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { ArrowUp, Disc3, Menu, MessageCircle, Mic, Pause, Play, Quote, SlidersHorizontal, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RUTAS } from '../config/rutas.ts';
import { cancionesArtistas } from '../data/cancionesArtistas.ts';
import { salaRepo } from '../repositories/salaRepo.ts';
import VinylDisc from '../components/VinylDisc.tsx';
import { formatearMoneda } from '../utils/helpers.ts';
import { useSpotlight } from '../hooks/useSpotlight.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { esAdministrador, esColaborador } from '../config/roles.ts';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FUENTE_TITULO = { fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" };
const BOTON_PRIMARIO =
    'group relative inline-flex min-h-[52px] items-center justify-center overflow-hidden rounded-md bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-7 text-sm font-bold text-white shadow-lg shadow-accent/25 transition duration-300 hover:brightness-110';
const BOTON_SECUNDARIO =
    'inline-flex min-h-[52px] items-center justify-center rounded-md border border-white/20 px-7 text-sm font-semibold text-texto-soft transition duration-300 hover:border-magenta/60 hover:bg-magenta/10';

const IMAGENES_SALON = ['/landing/cabina%201.jpg', '/landing/cabina%202.jpg', '/landing/cabina%203.jpg'];
const BARRAS_SALON = [50, 92, 64, 100, 46, 78, 60, 38, 84, 54];

const ARTISTA_DESTACADO = cancionesArtistas[0];
const CANCION_DESTACADA = ARTISTA_DESTACADO.canciones[0];

const SERVICIOS = [
    { n: '01', icono: Mic, t: 'Grabación', d: 'Cabinas tratadas acústicamente para voces, instrumentos y ensayos, con ingeniero de sonido.', tono: '#9365f2', glifo: 'from-[#9365f2]/25 via-[#9365f2]/5 to-transparent' },
    { n: '02', icono: SlidersHorizontal, t: 'Producción y mezcla', d: 'Sesiones de producción y mezcla con fecha, duración y responsable definidos desde la agenda.', tono: '#e34ba6', glifo: 'from-[#e34ba6]/25 via-[#e34ba6]/5 to-transparent' },
    { n: '03', icono: Disc3, t: 'Masterización', d: 'El cierre de tu proyecto: nivel, tono y consistencia finales para su publicación.', tono: '#5393da', glifo: 'from-[#5393da]/25 via-[#5393da]/5 to-transparent' },
];

const PASOS = [
    { n: '01', icono: SlidersHorizontal, t: 'Elige el espacio', d: 'Revisa las cabinas y salas disponibles y selecciona la que necesitas.' },
    { n: '02', icono: Mic, t: 'Envía tu solicitud', d: 'Define fecha, hora y tipo de trabajo en pocos pasos.' },
    { n: '03', icono: Disc3, t: 'Haz que suceda', d: 'Sigue tus reservas y el avance de tu proyecto desde un solo lugar.' },
];

const FAQ = [
    { p: '¿Qué tipos de servicio puedo solicitar?', r: 'Grabación, mezcla, masterización, ensayo o producción musical. Eliges el tipo al crear tu solicitud.' },
    { p: '¿Qué necesito para crear una solicitud?', r: 'Una fecha, hora de inicio y fin, la cabina y al menos un artista o productor. El nombre y la canción son opcionales.' },
    { p: '¿Necesito iniciar sesión?', r: 'Sí. Al elegir «Reservar una sesión» te llevamos al acceso y luego continúas con el formulario.' },
    { p: '¿Cómo se confirma mi reserva?', r: 'Envías una solicitud y los artistas o productores invitados la responden. La sesión se crea automáticamente solo cuando todos aceptan.' },
    { p: '¿Puedo cambiar o cancelar mi solicitud?', r: 'Mientras siga en estado «Solicitada» puedes cancelarla desde tu área de solicitudes. Cuando se confirma, aparece en tu agenda.' },
];

const ENLACES_NAV = [
    { etiqueta: 'Servicios', href: '#servicios' },
    { etiqueta: 'Espacios', href: '#espacios' },
    { etiqueta: 'Cómo funciona', href: '#proceso' },
    { etiqueta: 'Testimonios', href: '#testimonios' },
    { etiqueta: 'Preguntas', href: '#preguntas' },
    { etiqueta: 'Contacto', href: '#contacto' },
];

const METRICAS = [
    { valor: 320, sufijo: '+', etiqueta: 'Proyectos producidos' },
    { valor: 12, sufijo: 'k+', etiqueta: 'Horas de cabina' },
    { valor: 98, sufijo: '%', etiqueta: 'Clientes satisfechos' },
    { valor: 8, sufijo: ' años', etiqueta: 'De experiencia sonora' },
];

const TESTIMONIOS = [
    {
        nombre: 'Valentina Ríos',
        rol: 'Artista independiente',
        texto: 'Grabar en Z-ONE cambió por completo el resultado de mi EP. El equipo entiende la música y te acompaña en cada toma.',
    },
    {
        nombre: 'Andrés Beltrán',
        rol: 'Productor musical',
        texto: 'La agenda en línea y las salas impecables hacen que cada sesión rinda al máximo. Es mi estudio de confianza.',
    },
    {
        nombre: 'Mariana Cifuentes',
        rol: 'Cantautora',
        texto: 'Desde la reserva hasta el máster, todo se siente profesional y cercano. Mi sonido nunca sonó tan bien.',
    },
];

const modificadorReveal = (indice: number) => ({ 'data-revelar-delay': String(indice * 90) });

interface EtiquetaProps {
    children: React.ReactNode;
    className?: string;
}

function Etiqueta({ children, className = '' }: EtiquetaProps) {
    return (
        <p className={`flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-magenta ${className}`}>
            <span aria-hidden="true" className="h-px w-7 bg-magenta/50" />
            {children}
        </p>
    );
}

interface PalabrasProps {
    texto: string;
    className?: string;
    style?: React.CSSProperties;
    resaltar?: number;
}

function Palabras({ texto, className, style, resaltar }: PalabrasProps) {
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

interface NumeroProps {
    valor: number | string;
    relleno?: boolean;
}

function Numero({ valor, relleno = false }: NumeroProps) {
    const ref = useRef<HTMLSpanElement | null>(null);
    const objetivo = Number(valor) || 0;
    const formatear = (n: number) => (relleno ? String(n).padStart(2, '0') : String(n));

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (MENOS_MOVIMIENTO()) {
            el.textContent = formatear(objetivo);
            return;
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

export default function LandingPage() {
    const landingRef = useRef<HTMLElement | null>(null);
    const [compacto, setCompacto] = useState(false);
    const [reproduciendo, setReproduciendo] = useState(true);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [mostrarArriba, setMostrarArriba] = useState(false);
    const [spotRef, seguirSpotlight] = useSpotlight<HTMLElement>();
    const { usuario } = useAuth();
    const esStaff = esAdministrador(usuario) || esColaborador(usuario);
    const destinoReserva = esStaff ? `${RUTAS.SESIONES}#crear` : `${RUTAS.SOLICITUDES}#nueva-reserva`;
    const inicialesUsuario = (usuario?.nombre ?? '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0] ?? '')
        .join('')
        .toLocaleUpperCase() || 'Z';
    const salas = salaRepo.listar().filter((sala) => sala.activo !== false);
    const animar = !MENOS_MOVIMIENTO();
    const oculto = animar ? { opacity: 0 } : undefined;

    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth';
        return () => { document.documentElement.style.scrollBehavior = ''; };
    }, []);

    useEffect(() => {
        if (!menuAbierto) return undefined;
        const cerrar = () => setMenuAbierto(false);
        window.addEventListener('resize', cerrar);
        return () => window.removeEventListener('resize', cerrar);
    }, [menuAbierto]);

    useEffect(() => {
        const landing = landingRef.current;
        if (!landing) return;

        let raf = 0;
        const actualizar = () => {
            raf = 0;
            const y = window.scrollY || 0;
            setCompacto(y > 12);
            setMostrarArriba(y > 600);
            const barra = landing.querySelector('[data-progreso]') as HTMLElement | null;
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
        if (!landing || MENOS_MOVIMIENTO()) return;

        const entrada = anime.timeline({ easing: 'easeOutQuart' })
            .add({ targets: landing.querySelector('[data-header]') as HTMLElement | null, opacity: [0, 1], translateY: [-10, 0], duration: 420 })
            .add({ targets: landing.querySelector('[data-hero-art]') as HTMLElement | null, opacity: [0, 1], translateY: [12, 0], duration: 720 }, '-=180')
            .add({ targets: landing.querySelectorAll('[data-hero-art] [data-media]'), scale: [1.08, 1], duration: 1200, easing: 'easeOutQuart' }, '-=760')
            .add({ targets: landing.querySelector('[data-hero-eyebrow]') as HTMLElement | null, opacity: [0, 1], translateY: [14, 0], duration: 500 }, '-=900')
            .add({ targets: landing.querySelectorAll('[data-word]'), translateY: [28, 0], opacity: [0, 1], duration: 840, delay: anime.stagger(55) }, '-=340')
            .add({ targets: landing.querySelector('[data-hero-text]') as HTMLElement | null, opacity: [0, 1], translateY: [16, 0], duration: 560 }, '-=560')
            .add({ targets: landing.querySelector('[data-hero-actions]') as HTMLElement | null, opacity: [0, 1], translateY: [16, 0], duration: 560 }, '-=440')
            .add({ targets: landing.querySelector('[data-hero-stats]') as HTMLElement | null, opacity: [0, 1], translateY: [16, 0], duration: 600 }, '-=420');

        const reveleables = landing.querySelectorAll('[data-revelar]');
        const observador = new IntersectionObserver((entradas, observer) => {
            entradas.forEach((entradaVisible) => {
                if (!entradaVisible.isIntersecting) return;
                anime({
                    targets: entradaVisible.target,
                    opacity: [0, 1],
                    translateY: [26, 0],
                    duration: 680,
                    delay: Number((entradaVisible.target as HTMLElement).dataset.revelarDelay || 0),
                    easing: 'easeOutQuart',
                });
                observer.unobserve(entradaVisible.target);
            });
        }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
        reveleables.forEach((elemento) => {
            (elemento as HTMLElement).style.opacity = '0';
            observador.observe(elemento);
        });

        const preguntas = landing.querySelectorAll('details[data-faq]');
        const animarRespuesta = (event: Event) => {
            const target = event.currentTarget as HTMLDetailsElement;
            if (!target.open) return;
            const p = target.querySelector('p') as HTMLElement | null;
            if (p) {
                anime({ targets: p, opacity: [0, 1], translateY: [-8, 0], duration: 320, easing: 'easeOutCubic' });
            }
        };
        preguntas.forEach((pregunta) => (pregunta as HTMLDetailsElement).addEventListener('toggle', animarRespuesta));

        return () => {
            entrada.pause();
            observador.disconnect();
            preguntas.forEach((pregunta) => {
                const q = pregunta as HTMLDetailsElement;
                q.removeEventListener('toggle', animarRespuesta);
                const p = q.querySelector('p') as HTMLElement | null;
                if (p) anime.remove(p);
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
                        {ENLACES_NAV.map((enlace) => (
                            <a key={enlace.href} className="group relative transition hover:text-texto-soft" href={enlace.href}>
                                {enlace.etiqueta}
                                <span aria-hidden="true" className="absolute -bottom-1.5 left-0 h-px w-0 bg-magenta transition-all duration-300 group-hover:w-full" />
                            </a>
                        ))}
                    </nav>
                    <div className="hidden items-center gap-3 lg:flex">
                        {usuario ? (
                            <Link className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/60 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-texto-soft transition duration-300 hover:border-magenta/60 hover:bg-magenta/10" to={RUTAS.MENU_PRINCIPAL}>
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-xs font-black text-white">{inicialesUsuario}</span>
                                Ir al panel
                            </Link>
                        ) : (
                            <Link className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition duration-300 hover:border-magenta/60 hover:bg-magenta/10 hover:text-magenta" to={RUTAS.LOGIN}>
                                Acceder
                            </Link>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setMenuAbierto((v) => !v)}
                        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                        aria-expanded={menuAbierto}
                        className="grid h-10 w-10 place-items-center rounded-md border border-border text-texto-soft transition hover:border-magenta/60 hover:text-magenta lg:hidden"
                    >
                        {menuAbierto ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                    </button>
                </div>

                {menuAbierto && (
                    <div className="animate-rise border-t border-border bg-bg/98 px-6 py-5 backdrop-blur lg:hidden">
                        <nav className="flex flex-col gap-1" aria-label="Navegación móvil">
                            {ENLACES_NAV.map((enlace) => (
                                <a
                                    key={enlace.href}
                                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-sutil transition hover:bg-magenta/10 hover:text-texto-soft"
                                    href={enlace.href}
                                    onClick={() => setMenuAbierto(false)}
                                >
                                    {enlace.etiqueta}
                                </a>
                            ))}
                        </nav>
                        <div className="mt-3 border-t border-border pt-4">
                            {usuario ? (
                                <Link className="flex items-center gap-2.5 rounded-lg border border-border bg-surface/60 px-3 py-2.5 text-sm font-semibold text-texto-soft" to={RUTAS.MENU_PRINCIPAL} onClick={() => setMenuAbierto(false)}>
                                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-xs font-black text-white">{inicialesUsuario}</span>
                                    Ir al panel
                                </Link>
                            ) : (
                                <Link className="block rounded-lg border border-border px-3 py-2.5 text-center text-sm font-semibold text-texto-soft transition hover:border-magenta/60 hover:text-magenta" to={RUTAS.LOGIN} onClick={() => setMenuAbierto(false)}>
                                    Acceder
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <section ref={spotRef} onMouseMove={seguirSpotlight} className="relative border-b border-border/60">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-500 lg:block [background:radial-gradient(460px_circle_at_var(--mx,22%)_var(--my,32%),rgba(240,79,166,0.16),transparent_62%)]"
                />
                <div className="mx-auto grid max-w-[1280px] items-stretch lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="relative z-10 flex flex-col justify-center px-6 py-20 lg:py-28 lg:pr-14 lg:pl-10">
                        <div data-hero-eyebrow style={oculto}>
                            <Etiqueta>Estudio de grabación · Colombia</Etiqueta>
                        </div>
                        <h1 className="mt-6 max-w-[16ch] text-[clamp(2.6rem,6vw,4.6rem)] font-bold leading-[1.0] tracking-[-0.03em] text-texto-soft">
                            <Palabras texto="Tu próximo sonido empieza aquí." resaltar={2} style={FUENTE_TITULO} />
                        </h1>
                        <p data-hero-text style={oculto} className="mt-6 max-w-[46ch] text-base leading-8 text-sutil">
                            Un espacio para grabar, producir, mezclar y llevar tus ideas musicales desde la primera nota hasta el resultado final.
                        </p>
                        <div data-hero-actions style={oculto} className="mt-9 flex flex-wrap gap-3">
                            <Link className={BOTON_PRIMARIO} to={destinoReserva}>
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

<div data-hero-art style={oculto} className="relative min-h-[560px] overflow-hidden border-t border-border/60 lg:min-h-[620px] lg:border-l lg:border-t-0" aria-label="Estudio Z-ONE: disco de vinilo sobre la sala de piano">
                        <div aria-hidden="true" className="absolute inset-0 [animation:kenburns_36s_ease-in-out_infinite_alternate]">
                            <img src="/landing/piano.jpg" alt="" className="h-full w-full object-cover opacity-40" />
                        </div>
                        <div aria-hidden="true" className="absolute inset-0 bg-[#0b0814]/60" />
                        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[#8b5cf6]/30 blur-[150px]" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-24 h-[30rem] w-[30rem] rounded-full bg-[#ec4899]/24 blur-[160px]" />
                        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a855f7]/18 blur-[170px]" />
                        <div className="absolute inset-0 flex items-center justify-center px-6 py-12">
                            <div data-media className="relative flex items-center justify-center">
                                <VinylDisc
                                    titulo={CANCION_DESTACADA.titulo}
                                    artista={ARTISTA_DESTACADO.artista}
                                    activo={reproduciendo}
                                    onToggle={() => setReproduciendo((v) => !v)}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setReproduciendo((v) => !v)}
                            aria-pressed={!reproduciendo}
                            className="absolute bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#0d0a17]/85 px-4 py-2 text-xs font-semibold text-texto-soft backdrop-blur-xl transition duration-300 hover:border-magenta/60 hover:text-magenta"
                        >
                            {reproduciendo ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            {reproduciendo ? 'Pausar girar' : 'Reproducir girar'}
                        </button>
                        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)]">
                            <div className="mx-auto flex h-20 w-[min(92%,520px)] items-end justify-center gap-1 pb-4 opacity-70">
                                {Array.from({ length: 36 }, (_, i) => (
                                    <span
                                        key={i}
                                        className={`w-1 shrink-0 origin-bottom rounded-full bg-gradient-to-t from-[#8b5cf6]/50 to-[#ec4899]/85 [animation:ecu_2.2s_ease-in-out_infinite] ${reproduciendo ? '' : '[animation-play-state:paused]'}`}
                                        style={{ height: `${40 + ((i * 7) % 90)}%`, animationDelay: `${i * 95}ms`, animationDuration: `${1.7 + (i % 6) * 0.25}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent lg:bg-gradient-to-r lg:from-bg/50 lg:via-transparent lg:to-transparent" />
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
                <div data-revelar {...modificadorReveal(0)} className="max-w-[46ch]">
                    <Etiqueta>Qué hacemos</Etiqueta>
                    <h2 style={FUENTE_TITULO} className="mt-5 max-w-[20ch] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-texto-soft">
                        Del primer ensayo al máster final.
                    </h2>
                    <p className="mt-5 max-w-[42ch] text-base leading-7 text-sutil">
                        Desde una primera toma hasta el máster final, cada etapa del estudio está pensada para tu proyecto.
                    </p>
                </div>
                <div className="mt-12 grid gap-5 sm:grid-cols-3">
                    {SERVICIOS.map((servicio, indice) => (
                        <article
                            key={servicio.n}
                            data-revelar
                            {...modificadorReveal(indice)}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 p-6 transition duration-500 hover:-translate-y-1.5"
                            style={{ background: `radial-gradient(120% 90% at 100% 0%, ${servicio.tono}22, transparent 55%), linear-gradient(160deg, rgba(33,28,54,0.95), rgba(18,14,28,0.98))` }}
                        >
                            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: `linear-gradient(to right, ${servicio.tono}, transparent)` }} />
                            <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100" style={{ background: `${servicio.tono}40` }} />
                            <span aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-8 opacity-[0.07] transition-opacity duration-500 group-hover:opacity-[0.16]">
                                <servicio.icono className="h-40 w-40" style={{ color: servicio.tono }} strokeWidth={1} />
                            </span>
                            <div className="relative flex items-center justify-between">
                                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border transition-transform duration-500 group-hover:scale-105" style={{ borderColor: `${servicio.tono}55`, background: `linear-gradient(135deg, ${servicio.tono}26, ${servicio.tono}0a)`, color: servicio.tono }}>
                                    <servicio.icono aria-hidden="true" className="h-6 w-6" />
                                </span>
                                <span className="font-mono text-2xl font-black leading-none" style={{ ...FUENTE_TITULO, color: servicio.tono }}>{servicio.n}</span>
                            </div>
                            <h3 style={FUENTE_TITULO} className="relative mt-5 text-2xl font-bold leading-tight tracking-tight text-texto-soft">{servicio.t}</h3>
                            <p className="relative mt-2 flex-1 text-sm leading-6 text-sutil">{servicio.d}</p>
                            <span className="relative mt-5 h-px w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: `linear-gradient(to right, ${servicio.tono}80, transparent)` }} aria-hidden="true" />
                        </article>
                    ))}
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
                            <article key={sala.id ?? sala.nombre} data-revelar {...modificadorReveal(index)} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition duration-500 hover:-translate-y-1.5 hover:border-magenta/50 hover:shadow-[0_36px_70px_-28px_rgba(0,0,0,0.95)]">
                                <span aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-px origin-left scale-x-0 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] transition-transform duration-500 group-hover:scale-x-100" />
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <img
                                        src={IMAGENES_SALON[index % IMAGENES_SALON.length]}
                                        alt={`${sala.nombre} del estudio Z-ONE`}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.08] group-hover:brightness-110"
                                    />
                                    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/10 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[520%]" />
                                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/10 to-transparent" />
                                    <span className="absolute left-4 top-4 rounded-md border border-white/10 bg-bg/70 px-2 py-1 font-mono text-[0.65rem] tracking-[0.2em] text-white/85 backdrop-blur-sm transition-colors duration-500 group-hover:border-magenta/40 group-hover:text-magenta">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div className="absolute bottom-4 right-4 flex h-5 items-end gap-0.5 opacity-0 transition-all duration-500 group-hover:opacity-100">
                                        {BARRAS_SALON.map((altura, i) => (
                                            <i
                                                key={i}
                                                className="w-[3px] origin-bottom rounded-full bg-gradient-to-t from-[#8b5cf6] to-[#ec4899] [animation:ecu_1.1s_ease-in-out_infinite]"
                                                style={{ height: `${altura}%`, animationDelay: `${i * 70}ms` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-1 items-start justify-between gap-4 px-5 pt-5">
                                    <div>
                                        <h3 style={FUENTE_TITULO} className="text-base font-bold tracking-tight text-texto-soft">{sala.nombre}</h3>
                                        <p className="mt-0.5 font-mono text-[0.7rem] text-sutil">Disponible por hora</p>
                                    </div>
                                    <strong style={FUENTE_TITULO} className="text-base font-bold text-texto-soft transition-colors duration-300 group-hover:text-magenta">{formatearMoneda(sala.precio_hora)}</strong>
                                </div>
                                <Link className="mt-4 flex items-center justify-between border-t border-border px-5 py-3.5 text-sm font-semibold text-texto-soft transition duration-300 group-hover:bg-magenta/5 group-hover:text-magenta" to={destinoReserva}>
                                    Reservar
                                    <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full border border-border transition duration-300 group-hover:translate-x-1 group-hover:border-magenta/50">→</span>
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
                <div className="mt-12 grid gap-5 sm:grid-cols-3">
                    {PASOS.map((paso, indice) => (
                        <div key={paso.n} data-revelar {...modificadorReveal(indice)} className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-[#161022] to-bg p-7 transition-colors duration-500 hover:border-magenta/40">
                            <span aria-hidden="true" className="pointer-events-none absolute right-5 top-4 text-6xl font-black leading-none text-white/[0.04] transition-colors duration-500 group-hover:text-magenta/10" style={FUENTE_TITULO}>{paso.n}</span>
                            <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface text-magenta transition-transform duration-500 group-hover:-translate-y-1">
                                <paso.icono aria-hidden="true" className="h-5 w-5" />
                            </span>
                            <h3 style={FUENTE_TITULO} className="mt-6 text-lg font-bold tracking-tight text-texto-soft">{paso.t}</h3>
                            <p className="mt-2 text-sm leading-7 text-sutil">{paso.d}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="scroll-mt-24 border-y border-border/60 bg-[#140f23]" id="testimonios">
                <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
                    <div data-revelar {...modificadorReveal(0)} className="max-w-[40ch]">
                        <Etiqueta>Lo que dicen</Etiqueta>
                        <h2 style={FUENTE_TITULO} className="mt-5 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-texto-soft">Voces que confían en Z-ONE.</h2>
                    </div>

                    <div data-revelar {...modificadorReveal(1)} className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
                        {METRICAS.map((metrica) => (
                            <div key={metrica.etiqueta} className="bg-bg p-6 text-center">
                                <p style={FUENTE_TITULO} className="text-4xl font-black tracking-tight text-texto-soft">
                                    <Numero valor={metrica.valor} />
                                    <span className="text-magenta">{metrica.sufijo}</span>
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-sutil">{metrica.etiqueta}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 grid gap-5 lg:grid-cols-3">
                        {TESTIMONIOS.map((testimonio, indice) => (
                            <article key={testimonio.nombre} data-revelar {...modificadorReveal(indice)} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface p-7 transition duration-500 hover:-translate-y-1.5 hover:border-magenta/50 hover:shadow-[0_36px_70px_-28px_rgba(0,0,0,0.95)]">
                                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] transition-transform duration-500 group-hover:scale-x-100" />
                                <Quote className="h-7 w-7 text-magenta/60" aria-hidden="true" />
                                <div className="mt-4 flex gap-0.5" aria-label="5 de 5 estrellas">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="h-3.5 w-3.5 fill-magenta text-magenta" aria-hidden="true" />
                                    ))}
                                </div>
                                <p className="mt-4 flex-1 text-sm leading-7 text-sutil">{testimonio.texto}</p>
                                <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-sm font-black text-white">
                                        {testimonio.nombre.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0] ?? '').join('').toLocaleUpperCase()}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-texto-soft">{testimonio.nombre}</p>
                                        <p className="text-xs text-sutil">{testimonio.rol}</p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
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
                    <Link className={`${BOTON_PRIMARIO} shrink-0`} to={destinoReserva}>
                        <span className="relative z-10">Reservar una sesión</span>
                        <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    </Link>
                </div>
            </section>

            <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
                {mostrarArriba && (
                    <button
                        type="button"
                        onClick={() => window.scrollTo({ top: 0, behavior: MENOS_MOVIMIENTO() ? 'auto' : 'smooth' })}
                        aria-label="Volver arriba"
                        className="grid h-11 w-11 animate-rise place-items-center rounded-full border border-border bg-bg/90 text-texto-soft shadow-lg shadow-black/40 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-magenta/60 hover:text-magenta"
                    >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
                <a
                    href="#contacto"
                    aria-label="Contactar con Z-ONE"
                    className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-accent/30 transition duration-300 hover:-translate-y-0.5 hover:brightness-110"
                >
                    <MessageCircle className="h-4 w-4 transition group-hover:scale-110" aria-hidden="true" />
                    <span className="hidden sm:inline">Hablemos</span>
                </a>
            </div>

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
