// CAPA: Presentación
import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { EstadisticasService } from '../services/estadisticasService.js';
import { salaRepo } from '../repositories/salaRepo.js';
import { artistasDestacados } from '../data/artistasDestacados.js';
import '../styles/tailwind.css';

const ARTISTA = artistasDestacados.find((artista) => artista.imagen) ?? artistasDestacados[0];

export const authCampo =
    'w-full min-h-[48px] rounded-xl border border-border bg-surface-2 px-4 text-sm text-texto outline-none transition [color-scheme:dark] placeholder:text-sutil/70 focus:border-accent focus:ring-2 focus:ring-accent/40 [&>option]:bg-surface-3 [&>option]:text-texto';
export const authEtiqueta = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-sutil';
export const authBoton =
    'inline-flex min-h-[50px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-4 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70';

function obtenerMetricas() {
    const resumen = EstadisticasService.obtenerResumen();
    const salasActivas = salaRepo.listar().filter((sala) => sala.activo !== false).length;
    return [
        { etiqueta: 'Salas de grabación', valor: salasActivas },
        { etiqueta: 'Sesiones registradas', valor: resumen.totalSesiones },
        { etiqueta: 'Sesiones completadas', valor: resumen.sesionesCompletadas },
        { etiqueta: 'Solicitudes abiertas', valor: resumen.solicitudesAbiertas },
    ];
}

export default function AuthLayout({ titulo, subtitulo, children }) {
    const panelRef = useRef(null);
    const tarjetaRef = useRef(null);
    const metricas = obtenerMetricas();

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return undefined;
        }

        const panel = panelRef.current;
        const tarjeta = tarjetaRef.current;
        const animacion = anime.timeline({ easing: 'easeOutCubic' })
            .add({
                targets: panel ? panel.querySelectorAll('[data-anim]') : [],
                opacity: [0, 1],
                translateY: [18, 0],
                delay: anime.stagger(95),
                duration: 620,
            })
            .add(
                {
                    targets: tarjeta,
                    opacity: [0, 1],
                    translateY: [26, 0],
                    duration: 640,
                },
                '-=560'
            );

        return () => animacion.pause();
    }, []);

    return (
        <main className="grid min-h-screen bg-bg text-texto lg:grid-cols-[1.05fr_1fr]">
            <section
                ref={panelRef}
                className="relative hidden flex-col justify-between gap-10 overflow-hidden border-r border-border p-10 lg:flex xl:p-14"
                style={{
                    background:
                        'radial-gradient(ellipse at 15% 0%, rgba(164, 119, 255, 0.22), transparent 46%), radial-gradient(ellipse at 92% 100%, rgba(240, 79, 166, 0.16), transparent 46%), linear-gradient(160deg, #100d1b 0%, #140f23 55%, #0d0a16 100%)',
                }}
            >
                <div className="flex items-center gap-3" data-anim>
                    <img src="/Imagenes/logo.png" alt="" className="h-12 w-12 object-contain" />
                    <div>
                        <p className="text-2xl font-extrabold leading-none tracking-tight">Z-ONE</p>
                        <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-sutil">
                            Estudio de grabación
                        </p>
                    </div>
                </div>

                <div data-anim>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Tu sonido, en su mejor versión</p>
                    <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-texto-soft xl:text-5xl">
                        Donde tu música <span className="text-accent-soft">toma forma</span>.
                    </h2>
                    <p className="mt-4 max-w-md text-sm leading-7 text-sutil">
                        Graba, produce y gestiona cada sesión desde un solo lugar. El centro operativo del estudio, con
                        toda la actividad del talento en tiempo real.
                    </p>
                </div>

                <figure
                    data-anim
                    className="relative overflow-hidden rounded-2xl border border-border/80 shadow-2xl shadow-black/40"
                >
                    <img src={ARTISTA.imagen} alt={ARTISTA.textoAlternativo} className="h-56 w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
                    <figcaption className="absolute inset-x-0 bottom-0 p-5">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-accent-soft">
                            Artista destacado
                        </p>
                        <p className="mt-1 text-xl font-bold text-texto-soft">{ARTISTA.nombre}</p>
                        <p className="text-xs text-sutil">
                            {ARTISTA.origen} · {ARTISTA.estilo}
                        </p>
                    </figcaption>
                </figure>

                <div
                    data-anim
                    className="rounded-2xl border border-border/80 bg-surface/70 p-5 backdrop-blur"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sutil">Actividad del estudio</p>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-exito">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-exito" aria-hidden="true" />
                            En vivo
                        </span>
                    </div>
                    <table className="w-full text-sm">
                        <tbody>
                            {metricas.map((metrica, indice) => (
                                <tr
                                    key={metrica.etiqueta}
                                    className={indice < metricas.length - 1 ? 'border-b border-border/60' : ''}
                                >
                                    <td className="py-2.5 text-sutil">{metrica.etiqueta}</td>
                                    <td className="py-2.5 text-right font-bold tabular-nums text-texto-soft">
                                        {String(metrica.valor).padStart(2, '0')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="flex items-center justify-center p-6 sm:p-10">
                <div ref={tarjetaRef} className="w-full max-w-md">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <img src="/Imagenes/logo.png" alt="" className="h-11 w-11 object-contain" />
                        <span className="text-xl font-extrabold tracking-tight">Z-ONE</span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-texto-soft">{titulo}</h1>
                    <p className="mt-2 text-sm leading-6 text-sutil">{subtitulo}</p>

                    <div className="mt-8">{children}</div>
                </div>
            </section>
        </main>
    );
}
