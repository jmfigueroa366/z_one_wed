// CAPA: Presentación
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { ArrowUp, Disc3, Menu, MessageCircle, Mic, Quote, SlidersHorizontal, Star, Wand2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RUTAS } from '../config/rutas.ts';
import { formatearMoneda } from '../utils/helpers.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { esAdministrador, esColaborador } from '../config/roles.ts';
import { useApi } from '../hooks/useApi.ts';
import { obtenerLandingApi, type ServicioLandingApi } from '../lib/landingApi.ts';
import { urlImagen } from '../lib/apiClient.ts';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FUENTE_TITULO = { fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" };
const BOTON_PRIMARIO =
    'group relative inline-flex min-h-[52px] items-center justify-center overflow-hidden rounded-md bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-7 text-sm font-bold text-white shadow-lg shadow-accent/25 transition duration-300 hover:brightness-110';
const BOTON_SECUNDARIO =
    'inline-flex min-h-[52px] items-center justify-center rounded-md border border-white/20 px-7 text-sm font-semibold text-texto-soft transition duration-300 hover:border-magenta/60 hover:bg-magenta/10';

const BARRAS_SALON = [50, 92, 64, 100, 46, 78, 60, 38, 84, 54];

const PALABRAS_HERO = ['Grabar', 'Producir', 'Mezclar', 'Masterizar'];

function trazarCapsula(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    ancho: number,
    alto: number,
): void {
    const radio = Math.min(ancho / 2, alto / 2);
    const derecha = x + ancho;
    const abajo = y + alto;
    ctx.moveTo(x + radio, y);
    ctx.lineTo(derecha - radio, y);
    ctx.arcTo(derecha, y, derecha, y + radio, radio);
    ctx.lineTo(derecha, abajo - radio);
    ctx.arcTo(derecha, abajo, derecha - radio, abajo, radio);
    ctx.lineTo(x + radio, abajo);
    ctx.arcTo(x, abajo, x, abajo - radio, radio);
    ctx.lineTo(x, y + radio);
    ctx.arcTo(x, y, x + radio, y, radio);
}

const ICONO: Record<string, React.ElementType> = {
    mic: Mic,
    'sliders-horizontal': SlidersHorizontal,
    'disc-3': Disc3,
    'wand-2': Wand2,
};

const SERVICIOS_FALLBACK: ServicioLandingApi[] = [
    {
        id: -1,
        orden: 1,
        titulo: 'Grabación',
        descripcion: 'Captura voces e instrumentos en una sesión de estudio.',
        icono: 'mic',
        color: '#9ecbff',
    },
    {
        id: -2,
        orden: 2,
        titulo: 'Producción musical',
        descripcion: 'Desarrolla arreglos, sonido y dirección para tus canciones.',
        icono: 'wand-2',
        color: '#a477ff',
    },
    {
        id: -3,
        orden: 3,
        titulo: 'Mezcla',
        descripcion: 'Equilibra pistas y prepara la mezcla de tu proyecto.',
        icono: 'sliders-horizontal',
        color: '#f04fa6',
    },
    {
        id: -4,
        orden: 4,
        titulo: 'Masterización',
        descripcion: 'Da el acabado final y prepara el audio para su distribución.',
        icono: 'disc-3',
        color: '#7be0b0',
    },
];

const ENLACES_NAV = [
    { etiqueta: 'Cómo funciona', href: '#proceso' },
    { etiqueta: 'Servicios', href: '#servicios' },
    { etiqueta: 'Espacios', href: '#espacios' },
    { etiqueta: 'Testimonios', href: '#testimonios' },
    { etiqueta: 'Preguntas', href: '#preguntas' },
    { etiqueta: 'Contacto', href: '#contacto' },
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
    const heroRef = useRef<HTMLElement | null>(null);
    const ondaCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [compacto, setCompacto] = useState(false);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [mostrarArriba, setMostrarArriba] = useState(false);
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
    const { datos, error, cargando, recargar } = useApi(obtenerLandingApi);
    const salas = datos?.salas ?? [];
    const servicios = datos?.servicios?.length ? datos.servicios : SERVICIOS_FALLBACK;
    const pasos = datos?.pasos ?? [];
    const preguntas = datos?.preguntas ?? [];
    const testimonios = datos?.testimonios ?? [];
    const metricas = datos?.metricas ?? [];
    const artistas = datos?.artistas ?? [];
    const totalServicios = datos?.totalServicios && datos.totalServicios > 0 ? datos.totalServicios : servicios.length;
    const config = datos?.config;
    const animar = !MENOS_MOVIMIENTO();
    const oculto = animar ? { opacity: 0 } : undefined;

    const enlacesNav = ENLACES_NAV.filter((enlace) => {
        switch (enlace.href) {
            case '#proceso':
                return pasos.length > 0;
            case '#testimonios':
                return metricas.length > 0 || testimonios.length > 0;
            case '#preguntas':
                return preguntas.length > 0;
            default:
                return true;
        }
    });

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

    useEffect(() => {
        const canvas = ondaCanvasRef.current;
        const hero = heroRef.current;
        if (!canvas || !hero) return undefined;

        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        const reducir = MENOS_MOVIMIENTO();
        const puedeHover = window.matchMedia('(hover: hover)').matches;
        const puntero = { x: -1, activo: false };
        let ancho = 1;
        let alto = 1;
        let barras = 48;
        let gradiente: CanvasGradient | null = null;
        let raf = 0;
        let visible = true;
        let activo = true;

        const medir = () => {
            const rect = canvas.getBoundingClientRect();
            ancho = Math.max(1, rect.width);
            alto = Math.max(1, rect.height);
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const anchoReal = Math.round(ancho * dpr);
            const altoReal = Math.round(alto * dpr);
            if (canvas.width !== anchoReal || canvas.height !== altoReal) {
                canvas.width = anchoReal;
                canvas.height = altoReal;
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            barras = Math.max(48, Math.min(112, Math.round(ancho / 14)));
            gradiente = ctx.createLinearGradient(0, 0, ancho, 0);
            gradiente.addColorStop(0, '#9365f2');
            gradiente.addColorStop(0.55, '#b95dc0');
            gradiente.addColorStop(1, '#e34ba6');
        };

        const dibujar = (tiempo: number) => {
            if (!gradiente) return;
            ctx.clearRect(0, 0, ancho, alto);
            const centro = alto / 2;
            const paso = ancho / barras;
            const anchoBarra = Math.max(2, Math.min(7, paso * 0.55));
            const alturaMax = alto * 0.44;
            const sigma = Math.max(60, ancho * 0.09);
            const t = tiempo / 1000;

            ctx.beginPath();
            for (let i = 0; i < barras; i += 1) {
                const onda = Math.sin(t * 1.35 + i * 0.42) * 0.5 + Math.sin(t * 0.72 - i * 0.19) * 0.5;
                const envolvente = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.27 + Math.sin(t * 0.4) * 0.35));
                let altura = 0.16 + (onda + 1) * 0.2 + envolvente * 0.14;
                if (puntero.activo) {
                    const diferencia = i * paso + paso / 2 - puntero.x;
                    altura += Math.exp(-(diferencia * diferencia) / (sigma * sigma)) * 0.5;
                }
                const altoBarra = Math.max(3, Math.min(alturaMax, altura * alturaMax));
                const x = i * paso + (paso - anchoBarra) / 2;
                trazarCapsula(ctx, x, centro - altoBarra, anchoBarra, altoBarra);
                trazarCapsula(ctx, x, centro + 2, anchoBarra, altoBarra);
            }
            ctx.fillStyle = gradiente;
            ctx.fill();
        };

        const detener = () => {
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
        };

        const ciclo = (marca: number) => {
            if (!visible || !activo) {
                raf = 0;
                return;
            }
            dibujar(marca);
            raf = requestAnimationFrame(ciclo);
        };

        const iniciar = () => {
            if (reducir || raf || !visible || !activo) return;
            raf = requestAnimationFrame(ciclo);
        };

        const alMover = (evento: PointerEvent) => {
            if (reducir) return;
            if (evento.pointerType && evento.pointerType !== 'mouse') return;
            const rect = hero.getBoundingClientRect();
            puntero.x = evento.clientX - rect.left;
            puntero.activo = true;
        };

        const alSalir = () => {
            puntero.activo = false;
        };

        const alRedimensionar = () => {
            medir();
            if (reducir) dibujar(1200);
        };

        const observadorVista = new IntersectionObserver((entradas) => {
            visible = Boolean(entradas[0]?.isIntersecting);
            if (visible) iniciar();
            else detener();
        }, { threshold: 0 });
        observadorVista.observe(hero);

        const observadorTamano = new ResizeObserver(alRedimensionar);
        observadorTamano.observe(canvas);

        const alVisibilidad = () => {
            activo = !document.hidden;
            if (activo) iniciar();
            else detener();
        };
        document.addEventListener('visibilitychange', alVisibilidad);
        window.addEventListener('resize', alRedimensionar);

        if (puedeHover && !reducir) {
            hero.addEventListener('pointermove', alMover, { passive: true });
            hero.addEventListener('pointerleave', alSalir, { passive: true });
        }

        medir();
        if (reducir) {
            dibujar(1200);
        } else {
            iniciar();
        }

        return () => {
            detener();
            observadorVista.disconnect();
            observadorTamano.disconnect();
            document.removeEventListener('visibilitychange', alVisibilidad);
            window.removeEventListener('resize', alRedimensionar);
            hero.removeEventListener('pointermove', alMover);
            hero.removeEventListener('pointerleave', alSalir);
        };
    }, [cargando, error]);

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
    }, [datos]);

    if (cargando) {
        return (
            <main ref={landingRef} className="min-h-screen overflow-x-hidden bg-bg text-texto-soft">
                <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-soft-light" />
                <section className="mx-auto flex max-w-[1280px] flex-col items-center px-6 py-32 lg:px-10" data-header style={{ opacity: 0 }}>
                    <div className="animate-pulse h-5 w-40 rounded bg-surface/60" />
                    <div className="mt-6 animate-pulse h-4 w-28 rounded bg-surface/60" />
                    <div className="mt-6 animate-pulse h-16 w-full max-w-3xl rounded-2xl bg-surface/60" />
                    <div className="mt-3 animate-pulse h-16 w-full max-w-2xl rounded-2xl bg-surface/60" />
                    <div className="mt-8 animate-pulse h-16 w-64 rounded-full bg-surface/60" />
                    <div className="mt-10 grid w-full max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/60">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 animate-pulse bg-surface/60" />
                        ))}
                    </div>
                    <div className="mt-10 h-48 w-full animate-pulse rounded-2xl bg-[#140f23]" />
                </section>
            </main>
        );
    }

    if (error) {
        return (
            <main ref={landingRef} className="min-h-screen overflow-x-hidden bg-bg text-texto-soft">
                <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-soft-light" />
                <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
                    <p className="font-mono text-2xl uppercase tracking-[0.3em] text-magenta">Lo sentimos.</p>
                    <p className="mt-4 text-base text-texto-soft">No pudimos cargar los datos del sitio. Intenta de nuevo.</p>
                    <button
                        type="button"
                        onClick={recargar}
                        className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-md bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-7 text-sm font-bold text-white shadow-lg shadow-accent/25 transition duration-300 hover:brightness-110"
                    >
                        Reintentar
                    </button>
                </section>
            </main>
        );
    }

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
                        {enlacesNav.map((enlace) => (
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
                            {enlacesNav.map((enlace) => (
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

            <section ref={heroRef} className="relative overflow-hidden border-b border-border/60" aria-labelledby="hero-titulo">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/2 top-[-12%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[#9365f2]/20 blur-[150px] animate-aurora motion-reduce:animate-none" />
                    <div className="absolute -left-32 top-1/3 h-[26rem] w-[26rem] rounded-full bg-[#e34ba6]/15 blur-[130px] animate-aurora motion-reduce:animate-none [animation-delay:-6s]" />
                    <div className="absolute -right-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#8b5cf6]/18 blur-[140px] animate-aurora motion-reduce:animate-none [animation-delay:-11s]" />
                </div>

                <div className="relative mx-auto flex max-w-[1280px] flex-col items-center px-6 pt-20 pb-10 text-center lg:pt-28">
                    <div data-hero-eyebrow style={oculto}>
                        <Etiqueta className="justify-center">Estudio de grabación · Colombia</Etiqueta>
                    </div>

                    <div aria-hidden="true" className="mt-7 flex items-center justify-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.28em] text-magenta">
                        <span className="h-px w-8 bg-magenta/40" />
                        <span className="relative block h-5 w-28 overflow-hidden">
                            <span className="block animate-rotar-palabra motion-reduce:animate-none">
                                {PALABRAS_HERO.map((palabra) => (
                                    <span key={palabra} className="flex h-5 items-center justify-center">{palabra}</span>
                                ))}
                                <span className="flex h-5 items-center justify-center">{PALABRAS_HERO[0]}</span>
                            </span>
                        </span>
                        <span className="h-px w-8 bg-magenta/40" />
                    </div>
                    <span className="sr-only">Grabar, producir, mezclar y masterizar.</span>

                    <h1 id="hero-titulo" className="mt-5 max-w-[18ch] text-[clamp(2.8rem,7vw,5.4rem)] font-bold leading-[0.98] tracking-[-0.035em] text-texto-soft">
                        <span className="block">
                            <Palabras texto="Tu próximo sonido" resaltar={2} style={FUENTE_TITULO} />
                        </span>
                        <span className="block">
                            <Palabras texto="empieza aquí." style={FUENTE_TITULO} />
                        </span>
                    </h1>

                    <p data-hero-text style={oculto} className="mt-6 max-w-[52ch] text-base leading-8 text-sutil">
                        Un espacio para grabar, producir, mezclar y llevar tus ideas musicales desde la primera nota hasta el resultado final.
                    </p>

                    <div data-hero-actions style={oculto} className="mt-9 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
                        <Link
                            className="group inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/[0.04] py-2 pl-2 pr-6 text-left text-texto-soft backdrop-blur transition duration-300 hover:border-magenta/40 hover:bg-white/[0.07] motion-reduce:transition-none"
                            to={usuario ? RUTAS.MENU_PRINCIPAL : RUTAS.REGISTRO}
                            aria-label={usuario ? 'Ir al panel' : 'Crear cuenta para empezar a grabar'}
                        >
                            <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-white/25 bg-gradient-to-br from-[#ff5a6e] to-[#c81e4a] text-white shadow-[0_0_0_8px_rgba(227,75,166,0.08),0_20px_44px_-18px_rgba(200,30,74,0.9)] transition duration-300 group-hover:scale-[1.02] group-hover:brightness-110 motion-reduce:transform-none">
                                <Mic className="h-6 w-6" aria-hidden="true" />
                                <span aria-hidden="true" className="pointer-events-none absolute -inset-2 animate-ping rounded-full border border-[#e34ba6]/40 motion-reduce:animate-none" />
                                <span aria-hidden="true" className="pointer-events-none absolute -inset-4 animate-ping rounded-full border border-[#9365f2]/30 [animation-delay:0.6s] motion-reduce:animate-none" />
                            </span>
                            <span className="flex flex-col">
                                <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-sutil">{usuario ? 'Sesión iniciada' : 'Empieza ahora'}</span>
                                <span style={FUENTE_TITULO} className="text-base font-bold">{usuario ? 'Ir al panel' : 'Crear cuenta'}</span>
                            </span>
                        </Link>
                        {!usuario && (
                            <Link className={BOTON_SECUNDARIO} to={RUTAS.LOGIN}>Iniciar sesión</Link>
                        )}
                    </div>

                    <dl data-hero-stats style={oculto} className="mt-12 grid w-full max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/60 text-center sm:mt-14">
                        {[
                            { v: String(salas.length).padStart(2, '0'), l: 'Cabinas y salas', n: salas.length },
                            { v: String(totalServicios), l: 'Servicios de audio', n: totalServicios },
                            { v: config?.horario_estudio ?? 'Lun–Dom', l: 'Horario del estudio' },
                        ].map((stat) => (
                            <div key={stat.l} className="bg-bg/80 px-3 py-4 backdrop-blur">
                                <dt style={FUENTE_TITULO} className="text-xl font-bold tracking-tight text-texto-soft sm:text-2xl">
                                    {stat.n != null ? <Numero valor={stat.n} relleno /> : stat.v}
                                </dt>
                                <dd className="mt-1 text-[0.68rem] uppercase tracking-[0.12em] text-sutil">{stat.l}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div data-hero-art style={oculto} className="relative h-[190px] w-full overflow-hidden sm:h-[240px] lg:h-[300px]">
                    <canvas ref={ondaCanvasRef} data-media className="absolute inset-0 h-full w-full" aria-hidden="true" />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-bg to-transparent" />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent" />
                </div>
            </section>

            {pasos.length > 0 && (
            <section className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-24 lg:px-10" id="proceso">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div data-revelar {...modificadorReveal(0)} className="max-w-[42ch]">
                        <Etiqueta>Cómo funciona</Etiqueta>
                        <h2 style={FUENTE_TITULO} className="mt-5 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-texto-soft">Reservar toma tres pasos.</h2>
                    </div>
                    <p className="max-w-[34ch] text-sm leading-7 text-sutil">Del primer contacto a la sesión confirmada, sin vueltas.</p>
                </div>
                <div className="relative mt-14">
                    <span aria-hidden="true" className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent sm:block" />
                    <div className="grid gap-5 sm:grid-cols-3">
                        {pasos.map((paso, indice) => {
                            const Icono = ICONO[paso.icono] ?? Mic;
                            const numero = String(indice + 1).padStart(2, '0');
                            return (
                            <div key={paso.id} data-revelar {...modificadorReveal(indice)} className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-b from-[#161022] to-bg p-7 transition duration-500 hover:-translate-y-1 hover:border-magenta/40">
                                <span aria-hidden="true" className="pointer-events-none absolute right-5 top-4 text-6xl font-black leading-none text-white/[0.04] transition-colors duration-500 group-hover:text-magenta/10" style={FUENTE_TITULO}>{numero}</span>
                                <span className="relative grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface text-magenta transition-transform duration-500 group-hover:-translate-y-1">
                                    <Icono aria-hidden="true" className="h-5 w-5" />
                                </span>
                                <h3 style={FUENTE_TITULO} className="mt-6 text-lg font-bold tracking-tight text-texto-soft">{paso.titulo}</h3>
                                <p className="mt-2 text-sm leading-7 text-sutil">{paso.descripcion}</p>
                            </div>
                            );
                        })}
                    </div>
                </div>
            </section>
            )}

            <section className="scroll-mt-24 border-y border-border/60 bg-[#140f23]" id="servicios">
                <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                        <div data-revelar {...modificadorReveal(0)} className="max-w-[46ch]">
                            <Etiqueta>Qué hacemos</Etiqueta>
                            <h2 style={FUENTE_TITULO} className="mt-5 max-w-[20ch] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-texto-soft">
                                Del primer ensayo al máster final.
                            </h2>
                        </div>
                        <p className="max-w-[36ch] text-sm leading-7 text-sutil">
                            Desde una primera toma hasta el máster final, cada etapa del estudio está pensada para tu proyecto.
                        </p>
                    </div>
                    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {servicios.map((servicio, indice) => {
                            const Icono = ICONO[servicio.icono] ?? Mic;
                            const numero = String(indice + 1).padStart(2, '0');
                            return (
                            <article
                                key={servicio.id}
                                data-revelar
                                {...modificadorReveal(indice)}
                                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 p-6 transition duration-500 hover:-translate-y-1.5"
                                style={{ background: `radial-gradient(120% 90% at 100% 0%, ${servicio.color}22, transparent 55%), linear-gradient(160deg, rgba(33,28,54,0.95), rgba(18,14,28,0.98))` }}
                            >
                                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: `linear-gradient(to right, ${servicio.color}, transparent)` }} />
                                <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100" style={{ background: `${servicio.color}40` }} />
                                <span aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-8 opacity-[0.07] transition-opacity duration-500 group-hover:opacity-[0.16]">
                                    <Icono className="h-40 w-40" style={{ color: servicio.color }} strokeWidth={1} />
                                </span>
                                <div className="relative flex items-center justify-between">
                                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border transition-transform duration-500 group-hover:scale-105" style={{ borderColor: `${servicio.color}55`, background: `linear-gradient(135deg, ${servicio.color}26, ${servicio.color}0a)`, color: servicio.color }}>
                                        <Icono aria-hidden="true" className="h-6 w-6" />
                                    </span>
                                    <span className="font-mono text-2xl font-black leading-none" style={{ ...FUENTE_TITULO, color: servicio.color }}>{numero}</span>
                                </div>
                                <h3 style={FUENTE_TITULO} className="relative mt-5 text-xl font-bold leading-tight tracking-tight text-texto-soft">{servicio.titulo}</h3>
                                <p className="relative mt-2 flex-1 text-sm leading-6 text-sutil">{servicio.descripcion}</p>
                                <span className="relative mt-5 h-px w-full origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100" style={{ background: `linear-gradient(to right, ${servicio.color}80, transparent)` }} aria-hidden="true" />
                            </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            {artistas.length > 0 && (
            <div className="border-b border-border/60 bg-[#140f23]">
                <div className="mx-auto max-w-[1280px] px-6 py-7 lg:px-10">
                    <p className="flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-sutil">
                        <span aria-hidden="true" className="h-px w-7 bg-magenta/50" />
                        Voces que graban en Z-ONE
                    </p>
                    <div className="mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
                        <div className="flex w-max animate-marquee items-center gap-3 pr-3 hover:[animation-play-state:paused]">
                            {[...artistas, ...artistas].map((artista, i) => {
                                const iniciales = artista.nombre.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0] ?? '').join('').toLocaleUpperCase() || '?';
                                return (
                                <div key={`${artista.id}-${i}`} className="flex shrink-0 items-center gap-3 rounded-full border border-border bg-surface/60 py-1.5 pl-1.5 pr-5">
                                    {artista.foto ? (
                                        <img src={urlImagen(artista.foto)} alt="" loading="lazy" className="h-9 w-9 rounded-full object-cover" />
                                    ) : (
                                        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-xs font-black text-white">{iniciales}</span>
                                    )}
                                    <span className="whitespace-nowrap text-sm font-semibold text-texto-soft">{artista.nombre}</span>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            )}

            <section className="scroll-mt-24 border-b border-border/60" id="espacios">
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
                                        src={urlImagen(sala.imagenUrl)}
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
                                    <strong style={FUENTE_TITULO} className="text-base font-bold text-texto-soft transition-colors duration-300 group-hover:text-magenta">{formatearMoneda(sala.precioHora)}</strong>
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

            {(metricas.length > 0 || testimonios.length > 0) && (
            <section className="scroll-mt-24 border-b border-border/60 bg-[#140f23]" id="testimonios">
                <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
                    <div data-revelar {...modificadorReveal(0)} className="max-w-[40ch]">
                        <Etiqueta>Lo que dicen</Etiqueta>
                        <h2 style={FUENTE_TITULO} className="mt-5 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-texto-soft">Voces que confían en Z-ONE.</h2>
                    </div>

                    <div data-revelar {...modificadorReveal(1)} className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
                        {metricas.map((metrica) => (
                            <div key={metrica.id} className="bg-bg p-6 text-center">
                                <p style={FUENTE_TITULO} className="text-4xl font-black tracking-tight text-texto-soft">
                                    <Numero valor={metrica.valor} />
                                    <span className="text-magenta">{metrica.sufijo}</span>
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-sutil">{metrica.etiqueta}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 grid gap-5 lg:grid-cols-3">
                        {testimonios.map((testimonio, indice) => (
                            <article key={testimonio.id} data-revelar {...modificadorReveal(indice)} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface p-7 transition duration-500 hover:-translate-y-1.5 hover:border-magenta/50 hover:shadow-[0_36px_70px_-28px_rgba(0,0,0,0.95)]">
                                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] transition-transform duration-500 group-hover:scale-x-100" />
                                <Quote className="h-7 w-7 text-magenta/60" aria-hidden="true" />
                                <div className="mt-4 flex gap-0.5" aria-label={`${testimonio.calificacion} de 5 estrellas`}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={`h-3.5 w-3.5 ${i < testimonio.calificacion ? 'fill-magenta text-magenta' : 'text-border'}`} aria-hidden="true" />
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
            )}

            {preguntas.length > 0 && (
            <section className="scroll-mt-24 border-b border-border/60" id="preguntas">
                <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
                    <div data-revelar {...modificadorReveal(0)}>
                        <Etiqueta>Preguntas frecuentes</Etiqueta>
                        <h2 style={FUENTE_TITULO} className="mt-5 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-texto-soft">Antes de reservar.</h2>
                        <p className="mt-5 max-w-[38ch] text-sm leading-7 text-sutil">Lo esencial para preparar tu sesión en Z-ONE.</p>
                    </div>
                    <div className="border-t border-border">
                        {preguntas.map((faq, indice) => (
                            <details key={faq.id} data-faq data-revelar {...modificadorReveal(indice)} className="group border-b border-border">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-base font-semibold text-texto-soft transition-colors hover:text-magenta [&::-webkit-details-marker]:hidden">
                                    {faq.pregunta}
                                    <span className="text-xl text-magenta transition-transform duration-300 group-open:rotate-45" aria-hidden="true">+</span>
                                </summary>
                                <p className="max-w-[62ch] pb-6 pr-8 text-sm leading-7 text-sutil">{faq.respuesta}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>
            )}

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
