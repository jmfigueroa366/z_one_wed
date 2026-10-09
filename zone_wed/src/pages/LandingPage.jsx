// CAPA: Presentación
import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { Link } from 'react-router-dom';
import { RUTAS } from '../config/rutas.js';
import { salaRepo } from '../repositories/salaRepo.js';
import { formatearMoneda } from '../utils/helpers.js';
import '../styles/landing.css';

export default function LandingPage() {
    const landingRef = useRef(null);
    const discoRef = useRef(null);
    const [girando, setGirando] = useState(false);
    const salas = salaRepo.listar().filter((sala) => sala.activo !== false);

    useEffect(() => {
        const landing = landingRef.current;
        if (!landing || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        const entrada = anime.timeline({ easing: 'easeOutCubic' })
            .add({
                targets: landing.querySelector('.landing-header'),
                opacity: [0, 1],
                translateY: [-12, 0],
                duration: 520,
            })
            .add({
                targets: landing.querySelectorAll('.landing-copy > *'),
                opacity: [0, 1],
                translateY: [22, 0],
                delay: anime.stagger(95),
                duration: 620,
            }, '-=260')
            .add({
                targets: landing.querySelector('.landing-art'),
                opacity: [0, 1],
                translateX: [28, 0],
                duration: 850,
            }, '-=800');

        const elementosRevelables = landing.querySelectorAll(
            '.landing-services > div:first-child, .landing-service-list article, .landing-section-heading, .landing-space-card, .landing-process-grid article, .landing-faq-heading, .landing-faq-list details, .landing-final-cta'
        );
        const preguntasFrecuentes = landing.querySelectorAll('.landing-faq-list details');
        const animarRespuestaFAQ = (event) => {
            if (!event.currentTarget.open) return;
            anime({
                targets: event.currentTarget.querySelector('p'),
                opacity: [0, 1],
                translateY: [-8, 0],
                duration: 320,
                easing: 'easeOutCubic',
            });
        };
        preguntasFrecuentes.forEach((pregunta) => pregunta.addEventListener('toggle', animarRespuestaFAQ));

        const observador = new IntersectionObserver((entradas, observer) => {
            entradas.forEach((entradaVisible) => {
                if (!entradaVisible.isIntersecting) return;
                anime({
                    targets: entradaVisible.target,
                    opacity: [0, 1],
                    translateY: [20, 0],
                    duration: 620,
                    easing: 'easeOutCubic',
                });
                observer.unobserve(entradaVisible.target);
            });
        }, { threshold: 0.15 });

        elementosRevelables.forEach((elemento) => observador.observe(elemento));

        const barrasEcualizador = landing.querySelectorAll('.landing-equalizer i');
        const animacionEcualizador = anime({
            targets: barrasEcualizador,
            scaleY: [0.35, 1],
            opacity: [0.45, 1],
            delay: anime.stagger(75),
            duration: 460,
            direction: 'alternate',
            easing: 'easeInOutSine',
            loop: true,
        });
        const animacionLuz = anime({
            targets: landing.querySelector('.landing-art-glow'),
            scale: [0.88, 1.12],
            opacity: [0.55, 1],
            duration: 2400,
            direction: 'alternate',
            easing: 'easeInOutSine',
            loop: true,
        });

        const enlacesInteractivos = landing.querySelectorAll(
            '.landing-action-primary, .landing-action-secondary, .landing-sign-in, .landing-process-cta, .landing-space-link'
        );
        const animarEntrada = (event) => {
            anime.remove(event.currentTarget);
            anime({ targets: event.currentTarget, scale: 1.035, duration: 160, easing: 'easeOutQuad' });
        };
        const animarSalida = (event) => {
            anime.remove(event.currentTarget);
            anime({ targets: event.currentTarget, scale: 1, duration: 180, easing: 'easeOutQuad' });
        };

        enlacesInteractivos.forEach((enlace) => {
            enlace.addEventListener('pointerenter', animarEntrada);
            enlace.addEventListener('pointerleave', animarSalida);
            enlace.addEventListener('focus', animarEntrada);
            enlace.addEventListener('blur', animarSalida);
        });

        const tarjetasEspacio = landing.querySelectorAll('.landing-space-card');
        const animarTarjeta = (event) => {
            const simbolo = event.currentTarget.querySelector('.landing-space-symbol');
            anime.remove(simbolo);
            anime({
                targets: simbolo,
                scale: event.type === 'pointerenter' ? 1.12 : 1,
                rotate: event.type === 'pointerenter' ? 8 : 0,
                duration: 260,
                easing: 'easeOutCubic',
            });
        };
        tarjetasEspacio.forEach((tarjeta) => {
            tarjeta.addEventListener('pointerenter', animarTarjeta);
            tarjeta.addEventListener('pointerleave', animarTarjeta);
        });

        return () => {
            entrada.pause();
            animacionEcualizador.pause();
            animacionLuz.pause();
            observador.disconnect();
            enlacesInteractivos.forEach((enlace) => {
                enlace.removeEventListener('pointerenter', animarEntrada);
                enlace.removeEventListener('pointerleave', animarSalida);
                enlace.removeEventListener('focus', animarEntrada);
                enlace.removeEventListener('blur', animarSalida);
                anime.remove(enlace);
            });
            tarjetasEspacio.forEach((tarjeta) => {
                tarjeta.removeEventListener('pointerenter', animarTarjeta);
                tarjeta.removeEventListener('pointerleave', animarTarjeta);
                anime.remove(tarjeta.querySelector('.landing-space-symbol'));
            });
            preguntasFrecuentes.forEach((pregunta) => {
                pregunta.removeEventListener('toggle', animarRespuestaFAQ);
                anime.remove(pregunta.querySelector('p'));
            });
            anime.remove([landing.querySelector('.landing-header'), ...landing.querySelectorAll('.landing-copy > *, .landing-art'), ...elementosRevelables]);
        };
    }, []);

    useEffect(() => {
        const disco = discoRef.current;
        if (!disco) return undefined;

        anime.remove(disco);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        anime({
            targets: disco,
            rotate: girando ? '360deg' : '-15deg',
            duration: girando ? 2800 : 420,
            easing: girando ? 'linear' : 'easeOutCubic',
            loop: girando,
        });

        return () => anime.remove(disco);
    }, [girando]);

    return (
        <main className="landing-page" ref={landingRef}>
            <header className="landing-header">
                <Link className="landing-brand" to="/" aria-label="Z-ONE inicio">
                    <span>Z</span>-ONE
                </Link>
                <nav className="landing-nav" aria-label="Navegación principal">
                    <a href="#servicios">Servicios</a>
                    <a href="#espacios">Espacios</a>
                    <a href="#proceso">Cómo funciona</a>
                    <a href="#preguntas">Preguntas</a>
                    <a href="#contacto">Contacto</a>
                </nav>
                <Link className="landing-sign-in" to={RUTAS.LOGIN}>Iniciar sesión</Link>
            </header>

            <section className="landing-hero" aria-labelledby="landing-title">
                <div className="landing-copy">
                    <p className="landing-eyebrow">TU SONIDO, EN SU MEJOR VERSIÓN</p>
                    <h1 id="landing-title">Dale forma a tu próximo sonido.</h1>
                    <p className="landing-description">
                        Un espacio para grabar, producir y llevar tus ideas musicales desde la primera nota hasta el resultado final.
                    </p>
                    <div className="landing-actions">
                        <Link className="landing-action-primary" to={`${RUTAS.SESIONES}#crear`}>
                            Crear sesión
                        </Link>
                        <Link className="landing-action-secondary" to={RUTAS.LOGIN}>
                            Iniciar sesión
                        </Link>
                    </div>
                    <a className="landing-discover" href="#servicios">
                        <span className="landing-discover-icon" aria-hidden="true">↓</span>
                        <span>Conoce Z-ONE</span>
                    </a>
                </div>

                <section className="landing-art" aria-label="Ilustración abstracta de un estudio de grabación">
                    <div className="landing-art-glow" />
                    <div className="landing-record" ref={discoRef}>
                        <div className="landing-record-center">
                            <span>Z</span>
                            <small>ONE STUDIO</small>
                        </div>
                    </div>
                    <div className="landing-equalizer" aria-hidden="true">
                        <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                    </div>
                    <div className="landing-art-caption">
                        <span>GRABA · PRODUCE · CREA</span>
                        <span>ESTUDIO Z-ONE</span>
                    </div>
                    <button
                        className="landing-spin-control"
                        onClick={() => setGirando((estado) => !estado)}
                        aria-label={girando ? 'Detener animación del disco' : 'Girar disco'}
                        aria-pressed={girando}
                        disabled={window.matchMedia('(prefers-reduced-motion: reduce)').matches}
                        type="button"
                    >
                        <span aria-hidden="true">{girando ? 'Ⅱ' : '▶'}</span>
                        {girando ? 'Detener animación' : 'Animar disco'}
                    </button>
                </section>
            </section>

            <section className="landing-services" id="servicios">
                <div>
                    <p className="landing-eyebrow">TODO EMPIEZA CON UNA IDEA</p>
                    <h2>Tu música merece un buen lugar para crecer.</h2>
                    <p className="landing-section-copy">
                        Desde una primera grabación hasta la producción de un proyecto completo, encuentra en Z-ONE el espacio para hacerlo realidad.
                    </p>
                </div>
                <div className="landing-service-list">
                    <article>
                        <span>01</span>
                        <h3>Graba</h3>
                        <p>Prepara una sesión de grabación, define cuándo quieres trabajar y selecciona la cabina que se ajuste a tu proyecto.</p>
                        <small>Ideal para voces, instrumentos y nuevas ideas.</small>
                    </article>
                    <article>
                        <span>02</span>
                        <h3>Produce</h3>
                        <p>Organiza sesiones de producción musical, mezcla o masterización con fecha, duración y responsable definidos.</p>
                        <small>Planifica cada etapa desde la misma agenda.</small>
                    </article>
                    <article>
                        <span>03</span>
                        <h3>Avanza</h3>
                        <p>Registra tus sesiones y consulta los datos principales para mantener más claro el trabajo pendiente.</p>
                        <small>Una vista sencilla de tu actividad.</small>
                    </article>
                </div>
            </section>

            <section className="landing-spaces" id="espacios">
                <div className="landing-section-heading">
                    <div>
                        <p className="landing-eyebrow">ELIGE TU ESPACIO</p>
                        <h2>Un lugar para cada parte de tu sonido.</h2>
                    </div>
                    <p>Consulta las salas disponibles y elige la que mejor acompañe tu sesión.</p>
                </div>
                <div className="landing-space-grid">
                    {salas.map((sala, index) => (
                        <article className="landing-space-card" key={sala.id ?? sala.nombre}>
                            <div className={`landing-space-art landing-space-art-${index % 3}`}>
                                <span className="landing-space-number">{String(index + 1).padStart(2, '0')}</span>
                                <span className="landing-space-symbol" aria-hidden="true">
                                    {index === 1 ? '◉' : index === 2 ? '♫' : '〰'}
                                </span>
                                <span className="landing-space-art-label">Z-ONE STUDIO</span>
                            </div>
                            <div className="landing-space-details">
                                <div>
                                    <h3>{sala.nombre}</h3>
                                    <p>Disponible para reservar</p>
                                </div>
                                <strong>{formatearMoneda(sala.precio_hora)}<small> / hora</small></strong>
                            </div>
                            <Link className="landing-space-link" to={`${RUTAS.SESIONES}#crear`}>
                                Reservar este espacio <span aria-hidden="true">→</span>
                            </Link>
                        </article>
                    ))}
                    {salas.length === 0 && (
                        <p className="landing-spaces-empty">Pronto anunciaremos los espacios disponibles.</p>
                    )}
                </div>
            </section>

            <section className="landing-process" id="proceso">
                <div className="landing-section-heading">
                    <div>
                        <p className="landing-eyebrow">ASÍ DE FÁCIL</p>
                        <h2>Tu próxima sesión empieza aquí.</h2>
                    </div>
                    <Link className="landing-process-cta" to={`${RUTAS.SESIONES}#crear`}>
                        Comenzar una reserva <span aria-hidden="true">→</span>
                    </Link>
                </div>
                <div className="landing-process-grid">
                    <article>
                        <span>01</span>
                        <div><h3>Elige el espacio</h3><p>Revisa las salas y escoge la que necesitas.</p></div>
                    </article>
                    <article>
                        <span>02</span>
                        <div><h3>Programa tu sesión</h3><p>Selecciona fecha, hora y tipo de trabajo.</p></div>
                    </article>
                    <article>
                        <span>03</span>
                        <div><h3>Haz que suceda</h3><p>Consulta tus sesiones desde el área de gestión.</p></div>
                    </article>
                </div>
            </section>

            <section className="landing-faq" id="preguntas">
                <div className="landing-faq-heading">
                    <p className="landing-eyebrow">ANTES DE EMPEZAR</p>
                    <h2>Preguntas frecuentes</h2>
                    <p>Información práctica para preparar tu sesión en Z-ONE.</p>
                </div>
                <div className="landing-faq-list">
                    <details>
                        <summary>¿Qué tipos de sesión puedo registrar?</summary>
                        <p>Puedes elegir grabación, mezcla, masterización, ensayo o producción musical al crear una sesión.</p>
                    </details>
                    <details>
                        <summary>¿Qué información necesito para crearla?</summary>
                        <p>Selecciona una fecha, hora de inicio, duración, cabina y artista o productor. El nombre de la sesión es opcional.</p>
                    </details>
                    <details>
                        <summary>¿Necesito iniciar sesión para crear una reserva?</summary>
                        <p>Sí. Selecciona «Crear sesión» y, si todavía no has iniciado sesión, la página te llevará al acceso. Después podrás continuar con el formulario.</p>
                    </details>
                    <details>
                        <summary>¿La reserva queda confirmada automáticamente?</summary>
                        <p>En esta versión, la sesión se guarda en el navegador y queda con el estado que selecciones. La aplicación todavía no está conectada a un servicio que confirme disponibilidad o envíe la solicitud al estudio.</p>
                    </details>
                </div>
            </section>

            <section className="landing-final-cta">
                <div>
                    <p className="landing-eyebrow">¿LISTO PARA EMPEZAR?</p>
                    <h2>La próxima gran idea puede ser la tuya.</h2>
                </div>
                <div className="landing-actions">
                    <Link className="landing-action-primary" to={`${RUTAS.SESIONES}#crear`}>
                        Crear sesión
                    </Link>
                    <Link className="landing-action-secondary" to={RUTAS.LOGIN}>
                        Iniciar sesión
                    </Link>
                </div>
            </section>

            <footer className="landing-footer" id="contacto">
                <Link className="landing-brand" to="/" aria-label="Z-ONE inicio">
                    <span>Z</span>-ONE
                </Link>
                <p>Un espacio para hacer que la música suceda.</p>
                <Link to={RUTAS.LOGIN}>Acceso de usuarios</Link>
            </footer>
        </main>
    );
}
