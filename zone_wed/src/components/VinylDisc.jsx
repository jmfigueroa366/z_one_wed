// CAPA: Presentación
import { useEffect, useLayoutEffect, useRef } from 'react';
import anime from 'animejs';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const acortar = (texto, maximo = 28) => {
    if (!texto) return '';
    return texto.length > maximo ? `${texto.slice(0, maximo - 1)}…` : texto;
};

const generarRadios = (inicio, paso, cantidad) =>
    Array.from({ length: cantidad }, (_, i) => inicio + i * paso);

const SURCOS = [...generarRadios(100, 4.6, 26), ...generarRadios(222, 5.2, 12)];
const PISTAS = generarRadios(108, 16, 5);

export default function VinylDisc({ titulo = 'Z-ONE', artista = 'Studio', compacto = false, activo = true, onToggle }) {
    const discoRef = useRef(null);
    const ondasRef = useRef(null);
    const contenedorRef = useRef(null);
    const ondasLoopRef = useRef(null);

    useLayoutEffect(() => {
        const disco = discoRef.current;
        if (!disco || MENOS_MOVIMIENTO()) return undefined;

        const tl = anime.timeline({ easing: 'easeOutQuart' });
        tl.add({
            targets: disco,
            scale: [0.9, 1],
            duration: 900,
        });
        return () => tl.pause();
    }, []);

    useEffect(() => {
        const contenedor = contenedorRef.current;
        const ondas = ondasRef.current;
        if (!contenedor) return undefined;

        const alMover = (event) => {
            const rect = contenedor.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
            const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
            contenedor.style.setProperty('--rx', `${y}deg`);
            contenedor.style.setProperty('--ry', `${-x}deg`);
        };
        const alFuera = () => {
            contenedor.style.setProperty('--rx', '0deg');
            contenedor.style.setProperty('--ry', '0deg');
        };
        contenedor.addEventListener('mousemove', alMover);
        contenedor.addEventListener('mouseleave', alFuera);

        if (ondas && !MENOS_MOVIMIENTO()) {
            const circulos = ondas.querySelectorAll('circle');
            if (circulos.length) {
                ondasLoopRef.current = anime({
                    targets: circulos,
                    r: [72, 168],
                    opacity: [0.28, 0],
                    duration: 2100,
                    delay: anime.stagger(280),
                    loop: true,
                    easing: 'easeOutQuad',
                    autoplay: true,
                });
            }
        }

        return () => {
            contenedor.removeEventListener('mousemove', alMover);
            contenedor.removeEventListener('mouseleave', alFuera);
            if (ondasLoopRef.current) {
                ondasLoopRef.current.pause();
                ondasLoopRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const loop = ondasLoopRef.current;
        if (!loop) return;
        if (activo) loop.play();
        else loop.pause();
    }, [activo]);

    return (
        <div
            ref={contenedorRef}
            data-vinilo
            data-detenido={activo ? undefined : ''}
            className={`group relative flex items-center justify-center will-change-transform ${compacto ? 'w-[min(70%,300px)]' : 'w-[min(82%,420px)]'}`}
            style={{ transform: 'perspective(980px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))' }}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute h-[140%] w-[140%] rounded-full bg-gradient-to-r from-[#8b5cf6]/10 via-[#ec4899]/12 to-[#8b5cf6]/8 opacity-70 blur-[130px] transition-opacity duration-500 group-hover:opacity-100 [animation:pulse_3.4s_ease-in-out_infinite]"
            />
            <svg
                ref={ondasRef}
                aria-hidden="true"
                className="pointer-events-none absolute h-[190%] w-[190%] opacity-70"
                viewBox="0 0 420 420"
            >
                <circle cx="210" cy="210" r="72" fill="none" stroke="#ec4899" strokeWidth="1.2" />
                <circle cx="210" cy="210" r="72" fill="none" stroke="#8b5cf6" strokeWidth="1.2" />
                <circle cx="210" cy="210" r="72" fill="none" stroke="#a855f7" strokeWidth="1.2" />
            </svg>

            <div
                ref={discoRef}
                onClick={onToggle}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onToggle?.();
                    }
                }}
                className="relative z-10 aspect-square w-full cursor-pointer outline-none will-change-transform focus-visible:ring-2 focus-visible:ring-magenta/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                style={{ transformOrigin: '50% 50%' }}
                aria-label={activo ? 'Pausar el vinilo' : 'Reproducir el vinilo'}
            >
                <svg
                    data-giro
                    viewBox="0 0 420 420"
                    role="img"
                    aria-label={`Vinilo de ${titulo} — ${artista}`}
                    className="block h-full w-full drop-shadow-[0_40px_70px_rgba(0,0,0,0.8)]"
                >
                    <defs>
                        <radialGradient id="viniloBase" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#211d33" />
                            <stop offset="52%" stopColor="#0f0a1b" />
                            <stop offset="100%" stopColor="#04030a" />
                        </radialGradient>
                        <radialGradient id="viniloSurco" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                            <stop offset="65%" stopColor="#ffffff" stopOpacity="0" />
                            <stop offset="82%" stopColor="#ffffff" stopOpacity="0.016" />
                            <stop offset="94%" stopColor="#ffffff" stopOpacity="0.022" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.012" />
                        </radialGradient>
                        <linearGradient id="viniloBorde" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.14" />
                            <stop offset="50%" stopColor="#ec4899" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.14" />
                        </linearGradient>
                        <linearGradient id="viniloEtiqueta" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                        <radialGradient id="viniloMetal" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#f5f3ff" />
                            <stop offset="56%" stopColor="#d8d2ff" />
                            <stop offset="100%" stopColor="#a69ebd" />
                        </radialGradient>
                        <clipPath id="viniloClip">
                            <circle cx="210" cy="210" r="208" />
                        </clipPath>
                        <mask id="viniloReborde">
                            <rect width="420" height="420" fill="white" />
                            <circle cx="210" cy="210" r="148" fill="black" />
                        </mask>
                    </defs>
                    <circle cx="210" cy="210" r="208" fill="url(#viniloBase)" stroke="url(#viniloBorde)" strokeWidth="1.6" />
                    <g clipPath="url(#viniloClip)" fill="none" stroke="#ffffff">
                        {SURCOS.map((radio, i) => (
                            <circle
                                key={radio}
                                cx="210"
                                cy="210"
                                r={radio}
                                strokeOpacity={i % 2 === 0 ? 0.022 : 0.017}
                                strokeWidth={i % 3 === 0 ? 0.9 : 0.8}
                            />
                        ))}
                        {PISTAS.map((radio) => (
                            <circle
                                key={radio}
                                cx="210"
                                cy="210"
                                r={radio}
                                strokeOpacity="0.014"
                                strokeWidth="1.2"
                            />
                        ))}
                    </g>
                    <circle cx="210" cy="210" r="208" fill="url(#viniloSurco)" clipPath="url(#viniloClip)" />
                    <circle cx="210" cy="210" r="148" fill="#080612" stroke="#ffffff" strokeOpacity="0.09" strokeWidth="0.8" />
                    <g mask="url(#viniloReborde)">
                        <circle cx="210" cy="210" r="152" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray="18 16" opacity="0.36" />
                        <circle cx="210" cy="210" r="138" fill="none" stroke="#8b5cf6" strokeWidth="2.6" strokeDasharray="16 14" opacity="0.32" />
                    </g>
                    <circle cx="210" cy="210" r="73" fill="url(#viniloEtiqueta)" />
                    <text
                        x="210"
                        y="192"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="20"
                        fontWeight="700"
                        letterSpacing="8"
                        style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
                    >
                        Z-ONE
                    </text>
                    <text
                        x="210"
                        y="212"
                        textAnchor="middle"
                        fill="#ffffff"
                        opacity="0.86"
                        fontSize="9"
                        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    >
                        {acortar(titulo, 26)}
                    </text>
                    <text
                        x="210"
                        y="226"
                        textAnchor="middle"
                        fill="#ffffff"
                        opacity="0.58"
                        fontSize="8"
                        letterSpacing="4"
                        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    >
                        {acortar(artista, 30)}
                    </text>
                    <circle cx="210" cy="210" r="7" fill="url(#viniloMetal)" stroke="#a69ebd" strokeWidth="1.2" />
                    <circle cx="210" cy="210" r="3.2" fill="#05040a" />
                </svg>

                <svg
                    data-vuelta
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
                    viewBox="0 0 420 420"
                >
                    <defs>
                        <conicGradient id="viniloReflejo" cx="50%" cy="50%" r="50%" angle="195">
                            <stop offset="8%" stopColor="#ffffff" stopOpacity="0" />
                            <stop offset="17%" stopColor="#ffffff" stopOpacity="0.09" />
                            <stop offset="26%" stopColor="#ffffff" stopOpacity="0" />
                            <stop offset="47%" stopColor="#ffffff" stopOpacity="0.02" />
                            <stop offset="56%" stopColor="#ffffff" stopOpacity="0" />
                            <stop offset="66%" stopColor="#ffffff" stopOpacity="0.07" />
                            <stop offset="76%" stopColor="#ffffff" stopOpacity="0.01" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                        </conicGradient>
                    </defs>
                    <circle cx="210" cy="210" r="208" fill="url(#viniloReflejo)" />
                </svg>
            </div>

            <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-16 h-[40%] w-[70%] rounded-full bg-[#8b5cf6]/14 opacity-70 blur-[70px] transition-opacity duration-500 group-hover:opacity-100"
            />
        </div>
    );
}