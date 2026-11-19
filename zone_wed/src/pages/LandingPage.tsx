// CAPA: Presentación
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { ArrowUp, Disc3, Menu, MessageCircle, Mic, Quote, SlidersHorizontal, Star, Wand2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RUTAS } from '../config/rutas.ts';
import { formatearMoneda } from '../utils/helpers.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { esAdministrador, esColaborador } from '../config/roles.ts';
import { useApi } from '../hooks/useApi.ts';
import { obtenerLandingApi, type PasoLandingApi, type ServicioLandingApi } from '../lib/landingApi.ts';
import { urlImagen } from '../lib/apiClient.ts';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FUENTE_TITULO = { fontFamily: 'var(--font-landing-head)' };
const FUENTE_LANDING_HEAD = { fontFamily: 'var(--font-landing-head)' };
const FUENTE_LANDING_BODY = { fontFamily: 'var(--font-landing-body)' };
const FUENTE_LANDING_MONO = { fontFamily: 'var(--font-landing-mono)' };
const BOTON_CTA =
    'inline-flex min-h-[48px] items-center justify-center rounded-full bg-primario px-6 text-sm font-semibold text-texto transition duration-300 hover:bg-texto hover:text-bg';
const BOTON_CTA_SECUNDARIO =
    'inline-flex min-h-[48px] items-center justify-center rounded-full border border-texto/35 px-6 text-sm font-semibold text-texto transition duration-300 hover:bg-texto hover:text-bg';

const PALABRAS_HERO = ['sonido', 'beat', 'disco', 'sencillo'];
const BANDA_MARQUEE = ['Grabación', 'Producción', 'Mezcla', 'Masterización'];
const SERVICIOS_MEZCLA = ['Grabación', 'Producción', 'Mezcla', 'Masterización'];
const BARRAS_SALON = [50, 92, 64, 100, 46, 78, 60, 38, 84, 54];
const IMAGENES_SALA_FALLBACK = ['/landing/cabina 1.jpg', '/landing/cabina 2.jpg', '/landing/cabina 3.jpg'];

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

type EstiloDisco = React.CSSProperties & { ['--d']?: string };

interface DiscoViniloProps {
    lado: string;
    textoBorde: string;
    className?: string;
    style?: EstiloDisco;
    opacidadBorde?: number;
    conBrazo?: boolean;
}

function DiscoVinilo({
    lado,
    textoBorde,
    className = '',
    style,
    opacidadBorde = 0.42,
    conBrazo = false,
}: DiscoViniloProps) {
    const id = useId().replace(/:/g, '');
    return (
        <div className={`pointer-events-none ${className}`} style={style} aria-hidden="true">
            <div className="absolute inset-0 rounded-full shadow-[0_0_140px_rgba(11,41,223,0.35),0_0_0_1px_rgba(214,243,235,0.1)]">
                <div
                    className="absolute inset-0 animate-vinilo rounded-full motion-reduce:animate-none"
                    style={{
                        background:
                            'conic-gradient(from 0deg, transparent 0 6%, rgba(63,132,197,.22) 8%, transparent 11% 46%, rgba(80,11,169,.5) 49%, transparent 53% 78%, rgba(63,132,197,.14) 80%, transparent 83% 100%), repeating-radial-gradient(circle at center, #010f1a 0 2px, #04192b 2px 3px), #010f1a',
                    }}
                >
                    <div
                        className="absolute inset-[7%] rounded-full border border-texto/[0.07]"
                        style={{
                            boxShadow:
                                '0 0 0 calc(var(--d, 0px) * .05) rgba(0,0,0,.18), inset 0 0 0 calc(var(--d, 0px) * .06) rgba(214,243,235,.03)',
                        }}
                    />
                    <div
                        className="absolute inset-[33%] grid place-items-center rounded-full"
                        style={{
                            background: 'conic-gradient(from 20deg, #0B29DF, #500BA9, #3F84C5, #0B29DF)',
                            boxShadow: '0 0 0 calc(var(--d, 0px) * .012) rgba(0,0,0,.35)',
                        }}
                    >
                        <span
                            className="text-texto"
                            style={{
                                ...FUENTE_LANDING_HEAD,
                                fontWeight: 800,
                                fontSize: 'calc(var(--d, 1px) * .045)',
                                letterSpacing: '-.03em',
                                transform: 'translateY(-70%)',
                            }}
                        >
                            Z·ONE
                        </span>
                        <small
                            className="absolute bottom-[20%] text-texto/75"
                            style={{ ...FUENTE_LANDING_MONO, fontSize: 'calc(var(--d, 1px) * .016)', letterSpacing: '.2em' }}
                        >
                            {lado}
                        </small>
                        <span className="absolute h-[12%] w-[12%] rounded-full bg-bg shadow-[inset_0_0_0_2px_rgba(214,243,235,.25)]" />
                    </div>
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200" aria-hidden="true">
                        <defs>
                            <path id={`rim-${id}`} d="M20,100 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
                        </defs>
                        <text
                            textLength={500}
                            lengthAdjust="spacing"
                            style={{ ...FUENTE_LANDING_MONO, fontSize: 6, fill: `rgba(214,243,235,${opacidadBorde})` }}
                        >
                            <textPath href={`#rim-${id}`} textLength={500} lengthAdjust="spacing">
                                {textoBorde}
                            </textPath>
                        </text>
                    </svg>
                </div>
            </div>
            <div
                aria-hidden="true"
                className="absolute inset-0 rounded-full opacity-30 mix-blend-screen"
                style={{
                    background:
                        'conic-gradient(from 35deg, transparent 10%, rgba(214,243,235,.55) 14%, transparent 19% 60%, rgba(214,243,235,.4) 64%, transparent 69% 100%)',
                }}
            />
            {conBrazo && (
                <svg
                    className="absolute inset-0 z-20 h-full w-full overflow-visible drop-shadow-[0_8px_12px_rgba(0,0,0,0.65)]"
                    viewBox="0 0 100 100"
                    aria-hidden="true"
                >
                    <g className="origin-[96px_-4px] animate-aguja motion-reduce:animate-none">
                        <line x1="99.5" y1="-7.5" x2="64" y2="28" stroke="rgba(214,243,235,.8)" strokeWidth=".45" strokeLinecap="round" />
                        <line x1="64" y1="28" x2="61.8" y2="30.2" stroke="#D6F3EB" strokeWidth="1.1" strokeLinecap="round" />
                        <line x1="96" y1="-4" x2="99.6" y2="-7.6" stroke="#D6F3EB" strokeWidth="1.2" strokeLinecap="round" />
                        <circle cx="96" cy="-4" r="2.4" fill="#04192b" stroke="rgba(214,243,235,.6)" strokeWidth=".3" />
                        <circle cx="96" cy="-4" r=".9" fill="#3F84C5" />
                    </g>
                </svg>
            )}
        </div>
    );
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
        color: '#8FBCE6',
    },
    {
        id: -3,
        orden: 3,
        titulo: 'Mezcla',
        descripcion: 'Equilibra pistas y prepara la mezcla de tu proyecto.',
        icono: 'sliders-horizontal',
        color: '#8FBCE6',
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

const PASOS_FALLBACK: PasoLandingApi[] = [
    {
        id: -1,
        orden: 1,
        titulo: 'El cliente pide',
        descripcion: 'Describe tu proyecto y elige el servicio.',
        icono: 'mic',
    },
    {
        id: -2,
        orden: 2,
        titulo: 'El admin aprueba',
        descripcion: 'Revisa la solicitud antes de que avance.',
        icono: 'sliders-horizontal',
    },
    {
        id: -3,
        orden: 3,
        titulo: 'El equipo acepta',
        descripcion: 'Los colaboradores confirman su participación.',
        icono: 'wand-2',
    },
    {
        id: -4,
        orden: 4,
        titulo: 'Se paga',
        descripcion: 'El cliente asegura la sesión con su anticipo.',
        icono: 'disc-3',
    },
    {
        id: -5,
        orden: 5,
        titulo: 'Se graba',
        descripcion: 'Reserva confirmada y a trabajar.',
        icono: 'mic',
    },
];

const ENLACES_NAV = [
    { etiqueta: 'Cómo funciona', href: '#proceso' },
    { etiqueta: 'Mezcla', href: '#mezcla' },
    { etiqueta: 'Servicios', href: '#servicios' },
    { etiqueta: 'Espacios', href: '#espacios' },
    { etiqueta: 'Testimonios', href: '#testimonios' },
    { etiqueta: 'Contacto', href: '#contacto' },
];

const modificadorReveal = (indice: number) => ({ 'data-revelar-delay': String(indice * 90) });

interface EtiquetaProps {
    children: React.ReactNode;
    className?: string;
}

function Etiqueta({ children, className = '' }: EtiquetaProps) {
    return (
        <p className={`flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent ${className}`}>
            <span aria-hidden="true" className="h-px w-7 bg-accent/50" />
            {children}
        </p>
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
    const procesoRef = useRef<HTMLDivElement | null>(null);
    const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const mezclaCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const dibujarMezclaRef = useRef<((tiempo: number) => void) | null>(null);

    const [compacto, setCompacto] = useState(false);
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [mostrarArriba, setMostrarArriba] = useState(false);
    const [indicePalabra, setIndicePalabra] = useState(0);
    const [palabraVisible, setPalabraVisible] = useState(true);
    const [faders, setFaders] = useState([70, 55, 40, 60]);
    const [pasoActivo, setPasoActivo] = useState(-1);

    const fadersRef = useRef(faders);
    fadersRef.current = faders;

    const { usuario } = useAuth();
    const esStaff = esAdministrador(usuario) || esColaborador(usuario);
    const destinoCta = usuario ? (esStaff ? RUTAS.SESIONES : RUTAS.MENU_PRINCIPAL) : RUTAS.REGISTRO;
    const destinoReserva = esStaff ? `${RUTAS.SESIONES}#crear` : `${RUTAS.SOLICITUDES}#nueva-reserva`;
    const inicialesUsuario = (usuario?.nombre ?? '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0] ?? '')
        .join('')
        .toLocaleUpperCase() || 'Z';

    const { datos, error, recargar } = useApi(obtenerLandingApi);
    const salas = datos?.salas ?? [];
    const servicios = datos?.servicios?.length ? datos.servicios : SERVICIOS_FALLBACK;
    const pasos = datos?.pasos?.length ? datos.pasos : PASOS_FALLBACK;
    const testimonios = datos?.testimonios ?? [];
    const metricas = datos?.metricas ?? [];
    const totalServicios = datos?.totalServicios && datos.totalServicios > 0 ? datos.totalServicios : servicios.length;
    const totalSalas = salas.length;
    const config = datos?.config;
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
        if (MENOS_MOVIMIENTO()) return undefined;
        let cambio: number | undefined;
        const intervalo = window.setInterval(() => {
            setPalabraVisible(false);
            cambio = window.setTimeout(() => {
                setIndicePalabra((indice) => (indice + 1) % PALABRAS_HERO.length);
                setPalabraVisible(true);
            }, 250);
        }, 2600);
        return () => {
            window.clearInterval(intervalo);
            if (cambio) window.clearTimeout(cambio);
        };
    }, []);

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
        const canvas = heroCanvasRef.current;
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
            barras = Math.max(40, Math.min(120, Math.round(ancho / 16)));
            gradiente = ctx.createLinearGradient(0, 0, ancho, 0);
            gradiente.addColorStop(0, '#500BA9');
            gradiente.addColorStop(0.55, '#0B29DF');
            gradiente.addColorStop(1, '#3F84C5');
        };

        const dibujar = (tiempo: number) => {
            if (!gradiente) return;
            ctx.clearRect(0, 0, ancho, alto);
            const centro = alto * 0.6;
            const paso = ancho / barras;
            const anchoBarra = Math.max(2, Math.min(7, paso * 0.62));
            const sigma = Math.max(60, ancho * 0.09);
            const t = tiempo / 1000;
            ctx.fillStyle = gradiente;
            ctx.globalAlpha = 1;

            for (let i = 0; i < barras; i += 1) {
                const x = i * paso + paso / 2;
                let amplitud = 0.35 + 0.25 * Math.sin(t / 0.7 + i * 0.35) + 0.2 * Math.sin(t / 0.33 + i * 0.11);
                if (puntero.activo) {
                    const diferencia = x - puntero.x;
                    amplitud += Math.exp(-(diferencia * diferencia) / (sigma * sigma)) * 0.7;
                }
                const altura = Math.max(4, amplitud * alto * 0.7);
                ctx.beginPath();
                trazarCapsula(ctx, x - anchoBarra / 2, centro - altura * 0.6, anchoBarra, altura);
                ctx.fill();
            }
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
        if (reducir) dibujar(1200);
        else iniciar();

        return () => {
            detener();
            observadorVista.disconnect();
            observadorTamano.disconnect();
            document.removeEventListener('visibilitychange', alVisibilidad);
            window.removeEventListener('resize', alRedimensionar);
            hero.removeEventListener('pointermove', alMover);
            hero.removeEventListener('pointerleave', alSalir);
        };
    }, []);

    useEffect(() => {
        const canvas = mezclaCanvasRef.current;
        if (!canvas) return undefined;

        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        const reducir = MENOS_MOVIMIENTO();
        let ancho = 1;
        let alto = 1;
        let gradiente: CanvasGradient | null = null;
        let raf = 0;
        let visible = true;
        let activo = true;
        const suave = [0.7, 0.55, 0.4, 0.6];

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
            gradiente = ctx.createLinearGradient(0, 0, ancho, 0);
            gradiente.addColorStop(0, '#500BA9');
            gradiente.addColorStop(0.55, '#0B29DF');
            gradiente.addColorStop(1, '#3F84C5');
        };

        const dibujar = (tiempo: number) => {
            if (!gradiente) return;
            ctx.clearRect(0, 0, ancho, alto);
            const n = Math.max(36, Math.floor(ancho / 14));
            const paso = ancho / n;
            const centro = alto / 2;
            const t = tiempo / 1000;

            fadersRef.current.forEach((valor, indice) => {
                suave[indice] += (valor / 100 - suave[indice]) * 0.12;
            });

            const [grabacion, produccion, mezcla, master] = suave;
            ctx.fillStyle = gradiente;

            for (let i = 0; i < n; i += 1) {
                const x = i * paso + paso / 2;
                const proporcion = i / n;
                const base = Math.sin(t / 0.6 + i * 0.5) * 0.5 + 0.5;
                const ritmo = (Math.sin(t / 0.26 + i * 1.7) * 0.5 + 0.5) * produccion;
                const suavizado = 1 - mezcla * 0.65;
                let amplitud = (base * 0.55 + ritmo * 0.55) * (0.2 + grabacion * 0.85);
                amplitud = amplitud * suavizado + Math.sin(t / 0.9 + proporcion * 6) * 0.08 * mezcla + 0.04;
                const altura = Math.max(4, amplitud * alto * 0.8 * (0.6 + master * 0.5));
                const anchoBarra = Math.max(2, paso * 0.64);
                ctx.globalAlpha = 0.55 + master * 0.45;
                ctx.beginPath();
                trazarCapsula(ctx, x - anchoBarra / 2, centro - altura / 2, anchoBarra, altura);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(214,243,235,.25)';
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.moveTo(0, centro);
            ctx.lineTo(ancho, centro);
            ctx.stroke();
            ctx.setLineDash([]);
        };

        dibujarMezclaRef.current = dibujar;

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

        const alRedimensionar = () => {
            medir();
            if (reducir) dibujar(1200);
        };

        const observadorVista = new IntersectionObserver((entradas) => {
            visible = Boolean(entradas[0]?.isIntersecting);
            if (visible) iniciar();
            else detener();
        }, { threshold: 0 });
        observadorVista.observe(canvas);

        const observadorTamano = new ResizeObserver(alRedimensionar);
        observadorTamano.observe(canvas);

        const alVisibilidad = () => {
            activo = !document.hidden;
            if (activo) iniciar();
            else detener();
        };
        document.addEventListener('visibilitychange', alVisibilidad);
        window.addEventListener('resize', alRedimensionar);

        medir();
        if (reducir) dibujar(1200);
        else iniciar();

        return () => {
            detener();
            observadorVista.disconnect();
            observadorTamano.disconnect();
            document.removeEventListener('visibilitychange', alVisibilidad);
            window.removeEventListener('resize', alRedimensionar);
            dibujarMezclaRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) dibujarMezclaRef.current?.(1200);
    }, [faders]);

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) {
            setPasoActivo(pasos.length);
            return undefined;
        }
        const elemento = procesoRef.current;
        if (!elemento) return undefined;

        let intervalo: number | undefined;
        const observador = new IntersectionObserver(([entrada]) => {
            if (entrada.isIntersecting) {
                if (intervalo) return;
                setPasoActivo(0);
                intervalo = window.setInterval(() => {
                    setPasoActivo((actual) => (actual >= pasos.length ? -1 : actual + 1));
                }, 1900);
            } else if (intervalo) {
                window.clearInterval(intervalo);
                intervalo = undefined;
            }
        }, { threshold: 0.25 });
        observador.observe(elemento);

        return () => {
            observador.disconnect();
            if (intervalo) window.clearInterval(intervalo);
        };
    }, [pasos.length]);

    useLayoutEffect(() => {
        const landing = landingRef.current;
        if (!landing || MENOS_MOVIMIENTO()) return;

        const entrada = anime.timeline({ easing: 'easeOutQuart' })
            .add({ targets: landing.querySelector('[data-header]') as HTMLElement | null, opacity: [0, 1], translateY: [-10, 0], duration: 420 })
            .add({ targets: landing.querySelector('[data-hero-eyebrow]') as HTMLElement | null, opacity: [0, 1], translateY: [14, 0], duration: 500 }, '-=200')
            .add({ targets: landing.querySelector('[data-hero-title]') as HTMLElement | null, opacity: [0, 1], translateY: [24, 0], duration: 840 }, '-=360')
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

        return () => {
            entrada.pause();
            observador.disconnect();
        };
    }, []);

    return (
        <main
            ref={landingRef}
            className="min-h-screen overflow-x-hidden bg-bg text-texto"
            style={FUENTE_LANDING_BODY}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-soft-light"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
            />
            <div data-progreso aria-hidden="true" className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-secundario via-primario to-accent" />

            {error && (
                <div role="status" className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-texto/20 bg-bg/95 px-4 py-2 text-xs text-texto shadow-lg backdrop-blur">
                    No pudimos actualizar el contenido.{' '}
                    <button type="button" onClick={recargar} className="font-semibold underline underline-offset-2">
                        Reintentar
                    </button>
                </div>
            )}

            <header
                data-header
                style={oculto}
                className={`sticky top-0 z-30 border-b backdrop-blur transition-colors duration-300 ${compacto ? 'border-border bg-bg/95' : 'border-border/60 bg-bg/80'}`}
            >
                <div className={`mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 transition-[height] duration-300 lg:px-10 ${compacto ? 'h-14' : 'h-16'}`}>
                    <Link className="flex items-center gap-2.5" to="/" aria-label="Z-ONE inicio">
                        <span className="grid h-8 w-8 place-items-center rounded-md bg-primario text-sm font-black text-texto">Z</span>
                        <span className="text-base font-bold tracking-tight text-texto-soft" style={FUENTE_TITULO}>Z-ONE</span>
                    </Link>
                    <nav className="hidden items-center gap-8 text-sm font-medium text-sutil lg:flex" aria-label="Navegación principal">
                        {ENLACES_NAV.map((enlace) => (
                            <a key={enlace.href} className="group relative transition hover:text-texto-soft" href={enlace.href}>
                                {enlace.etiqueta}
                                <span aria-hidden="true" className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                            </a>
                        ))}
                    </nav>
                    <div className="hidden items-center gap-3 lg:flex">
                        {usuario ? (
                            <Link className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-surface/60 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-texto-soft transition duration-300 hover:border-accent/60 hover:bg-accent/10" to={RUTAS.MENU_PRINCIPAL}>
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-secundario text-xs font-black text-texto">{inicialesUsuario}</span>
                                Ir al panel
                            </Link>
                        ) : (
                            <Link className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition duration-300 hover:border-accent/60 hover:bg-accent/10 hover:text-accent" to={RUTAS.LOGIN}>
                                Acceder
                            </Link>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setMenuAbierto((v) => !v)}
                        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                        aria-expanded={menuAbierto}
                        className="grid h-10 w-10 place-items-center rounded-md border border-border text-texto-soft transition hover:border-accent/60 hover:text-accent lg:hidden"
                    >
                        {menuAbierto ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                    </button>
                </div>

                {menuAbierto && (
                    <div className="animate-rise border-t border-border bg-bg/95 px-6 py-5 backdrop-blur lg:hidden">
                        <nav className="flex flex-col gap-1" aria-label="Navegación móvil">
                            {ENLACES_NAV.map((enlace) => (
                                <a
                                    key={enlace.href}
                                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-sutil transition hover:bg-accent/10 hover:text-texto-soft"
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
                                    <span className="grid h-7 w-7 place-items-center rounded-full bg-secundario text-xs font-black text-texto">{inicialesUsuario}</span>
                                    Ir al panel
                                </Link>
                            ) : (
                                <Link className="block rounded-lg border border-border px-3 py-2.5 text-center text-sm font-semibold text-texto-soft transition hover:border-accent/60 hover:text-accent" to={RUTAS.LOGIN} onClick={() => setMenuAbierto(false)}>
                                    Acceder
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </header>

            <div className="landing-zone">
                <section
                    ref={heroRef}
                    className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden border-b border-texto/15 bg-bg"
                    aria-labelledby="hero-titulo"
                >
                    <span aria-hidden="true" className="pointer-events-none absolute -right-1/3 top-1/4 h-[60vw] w-[60vw] rounded-full bg-primario/10 blur-[120px]" />
                    <span aria-hidden="true" className="pointer-events-none absolute -left-1/4 bottom-0 h-[40vw] w-[40vw] rounded-full bg-accent/10 blur-[100px]" />

                    <DiscoVinilo
                        lado="SIDE A"
                        textoBorde="TU PRÓXIMO SONIDO ✦ EMPIEZA AQUÍ ✦ TU PRÓXIMO SONIDO ✦ EMPIEZA AQUÍ ✦ "
                        className="absolute z-0 opacity-55 lg:opacity-100"
                        style={{
                            width: 'min(100vw, 150svh)',
                            height: 'min(100vw, 150svh)',
                            top: '50%',
                            right: 0,
                            transform: 'translate(50%, -50%)',
                            ['--d']: 'min(100vw, 150svh)',
                        }}
                    />

                    <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col justify-center px-6 pb-[210px] pt-28 lg:px-10 lg:pt-32">
                        <p data-hero-eyebrow className="text-xs uppercase tracking-[0.1em] text-accent" style={FUENTE_LANDING_MONO}>
                            Estudio de grabación · Colombia
                        </p>

                        <h1
                            id="hero-titulo"
                            data-hero-title
                            aria-label="Tu próximo sonido empieza aquí."
                            className="mt-7 max-w-[15ch] text-[clamp(2.8rem,9vw,7.5rem)] font-bold leading-none tracking-[-0.03em] text-texto"
                            style={{ ...FUENTE_LANDING_HEAD, fontWeight: 700 }}
                        >
                            <span aria-hidden="true">Tu próximo </span>
                            <span
                                aria-hidden="true"
                                className="inline-block whitespace-nowrap border-b-[0.035em] border-accent text-accent transition-opacity duration-300"
                                style={{ opacity: palabraVisible ? 1 : 0 }}
                            >
                                {PALABRAS_HERO[indicePalabra]}
                            </span>
                            <span aria-hidden="true"> empieza aquí.</span>
                        </h1>

                        <p data-hero-text className="mt-8 max-w-[44ch] text-lg leading-relaxed text-texto/80" style={FUENTE_LANDING_BODY}>
                            Pide tu sesión, el equipo la aprueba y tú solo llegas a grabar.
                        </p>

                        <div data-hero-actions className="mt-9 flex flex-wrap gap-3.5">
                            <Link
                                className={BOTON_CTA}
                                to={destinoCta}
                                aria-label={usuario ? 'Ir al panel' : 'Crear cuenta para empezar a grabar'}
                            >
                                {usuario ? 'Ir al panel' : 'Crear cuenta'}
                            </Link>
                            <a className={BOTON_CTA_SECUNDARIO} href="#proceso">
                                Ver cómo funciona
                            </a>
                        </div>

                        <dl data-hero-stats className="mt-12 flex flex-wrap gap-x-10 gap-y-3 text-[13px] text-texto/60" style={FUENTE_LANDING_MONO}>
                            {[
                                { v: String(totalSalas).padStart(2, '0'), l: 'salas', n: totalSalas },
                                { v: String(totalServicios).padStart(2, '0'), l: 'servicios', n: totalServicios },
                                { v: config?.horario_estudio ?? 'Lun–Dom', l: 'horario' },
                            ].map((stat) => (
                                <div key={stat.l} className="flex items-center gap-2">
                                    <dt className="text-texto">
                                        {stat.n != null ? <Numero valor={stat.n} relleno /> : stat.v}
                                    </dt>
                                    <dd>{stat.l}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <canvas ref={heroCanvasRef} className="absolute inset-x-0 bottom-0 h-[200px] w-full" aria-hidden="true" />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg to-transparent" />
                </section>

                <div className="overflow-hidden border-y border-texto/15 bg-bg py-[22px]" aria-hidden="true">
                    <div className="flex w-max animate-marquee items-center whitespace-nowrap hover:[animation-play-state:paused] motion-reduce:animate-none" style={FUENTE_LANDING_HEAD}>
                        {[...BANDA_MARQUEE, ...BANDA_MARQUEE].map((elemento, indice) => (
                            <span
                                key={`${elemento}-${indice}`}
                                className="inline-flex items-center text-[clamp(1.5rem,3.6vw,2.6rem)] font-bold tracking-[-0.015em] text-texto"
                            >
                                {elemento}
                                <span className="mx-[0.6em] text-accent" aria-hidden="true">✦</span>
                            </span>
                        ))}
                    </div>
                </div>

                <section className="scroll-mt-24 border-b border-texto/15" id="proceso">
                    <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
                        <div data-revelar {...modificadorReveal(0)} className="max-w-[42ch]">
                            <Etiqueta>Cómo funciona</Etiqueta>
                            <h2 style={FUENTE_TITULO} className="mt-5 text-[clamp(2.1rem,5.2vw,4.4rem)] font-bold leading-[1.05] tracking-[-0.025em] text-texto-soft">
                                De la idea a la reserva en cinco pasos.
                            </h2>
                        </div>

                        <div ref={procesoRef} className="relative mt-14 border-t border-texto/20">
                            <span aria-hidden="true" className="absolute bottom-0 left-[21px] top-0 w-px bg-texto/10" />
                            {pasos.map((paso, indice) => {
                                const activo = indice === pasoActivo;
                                const hecho = indice < pasoActivo;
                                return (
                                    <div
                                        key={paso.id}
                                        className={`relative grid grid-cols-[56px_1fr] gap-5 border-b border-texto/20 py-7 transition-[opacity,background-color] duration-500 sm:grid-cols-[90px_1fr_1.2fr] sm:items-center ${activo ? 'bg-gradient-to-r from-primario/20 to-transparent opacity-100' : hecho ? 'opacity-80' : 'opacity-40'}`}
                                    >
                                        <span
                                            className={`relative z-10 grid h-11 w-11 place-items-center rounded-full border font-mono text-sm transition duration-500 ${activo ? 'animate-pulso border-primario bg-primario text-texto' : hecho ? 'border-primario bg-primario text-texto' : 'border-accent bg-bg text-accent'}`}
                                        >
                                            {String(indice + 1).padStart(2, '0')}
                                        </span>
                                        <h3 style={FUENTE_TITULO} className="text-[clamp(1.3rem,2.6vw,2rem)] font-bold leading-tight tracking-[-0.015em] text-texto-soft">
                                            {paso.titulo}
                                        </h3>
                                        <p className="col-start-2 text-sm leading-7 text-sutil sm:col-start-3">{paso.descripcion}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="scroll-mt-24 border-b border-texto/15" id="mezcla">
                    <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
                        <div data-revelar {...modificadorReveal(0)} className="max-w-[46ch]">
                            <Etiqueta>Juega con el sonido</Etiqueta>
                            <h2 style={FUENTE_TITULO} className="mt-5 text-[clamp(2.1rem,5.2vw,4.4rem)] font-bold leading-[1.05] tracking-[-0.025em] text-texto-soft">
                                Cuatro servicios. Una sola mezcla.
                            </h2>
                        </div>

                        <div data-revelar {...modificadorReveal(1)} className="mt-14 grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-stretch">
                            <div className="relative min-h-[340px] overflow-hidden rounded-3xl border border-border bg-surface">
                                <span className="absolute left-[18px] top-[14px] z-10 font-mono text-xs tracking-[0.12em] text-accent" style={FUENTE_LANDING_MONO}>
                                    SEÑAL · EN VIVO
                                </span>
                                <canvas ref={mezclaCanvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
                                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/35 to-transparent" />
                            </div>

                            <div className="grid grid-cols-4 gap-2.5 rounded-3xl border border-border bg-surface px-3.5 pb-4 pt-[22px]" role="group" aria-label="Mezcladora de ejemplo">
                                {SERVICIOS_MEZCLA.map((servicio, indice) => (
                                    <div key={servicio} className="flex flex-col items-center gap-3">
                                        <label htmlFor={`fader-${indice}`} className="min-h-[2.6em] text-center font-mono text-[0.65rem] uppercase leading-tight tracking-[0.06em] text-sutil">
                                            {servicio}
                                        </label>
                                        <input
                                            id={`fader-${indice}`}
                                            className="mezcla-fader"
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={faders[indice]}
                                            onChange={(evento) => {
                                                const valor = Number(evento.target.value);
                                                setFaders((actuales) => actuales.map((fader, i) => (i === indice ? valor : fader)));
                                            }}
                                            aria-label={`Volumen de ${servicio}`}
                                        />
                                        <output htmlFor={`fader-${indice}`} className="font-mono text-xs text-accent" style={FUENTE_LANDING_MONO}>
                                            {faders[indice]}
                                        </output>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p data-revelar {...modificadorReveal(2)} className="mt-[18px] font-mono text-xs text-sutil" style={FUENTE_LANDING_MONO}>
                            Es una demostración visual: mueve los faders y mira cómo cambia la onda.
                        </p>
                    </div>
                </section>

                <section className="scroll-mt-24 border-b border-texto/15 bg-bg-2" id="servicios">
                    <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
                        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                            <div data-revelar {...modificadorReveal(0)} className="max-w-[46ch]">
                                <Etiqueta>Servicios</Etiqueta>
                                <h2 style={FUENTE_TITULO} className="mt-5 max-w-[20ch] text-[clamp(2.1rem,5.2vw,4.4rem)] font-bold leading-[1.05] tracking-[-0.025em] text-texto-soft">
                                    Lo que pasa dentro del estudio.
                                </h2>
                            </div>
                            <p className="max-w-[36ch] text-sm leading-7 text-sutil">
                                Desde una primera toma hasta el máster final, cada etapa está pensada para tu proyecto.
                            </p>
                        </div>

                        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {servicios.map((servicio, indice) => {
                                const Icono = ICONO[servicio.icono] ?? Mic;
                                const numero = String(indice + 1).padStart(2, '0');
                                return (
                                    <article
                                        key={servicio.id}
                                        data-revelar
                                        {...modificadorReveal(indice)}
                                        className="group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-7 transition duration-500 hover:-translate-y-1.5 hover:border-accent/50 hover:bg-surface-2"
                                    >
                                        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-accent to-transparent transition-transform duration-500 group-hover:scale-x-100" />
                                        <div className="relative flex items-center justify-between">
                                            <span className="grid h-12 w-12 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent transition-transform duration-500 group-hover:scale-105">
                                                <Icono aria-hidden="true" className="h-5 w-5" />
                                            </span>
                                            <span className="font-mono text-sm font-black leading-none text-accent" style={FUENTE_LANDING_MONO}>{numero}</span>
                                        </div>
                                        <div className="relative mt-8">
                                            <h3 style={FUENTE_TITULO} className="text-[clamp(1.4rem,2.6vw,1.8rem)] font-bold leading-[1.1] tracking-[-0.02em] text-texto-soft">
                                                {servicio.titulo}
                                            </h3>
                                            <p className="mt-3 text-sm leading-6 text-sutil">{servicio.descripcion}</p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="scroll-mt-24 border-b border-texto/15" id="espacios">
                    <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
                        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                            <div data-revelar {...modificadorReveal(0)}>
                                <Etiqueta>Espacios</Etiqueta>
                                <h2 style={FUENTE_TITULO} className="mt-5 text-[clamp(2.1rem,5.2vw,4.4rem)] font-bold leading-[1.05] tracking-[-0.025em] text-texto-soft">
                                    Elige dónde trabajar.
                                </h2>
                            </div>
                            <p className="max-w-[36ch] text-sm leading-7 text-sutil">
                                Cabinas para grabar, salas para mezclar y producir. Todas disponibles por hora.
                            </p>
                        </div>

                        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {salas.map((sala, index) => (
                                <article
                                    key={sala.id ?? sala.nombre}
                                    data-revelar
                                    {...modificadorReveal(index)}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition duration-500 hover:-translate-y-1.5 hover:border-accent/50 hover:shadow-[0_36px_70px_-28px_rgba(0,0,0,0.95)]"
                                >
                                    <span aria-hidden="true" className="absolute inset-x-0 top-0 z-10 h-px origin-left scale-x-0 bg-gradient-to-r from-accent to-accent-soft transition-transform duration-500 group-hover:scale-x-100" />
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img
                                            src={sala.imagenUrl ? urlImagen(sala.imagenUrl) : IMAGENES_SALA_FALLBACK[index % IMAGENES_SALA_FALLBACK.length]}
                                            alt={`${sala.nombre} del estudio Z-ONE`}
                                            loading="lazy"
                                            onError={(evento) => {
                                                const imagen = evento.currentTarget;
                                                if (imagen.dataset.fallback === '1') return;
                                                imagen.dataset.fallback = '1';
                                                imagen.src = IMAGENES_SALA_FALLBACK[index % IMAGENES_SALA_FALLBACK.length];
                                            }}
                                            className="h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.08] group-hover:brightness-110"
                                        />
                                        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-white/10 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[520%]" />
                                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/10 to-transparent" />
                                        <span className="absolute left-4 top-4 rounded-md border border-white/10 bg-bg/70 px-2 py-1 font-mono text-[0.65rem] tracking-[0.2em] text-texto/85 backdrop-blur-sm transition-colors duration-500 group-hover:border-accent/40 group-hover:text-accent">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        <div className="absolute bottom-4 right-4 flex h-5 items-end gap-0.5 opacity-0 transition-all duration-500 group-hover:opacity-100">
                                            {BARRAS_SALON.map((altura, i) => (
                                                <i
                                                    key={i}
                                                    className="w-[3px] origin-bottom rounded-full bg-gradient-to-t from-accent to-accent-soft [animation:ecu_1.1s_ease-in-out_infinite]"
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
                                        <strong style={FUENTE_TITULO} className="text-base font-bold text-texto-soft transition-colors duration-300 group-hover:text-accent">{formatearMoneda(sala.precioHora)}</strong>
                                    </div>
                                    <Link className="mt-4 flex items-center justify-between border-t border-border px-5 py-3.5 text-sm font-semibold text-texto-soft transition duration-300 group-hover:bg-accent/5 group-hover:text-accent" to={destinoReserva}>
                                        Reservar
                                        <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full border border-border transition duration-300 group-hover:translate-x-1 group-hover:border-accent/50">→</span>
                                    </Link>
                                </article>
                            ))}
                            {salas.length === 0 && <p className="text-sutil">Pronto anunciaremos los espacios disponibles.</p>}
                        </div>
                    </div>
                </section>

                {(metricas.length > 0 || testimonios.length > 0) && (
                <section className="scroll-mt-24 border-b border-texto/15" id="testimonios">
                    <div className="mx-auto max-w-[1280px] px-6 py-24 lg:px-10">
                        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                            <div data-revelar {...modificadorReveal(0)} className="max-w-[40ch]">
                                <Etiqueta>Lo que dicen</Etiqueta>
                                <h2 style={FUENTE_TITULO} className="mt-5 text-[clamp(2.1rem,5.2vw,4.4rem)] font-bold leading-[1.05] tracking-[-0.025em] text-texto-soft">
                                    Voces que confían en Z-ONE.
                                </h2>
                            </div>
                            <p className="max-w-[36ch] text-sm leading-7 text-sutil">
                                Artistas y proyectos que ya pasaron por el estudio.
                            </p>
                        </div>

                        {metricas.length > 0 && (
                            <div data-revelar {...modificadorReveal(1)} className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
                                {metricas.map((metrica) => (
                                    <div key={metrica.id} className="bg-bg p-6 text-center">
                                        <p style={FUENTE_TITULO} className="text-4xl font-black tracking-tight text-texto-soft">
                                            <Numero valor={metrica.valor} />
                                            <span className="text-accent">{metrica.sufijo}</span>
                                        </p>
                                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-sutil">{metrica.etiqueta}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 grid gap-5 lg:grid-cols-3">
                            {testimonios.map((testimonio, indice) => (
                                <article
                                    key={testimonio.id}
                                    data-revelar
                                    {...modificadorReveal(indice)}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-7 transition duration-500 hover:-translate-y-1.5 hover:border-accent/50"
                                >
                                    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-accent to-transparent transition-transform duration-500 group-hover:scale-x-100" />
                                    <Quote className="h-7 w-7 text-accent/60" aria-hidden="true" />
                                    <div className="mt-4 flex gap-0.5" aria-label={`${testimonio.calificacion} de 5 estrellas`}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} className={`h-3.5 w-3.5 ${i < testimonio.calificacion ? 'fill-accent text-accent' : 'text-border'}`} aria-hidden="true" />
                                        ))}
                                    </div>
                                    <p className="mt-4 flex-1 text-sm leading-7 text-sutil">{testimonio.texto}</p>
                                    <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                                        {testimonio.imagenUrl ? (
                                            <img
                                                src={urlImagen(testimonio.imagenUrl)}
                                                alt={testimonio.nombre}
                                                loading="lazy"
                                                className="h-10 w-10 shrink-0 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secundario text-sm font-black text-texto">
                                                {testimonio.nombre.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0] ?? '').join('').toLocaleUpperCase()}
                                            </span>
                                        )}
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

                <section id="contacto" className="relative flex min-h-[115svh] flex-col items-center overflow-hidden border-t border-border/60 bg-bg pt-[clamp(70px,12vh,130px)] text-center">
                    <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 h-[70%] w-[90%] -translate-x-1/2 rounded-full bg-primario/20 blur-[130px]" />
                    <DiscoVinilo
                        conBrazo
                        lado="SIDE B"
                        textoBorde="HAGAMOS RUIDO ✦ Z·ONE ✦ ESTUDIO DE GRABACIÓN ✦ HAGAMOS RUIDO ✦ Z·ONE ✦ ESTUDIO DE GRABACIÓN ✦ "
                        opacidadBorde={0.2}
                        className="absolute z-0"
                        style={{
                            width: 'min(125vw, 132svh)',
                            height: 'min(125vw, 132svh)',
                            left: '50%',
                            bottom: 'calc(min(125vw, 132svh) * -0.42)',
                            transform: 'translateX(-50%)',
                            ['--d']: 'min(125vw, 132svh)',
                        }}
                    />
                    <div data-revelar {...modificadorReveal(0)} className="relative z-10 flex flex-col items-center px-6">
                        <Etiqueta className="justify-center">¿Listo para grabar?</Etiqueta>
                        <h2 style={FUENTE_TITULO} className="mb-8 mt-6 max-w-[12ch] text-[clamp(2.8rem,8vw,7rem)] font-bold leading-[0.95] tracking-[-0.03em] text-texto">
                            Hagamos <span className="text-accent">ruido.</span>
                        </h2>
                        <Link className={BOTON_CTA} to={destinoCta}>
                            {usuario ? 'Ir al panel' : 'Crear cuenta'}
                        </Link>
                    </div>
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[90px] bg-gradient-to-t from-bg to-transparent" />
                </section>
            </div>

            <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
                {mostrarArriba && (
                    <button
                        type="button"
                        onClick={() => window.scrollTo({ top: 0, behavior: MENOS_MOVIMIENTO() ? 'auto' : 'smooth' })}
                        aria-label="Volver arriba"
                        className="grid h-11 w-11 animate-rise place-items-center rounded-full border border-border bg-bg/90 text-texto-soft shadow-lg shadow-black/40 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-accent/60 hover:text-accent"
                    >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                )}
                <a
                    href="#contacto"
                    aria-label="Contactar con Z-ONE"
                    className="group inline-flex items-center gap-2 rounded-full bg-primario px-5 py-3 text-sm font-bold text-texto shadow-lg shadow-primario/30 transition duration-300 hover:-translate-y-0.5 hover:bg-texto hover:text-bg"
                >
                    <MessageCircle className="h-4 w-4 transition group-hover:scale-110" aria-hidden="true" />
                    <span className="hidden sm:inline">Hablemos</span>
                </a>
            </div>

            <footer className="border-t border-border/60 bg-bg">
                <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-5 px-6 py-10 sm:flex-row sm:items-center lg:px-10">
                    <Link className="flex items-center gap-2.5" to="/" aria-label="Z-ONE inicio">
                        <span className="grid h-7 w-7 place-items-center rounded-md bg-primario text-xs font-black text-texto">Z</span>
                        <span className="text-sm font-bold tracking-tight text-texto-soft" style={FUENTE_TITULO}>Z-ONE</span>
                    </Link>
                    <p className="text-sm text-sutil">Z-One · Estudio de grabación</p>
                    <Link className="text-sm text-sutil transition hover:text-texto-soft" to={RUTAS.LOGIN}>Acceso de usuarios</Link>
                </div>
            </footer>
        </main>
    );
}
