// CAPA: Presentación
import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { Link } from 'react-router-dom';
import { Music, Radio, Sparkles } from 'lucide-react';
import { RUTAS } from '../config/rutas.js';
import { salaRepo } from '../repositories/salaRepo.js';
import { formatearMoneda } from '../utils/helpers.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const BOTON_PRIMARIO =
    'inline-flex min-h-[54px] min-w-[156px] items-center justify-center rounded-xl bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-6 text-sm font-extrabold tracking-wide text-white shadow-lg shadow-accent/25 transition duration-200 hover:-translate-y-0.5 hover:brightness-110';
const BOTON_SECUNDARIO =
    'inline-flex min-h-[54px] min-w-[156px] items-center justify-center rounded-xl border border-white/25 px-6 text-sm font-extrabold tracking-wide text-texto-soft transition duration-200 hover:-translate-y-0.5 hover:border-magenta/60 hover:bg-magenta/10';

const ART_SALON = [
    'radial-gradient(ellipse at 50% 50%, rgba(240, 79, 166, 0.42), transparent 56%), linear-gradient(145deg, #38313d, #14111d 78%)',
    'radial-gradient(ellipse at 50% 50%, rgba(158, 203, 255, 0.4), transparent 56%), linear-gradient(145deg, #28383c, #14111d 78%)',
    'radial-gradient(ellipse at 50% 50%, rgba(135, 87, 198, 0.44), transparent 56%), linear-gradient(145deg, #342b40, #14111d 78%)',
];
const ICONO_SALON = [Radio, Music, Sparkles];

const EQUALIZER = [54, 35, 82, 100, 35, 82, 54, 35, 82, 35, 54, 100, 35];

const modificadorReveal = (indice) => ({ 'data-revelar-delay': String(indice * 70) });

export default function LandingPage() {
    const landingRef = useRef(null);
    const discoRef = useRef(null);
    const [girando, setGirando] = useState(false);
    const salas = salaRepo.listar().filter((sala) => sala.activo !== false);

    useEffect(() => {
        document.documentElement.style.scrollBehavior = 'smooth';
        return () => { document.documentElement.style.scrollBehavior = ''; };
    }, []);

    useEffect(() => {
        const landing = landingRef.current;
        if (!landing || MENOS_MOVIMIENTO()) return undefined;

        const entrada = anime.timeline({ easing: 'easeOutCubic' })
            .add({ targets: landing.querySelector('[data-header]'), opacity: [0, 1], translateY: [-12, 0], duration: 520 })
            .add({ targets: landing.querySelectorAll('[data-hero-copy] > *'), opacity: [0, 1], translateY: [22, 0], delay: anime.stagger(95), duration: 620 }, '-=260')
            .add({ targets: landing.querySelector('[data-hero-art]'), opacity: [0, 1], translateX: [28, 0], duration: 850 }, '-=800');

        const reveleables = landing.querySelectorAll('[data-revelar]');
        const observador = new IntersectionObserver((entradas, observer) => {
            entradas.forEach((entradaVisible) => {
                if (!entradaVisible.isIntersecting) return;
                anime({
                    targets: entradaVisible.target,
                    opacity: [0, 1],
                    translateY: [22, 0],
                    duration: 620,
                    delay: Number(entradaVisible.target.dataset.revelarDelay || 0),
                    easing: 'easeOutCubic',
                });
                observer.unobserve(entradaVisible.target);
            });
        }, { threshold: 0.15 });
        reveleables.forEach((elemento) => observador.observe(elemento));

        const ecualizador = anime({
            targets: landing.querySelectorAll('[data-eq]'),
            scaleY: [0.35, 1],
            opacity: [0.45, 1],
            delay: anime.stagger(75),
            duration: 460,
            direction: 'alternate',
            easing: 'easeInOutSine',
            loop: true,
        });
        const luz = anime({
            targets: landing.querySelector('[data-glow]'),
            scale: [0.88, 1.12],
            opacity: [0.55, 1],
            duration: 2400,
            direction: 'alternate',
            easing: 'easeInOutSine',
            loop: true,
        });

        const preguntas = landing.querySelectorAll('details[data-faq]');
        const animarRespuesta = (event) => {
            if (!event.currentTarget.open) return;
            anime({ targets: event.currentTarget.querySelector('p'), opacity: [0, 1], translateY: [-8, 0], duration: 320, easing: 'easeOutCubic' });
        };
        preguntas.forEach((pregunta) => pregunta.addEventListener('toggle', animarRespuesta));

        return () => {
            entrada.pause();
            ecualizador.pause();
            luz.pause();
            observador.disconnect();
            preguntas.forEach((pregunta) => {
                pregunta.removeEventListener('toggle', animarRespuesta);
                anime.remove(pregunta.querySelector('p'));
            });
        };
    }, []);

    useEffect(() => {
        const disco = discoRef.current;
        if (!disco) return undefined;
        anime.remove(disco);
        if (MENOS_MOVIMIENTO()) return undefined;
        anime({
            targets: disco,
            rotate: girando ? '345deg' : '-15deg',
            duration: girando ? 2800 : 420,
            easing: girando ? 'linear' : 'easeOutCubic',
            loop: girando,
        });
        return () => anime.remove(disco);
    }, [girando]);

    return (
        <main ref={landingRef} className="min-h-screen overflow-hidden bg-bg text-texto">
            <header data-header className="sticky top-0 z-30 grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border/60 bg-bg/80 px-6 py-4 backdrop-blur lg:grid-cols-[auto_1fr_auto] lg:px-14">
                <Link className="text-xl font-black tracking-[-0.075em] text-texto-soft" to="/" aria-label="Z-ONE inicio">
                    <span className="text-magenta">Z</span>-ONE
                </Link>
                <nav className="hidden items-center justify-center gap-9 text-sm font-semibold text-texto/90 lg:flex" aria-label="Navegación principal">
                    <a className="transition hover:text-magenta" href="#servicios">Servicios</a>
                    <a className="transition hover:text-magenta" href="#espacios">Espacios</a>
                    <a className="transition hover:text-magenta" href="#proceso">Cómo funciona</a>
                    <a className="transition hover:text-magenta" href="#preguntas">Preguntas</a>
                    <a className="transition hover:text-magenta" href="#contacto">Contacto</a>
                </nav>
                <Link className="justify-self-end rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-texto transition hover:border-magenta/60 hover:text-magenta" to={RUTAS.LOGIN}>
                    Iniciar sesión
                </Link>
            </header>

            <section className="relative grid items-stretch overflow-hidden lg:grid-cols-[1.05fr_0.95fr]" aria-labelledby="landing-title">
                <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-72 w-72 animate-aurora rounded-full bg-[#9365f2]/20 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 animate-aurora rounded-full bg-[#e34ba6]/15 blur-3xl [animation-delay:-7s]" />

                <div data-hero-copy className="relative z-10 flex flex-col items-start justify-center px-6 py-16 sm:px-12 lg:px-16 lg:py-24 xl:px-24">
                    <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-magenta">Tu sonido, en su mejor versión</p>
                    <h1 id="landing-title" className="mt-5 max-w-[670px] text-5xl font-extrabold leading-[0.99] tracking-[-0.05em] text-texto-soft sm:text-6xl xl:text-7xl">
                        Dale forma a tu próximo sonido.
                    </h1>
                    <p className="mt-6 max-w-[490px] text-base leading-7 text-sutil sm:text-lg">
                        Un espacio para grabar, producir y llevar tus ideas musicales desde la primera nota hasta el resultado final.
                    </p>
                    <div className="mt-9 flex flex-wrap gap-3">
                        <Link className={BOTON_PRIMARIO} to={`${RUTAS.SESIONES}#crear`}>Crear sesión</Link>
                        <Link className={BOTON_SECUNDARIO} to={RUTAS.LOGIN}>Iniciar sesión</Link>
                    </div>
                    <a className="group mt-7 inline-flex items-center gap-3 text-sm font-bold text-texto/90" href="#servicios">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-texto-soft text-lg text-bg transition group-hover:translate-y-1" aria-hidden="true">↓</span>
                        Conoce Z-ONE
                    </a>
                </div>

                <section data-hero-art className="relative isolate grid min-h-[420px] place-items-center overflow-hidden border-t border-border/50 lg:border-l lg:border-t-0" aria-label="Ilustración de un estudio de grabación">
                    <div aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(14,14,18,0.1), rgba(12,12,15,0.72)), radial-gradient(ellipse at 49% 44%, #4a4552 0%, #242229 39%, #141119 79%)' }} />
                    <div aria-hidden="true" className="absolute -top-[25%] right-[3%] h-[150%] w-[77%] rotate-[24deg] rounded-full border border-white/10" />
                    <div aria-hidden="true" className="absolute -bottom-[34%] right-[9%] h-[70%] w-[84%] rounded-full bg-[#e34ba6]/15 blur-3xl" />
                    <div data-glow aria-hidden="true" className="absolute right-[13%] top-[9%] h-44 w-44 rounded-full bg-[#e24aa1]/20 blur-3xl" />

                    <button
                        className="absolute right-4 top-4 z-10 inline-flex min-h-[38px] items-center gap-2 rounded-full border border-white/20 bg-bg/60 px-3 py-2 text-xs font-bold text-texto backdrop-blur transition hover:border-magenta/60 hover:bg-magenta/20 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => setGirando((estado) => !estado)}
                        aria-label={girando ? 'Detener animación del disco' : 'Girar disco'}
                        aria-pressed={girando}
                        disabled={MENOS_MOVIMIENTO()}
                        type="button"
                    >
                        <span aria-hidden="true">{girando ? 'Ⅱ' : '▶'}</span>
                        {girando ? 'Detener animación' : 'Animar disco'}
                    </button>

                    <div
                        ref={discoRef}
                        className="relative grid aspect-square w-[clamp(235px,30vw,410px)] place-items-center rounded-full border border-white/15 shadow-[0_25px_90px_rgba(0,0,0,0.58)]"
                        style={{ background: 'repeating-radial-gradient(circle, #29282d 0 2px, #36343a 3px 4px, #252429 5px 7px), #302f35' }}
                    >
                        <span aria-hidden="true" className="absolute inset-[10%] rounded-full border border-white/[0.08]" />
                        <div className="grid aspect-square w-[31%] place-items-center rounded-full border-[8px] border-[#27252b] bg-gradient-to-br from-[#db479b] to-[#8657c6] shadow-lg" style={{ transform: 'rotate(15deg)' }}>
                            <span className="text-[clamp(1.6rem,4vw,3rem)] font-black leading-none text-white">Z</span>
                            <small className="mt-1 text-[clamp(0.42rem,0.7vw,0.6rem)] font-extrabold tracking-[0.12em] text-white">ONE STUDIO</small>
                        </div>
                    </div>

                    <div className="absolute bottom-[21%] right-[8%] flex h-16 items-center gap-1.5 opacity-70" aria-hidden="true">
                        {EQUALIZER.map((altura, indice) => (
                            <i key={indice} data-eq className="w-[3px] origin-bottom rounded bg-gradient-to-t from-[#8281b5] to-[#eb72b8]" style={{ height: `${altura}%` }} />
                        ))}
                    </div>
                    <div className="absolute inset-x-[8%] bottom-[8%] flex justify-between gap-4 text-[0.62rem] font-bold tracking-[0.14em] text-white/60">
                        <span>GRABA · PRODUCE · CREA</span>
                        <span>ESTUDIO Z-ONE</span>
                    </div>
                </section>
            </section>

            <div className="flex overflow-hidden border-y border-border/60 bg-surface/50 py-4">
                <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10" aria-hidden="true">
                    {Array.from({ length: 2 }).map((_, bloque) => (
                        <div key={bloque} className="flex shrink-0 items-center gap-10">
                            {['Grabación', 'Mezcla', 'Masterización', 'Producción', 'Ensayos', 'Audiovisual'].map((palabra) => (
                                <span key={`${bloque}-${palabra}`} className="flex items-center gap-10 text-sm font-extrabold uppercase tracking-[0.22em] text-sutil">
                                    {palabra}
                                    <span className="text-magenta">✦</span>
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <section className="grid gap-10 bg-surface/30 px-6 py-20 sm:px-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-16 xl:px-24" id="servicios">
                <div data-revelar {...modificadorReveal(0)}>
                    <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-magenta">Todo empieza con una idea</p>
                    <h2 className="mt-4 max-w-[400px] text-3xl font-extrabold tracking-[-0.04em] text-texto-soft sm:text-4xl">Tu música merece un buen lugar para crecer.</h2>
                    <p className="mt-5 max-w-[410px] text-sm leading-7 text-sutil">
                        Desde una primera grabación hasta la producción de un proyecto completo, encuentra en Z-ONE el espacio para hacerlo realidad.
                    </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-3">
                    {[
                        { n: '01', t: 'Graba', d: 'Prepara una sesión de grabación, define cuándo quieres trabajar y selecciona la cabina que se ajuste a tu proyecto.', s: 'Ideal para voces, instrumentos y nuevas ideas.' },
                        { n: '02', t: 'Produce', d: 'Organiza sesiones de producción musical, mezcla o masterización con fecha, duración y responsable definidos.', s: 'Planifica cada etapa desde la misma agenda.' },
                        { n: '03', t: 'Avanza', d: 'Registra tus sesiones y consulta los datos principales para mantener más claro el trabajo pendiente.', s: 'Una vista sencilla de tu actividad.' },
                    ].map((servicio, indice) => (
                        <article key={servicio.n} data-revelar {...modificadorReveal(indice + 1)} className="rounded-2xl border border-border/70 bg-surface/60 p-5 transition duration-200 hover:-translate-y-1 hover:border-magenta/40">
                            <span className="text-xs font-extrabold text-magenta">{servicio.n}</span>
                            <h3 className="mt-4 text-lg font-bold text-texto-soft">{servicio.t}</h3>
                            <p className="mt-2 text-sm leading-6 text-sutil">{servicio.d}</p>
                            <small className="mt-3 block text-xs font-semibold text-accent-soft">{servicio.s}</small>
                        </article>
                    ))}
                </div>
            </section>

            <section className="px-6 py-20 sm:px-12 lg:px-16 xl:px-24" id="espacios">
                <div className="mb-9 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
                    <div data-revelar {...modificadorReveal(0)}>
                        <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-magenta">Elige tu espacio</p>
                        <h2 className="mt-3 max-w-[600px] text-3xl font-extrabold tracking-[-0.04em] text-texto-soft sm:text-4xl">Un lugar para cada parte de tu sonido.</h2>
                    </div>
                    <p className="max-w-[330px] text-sm leading-6 text-sutil">Consulta las salas disponibles y elige la que mejor acompañe tu sesión.</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {salas.map((sala, index) => {
                        const Icono = ICONO_SALON[index % ICONO_SALON.length];
                        return (
                            <article key={sala.id ?? sala.nombre} data-revelar className="group overflow-hidden rounded-2xl border border-white/10 bg-surface/60 transition duration-200 hover:-translate-y-1 hover:border-magenta/45">
                                <div className="relative grid min-h-[175px] place-items-center overflow-hidden" style={{ background: ART_SALON[index % ART_SALON.length] }}>
                                    <span aria-hidden="true" className="absolute inset-[15%_28%] rotate-[-25deg] rounded-full border border-white/10" />
                                    <span aria-hidden="true" className="absolute inset-[7%_36%] rotate-[25deg] rounded-full border border-white/10" />
                                    <span className="absolute left-4 top-4 text-[0.62rem] font-bold tracking-[0.15em] text-white/60">{String(index + 1).padStart(2, '0')}</span>
                                    <span className="absolute bottom-3.5 right-4 text-[0.62rem] font-bold tracking-[0.15em] text-white/60">Z-ONE STUDIO</span>
                                    <span className="grid h-16 w-16 place-items-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur transition duration-300 group-hover:scale-110 group-hover:shadow-[0_0_24px_rgba(237,79,169,0.35)]">
                                        <Icono className="h-6 w-6" aria-hidden="true" />
                                    </span>
                                </div>
                                <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
                                    <div>
                                        <h3 className="text-base font-bold text-texto-soft">{sala.nombre}</h3>
                                        <p className="text-xs text-sutil">Disponible para reservar</p>
                                    </div>
                                    <strong className="shrink-0 text-right text-sm text-texto-soft">
                                        {formatearMoneda(sala.precio_hora)}<small className="mt-0.5 block text-[0.68rem] font-medium text-sutil">/ hora</small>
                                    </strong>
                                </div>
                                <Link className="mx-4 mt-0 flex items-center justify-between border-t border-white/10 py-3.5 text-sm font-bold text-[#e685c2] transition hover:text-[#ffc0e5]" to={`${RUTAS.SESIONES}#crear`}>
                                    Reservar este espacio <span aria-hidden="true">→</span>
                                </Link>
                            </article>
                        );
                    })}
                    {salas.length === 0 && <p className="text-sutil">Pronto anunciaremos los espacios disponibles.</p>}
                </div>
            </section>

            <section className="relative overflow-hidden bg-gradient-to-br from-[#1b1430] via-[#161022] to-[#120d1b] px-6 py-20 sm:px-12 lg:px-16 xl:px-24" id="proceso">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 top-0 h-72 w-72 animate-aurora rounded-full bg-[#e34ba6]/15 blur-3xl" />
                <div className="relative mb-9 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
                    <div data-revelar {...modificadorReveal(0)}>
                        <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-magenta">Así de fácil</p>
                        <h2 className="mt-3 max-w-[600px] text-3xl font-extrabold tracking-[-0.04em] text-texto-soft sm:text-4xl">Tu próxima sesión empieza aquí.</h2>
                    </div>
                    <Link className={`${BOTON_PRIMARIO} shrink-0`} to={`${RUTAS.SESIONES}#crear`}>Comenzar una reserva →</Link>
                </div>
                <div className="grid gap-6 sm:grid-cols-3">
                    {[
                        { n: '01', t: 'Elige el espacio', d: 'Revisa las salas y escoge la que necesitas.' },
                        { n: '02', t: 'Programa tu sesión', d: 'Selecciona fecha, hora y tipo de trabajo.' },
                        { n: '03', t: 'Haz que suceda', d: 'Consulta tus sesiones desde el área de gestión.' },
                    ].map((paso, indice) => (
                        <article key={paso.n} data-revelar {...modificadorReveal(indice)} className="flex items-start gap-4 border-t border-white/10 pt-5">
                            <span className="text-sm font-black text-magenta">{paso.n}</span>
                            <div>
                                <h3 className="text-base font-bold text-texto-soft">{paso.t}</h3>
                                <p className="mt-1.5 text-sm leading-6 text-sutil">{paso.d}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="grid gap-10 bg-surface/30 px-6 py-20 sm:px-12 lg:grid-cols-[0.75fr_1.25fr] lg:px-16 xl:px-24" id="preguntas">
                <div data-revelar {...modificadorReveal(0)}>
                    <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-magenta">Antes de empezar</p>
                    <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-texto-soft sm:text-4xl">Preguntas frecuentes</h2>
                    <p className="mt-4 text-sm leading-6 text-sutil">Información práctica para preparar tu sesión en Z-ONE.</p>
                </div>
                <div className="border-t border-white/15">
                    {[
                        { p: '¿Qué tipos de sesión puedo registrar?', r: 'Puedes elegir grabación, mezcla, masterización, ensayo o producción musical al crear una sesión.' },
                        { p: '¿Qué información necesito para crearla?', r: 'Selecciona una fecha, hora de inicio, duración, cabina y artista o productor. El nombre de la sesión es opcional.' },
                        { p: '¿Necesito iniciar sesión para crear una reserva?', r: 'Sí. Selecciona «Crear sesión» y, si todavía no has iniciado sesión, la página te llevará al acceso. Después podrás continuar con el formulario.' },
                        { p: '¿La reserva queda confirmada automáticamente?', r: 'En esta versión, la sesión se guarda en el navegador y queda con el estado que selecciones. La aplicación todavía no está conectada a un servicio que confirme disponibilidad o envíe la solicitud al estudio.' },
                    ].map((faq, indice) => (
                        <details key={faq.p} data-faq data-revelar {...modificadorReveal(indice)} className="group border-b border-white/15">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-bold leading-6 text-texto-soft [&::-webkit-details-marker]:hidden">
                                {faq.p}
                                <span className="text-xl font-normal text-[#e685c2] transition group-open:rotate-45" aria-hidden="true">+</span>
                            </summary>
                            <p className="max-w-[660px] pb-5 pr-7 text-sm leading-7 text-sutil">{faq.r}</p>
                        </details>
                    ))}
                </div>
            </section>

            <section className="relative overflow-hidden px-6 py-16 sm:px-12 lg:px-16 xl:px-24" style={{ background: 'radial-gradient(ellipse at 85% 50%, rgba(221,71,155,0.22), transparent 36%), #1c1826' }}>
                <div className="relative flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
                    <div data-revelar {...modificadorReveal(0)}>
                        <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-magenta">¿Listo para empezar?</p>
                        <h2 className="mt-3 max-w-[520px] text-3xl font-extrabold tracking-[-0.04em] text-texto-soft sm:text-4xl">La próxima gran idea puede ser la tuya.</h2>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link className={BOTON_PRIMARIO} to={`${RUTAS.SESIONES}#crear`}>Crear sesión</Link>
                        <Link className={BOTON_SECUNDARIO} to={RUTAS.LOGIN}>Iniciar sesión</Link>
                    </div>
                </div>
            </section>

            <footer className="flex flex-col items-start justify-between gap-4 border-t border-border/60 bg-bg px-6 py-6 sm:flex-row sm:items-center lg:px-14" id="contacto">
                <Link className="text-xl font-black tracking-[-0.075em] text-texto-soft" to="/" aria-label="Z-ONE inicio">
                    <span className="text-magenta">Z</span>-ONE
                </Link>
                <p className="text-sm text-sutil">Un espacio para hacer que la música suceda.</p>
                <Link className="text-sm text-sutil transition hover:text-magenta" to={RUTAS.LOGIN}>Acceso de usuarios</Link>
            </footer>
        </main>
    );
}
