// CAPA: Presentación
import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { Coins, Clock, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { ConfiguracionService } from '../services/configuracionService.ts';
import { formatearMoneda } from '../utils/helpers.ts';
import { useSpotlight } from '../hooks/useSpotlight.ts';
import { Contador, FondoHero } from '../components/Animados.tsx';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, CAMPO, ETIQUETA } from '../styles/clases.ts';
import type { FormEvent, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { FacturacionConfig } from '../config/facturacion.ts';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TARJETA = 'tarjeta-brillo relative overflow-hidden rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur transition duration-300 hover:border-accent/40';

function aPorcentaje(valor: number | string) {
    return Math.round((Number(valor) || 0) * 100);
}

function MonedaContador({ valor }: { valor: number }) {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const objetivo = Number(valor) || 0;
        if (MENOS_MOVIMIENTO()) {
            el.textContent = formatearMoneda(objetivo);
            return undefined;
        }
        const estado = { actual: 0 };
        const animacion = anime({
            targets: estado,
            actual: objetivo,
            round: 1,
            duration: 1200,
            easing: 'easeOutExpo',
            update() {
                el.textContent = formatearMoneda(estado.actual);
            },
        });
        return () => animacion.pause();
    }, [valor]);

    return <span ref={ref}>{formatearMoneda(valor)}</span>;
}

interface SeccionProps {
    Icono: LucideIcon;
    eyebrow: string;
    titulo: string;
    children: ReactNode;
}

function Seccion({ Icono, eyebrow, titulo, children }: SeccionProps) {
    return (
        <section data-tile className={TARJETA}>
            <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-white shadow-lg" aria-hidden="true">
                    <Icono className="h-4 w-4" />
                </span>
                <div>
                    <p className="workspace-eyebrow">{eyebrow}</p>
                    <h2 className="mt-0.5 text-lg font-bold tracking-tight text-texto-soft">{titulo}</h2>
                </div>
            </div>
            {children}
        </section>
    );
}

export default function Precios() {
    const [config, setConfig] = useState(() => ConfiguracionService.obtener());
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const contenedorRef = useRef<HTMLDivElement>(null);
    const [heroRef, seguirSpotlight] = useSpotlight();

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const contenedor = contenedorRef.current;
        if (!contenedor) return undefined;
        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-tile]'),
            opacity: [0, 1],
            translateY: [26, 0],
            duration: 640,
            delay: anime.stagger(80),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, []);

    const cambiar = (campo: keyof FacturacionConfig, valor: string) =>
        setConfig((actual) => ({ ...actual, [campo]: valor }) as FacturacionConfig);

    const guardar = (evento: FormEvent<HTMLFormElement>) => {
        evento.preventDefault();
        setMensaje('');
        setError('');
        try {
            const actualizada = ConfiguracionService.actualizar({
                tarifaProduccionHora: Number(config.tarifaProduccionHora),
                tarifaEnsayoHora: Number(config.tarifaEnsayoHora),
                umbralAlbumDescuento: Number(config.umbralAlbumDescuento),
                descuentoAlbum: Number(config.descuentoAlbum) / 100,
                bloqueRedondeoMin: Number(config.bloqueRedondeoMin),
                anticipoPorcentaje: Number(config.anticipoPorcentaje) / 100,
                cancelacionHorasGratis: Number(config.cancelacionHorasGratis),
                cancelacionPorcentaje: Number(config.cancelacionPorcentaje) / 100,
            });
            setConfig(actualizada);
            setMensaje('Precios actualizados. Se aplican a las próximas facturas.');
        } catch (errorGuardar) {
            setError(errorGuardar instanceof Error ? errorGuardar.message : 'No se pudo guardar.');
        }
    };

    const restablecer = () => {
        setMensaje('');
        setError('');
        setConfig(ConfiguracionService.restablecer());
        setMensaje('Valores restablecidos a los predeterminados.');
    };

    const metricasHero = [
        { etiqueta: 'Producción / h', valor: config.tarifaProduccionHora, mono: true },
        { etiqueta: 'Ensayo / h', valor: config.tarifaEnsayoHora, mono: true },
        { etiqueta: 'Anticipo', valor: aPorcentaje(config.anticipoPorcentaje), sufijo: '%' },
    ];

    return (
        <main className="workspace-content" data-page="precios">
            <header className="page-heading relative border-l-4 border-accent pl-4">
                <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-24 h-52 w-52 animate-aurora rounded-full bg-[#9365f2]/18 blur-3xl" />
                <p className="workspace-eyebrow">ADMINISTRACIÓN · TARIFAS</p>
                <h1>Precios del estudio</h1>
                <p>Configura las tarifas y reglas que usa el sistema para facturar. El cambio aplica solo a facturas nuevas.</p>
            </header>

            {mensaje && <p className="mt-5 rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">{mensaje}</p>}
            {error && <p className="mt-5 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">{error}</p>}

            <form className="mt-6 grid gap-5" onSubmit={guardar}>
                <div ref={contenedorRef} className="grid gap-5">
                    <section
                        data-tile
                        ref={heroRef}
                        onMouseMove={seguirSpotlight}
                        className="group/hero relative overflow-hidden rounded-[2.25rem] border border-accent/25 p-6 sm:p-8"
                        style={{
                            background:
                                'radial-gradient(ellipse at 88% 4%, rgba(147, 101, 242, 0.32), transparent 46%), radial-gradient(ellipse at 4% 100%, rgba(111, 75, 187, 0.34), transparent 50%), linear-gradient(120deg, rgba(111, 75, 187, 0.36), rgba(23, 19, 34, 0.97) 72%)',
                        }}
                    >
                        <FondoHero acento="#9365f2" />
                        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 animate-aurora rounded-full bg-[#9365f2]/25 blur-3xl" />
                        <div aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 select-none text-[11rem] font-black leading-none tracking-tighter text-white/[0.04] lg:block">
                            ₮
                        </div>
                        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-xl">
                                <span className="inline-flex items-center gap-2 rounded-full border border-accent-soft/40 bg-accent/10 px-3 py-1 text-xs font-bold text-accent-soft">
                                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                                    Configuración vigente
                                </span>
                                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                                    Tarifas y reglas, <span className="texto-degradado">a tu medida.</span>
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-sutil">
                                    Ajusta precios por hora, descuentos y política de cancelación. Las reglas se aplican al emitir cada factura.
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {metricasHero.map((metrica) => (
                                    <div key={metrica.etiqueta} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                                        <strong className="block text-lg font-black tracking-tight text-texto-soft">
                                            {metrica.mono ? <MonedaContador valor={metrica.valor} /> : <Contador valor={metrica.valor} sufijo={metrica.sufijo ?? ''} />}
                                        </strong>
                                        <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">{metrica.etiqueta}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <Seccion Icono={Coins} eyebrow="BASE" titulo="Tarifas por hora">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Producción (hora)</span>
                                <input className={CAMPO} type="number" min="1" value={config.tarifaProduccionHora} onChange={(e) => cambiar('tarifaProduccionHora', e.target.value)} />
                                <span className="mt-1 text-xs text-sutil">{formatearMoneda(config.tarifaProduccionHora)}</span>
                            </label>
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Sala de ensayo (hora)</span>
                                <input className={CAMPO} type="number" min="1" value={config.tarifaEnsayoHora} onChange={(e) => cambiar('tarifaEnsayoHora', e.target.value)} />
                                <span className="mt-1 text-xs text-sutil">{formatearMoneda(config.tarifaEnsayoHora)}</span>
                            </label>
                        </div>
                    </Seccion>

                    <Seccion Icono={SlidersHorizontal} eyebrow="CÁLCULO" titulo="Reglas de facturación">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Bloque de redondeo (min)</span>
                                <input className={CAMPO} type="number" min="1" value={config.bloqueRedondeoMin} onChange={(e) => cambiar('bloqueRedondeoMin', e.target.value)} />
                            </label>
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Canciones para descuento</span>
                                <input className={CAMPO} type="number" min="1" value={config.umbralAlbumDescuento} onChange={(e) => cambiar('umbralAlbumDescuento', e.target.value)} />
                            </label>
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Descuento álbum (%)</span>
                                <input className={CAMPO} type="number" min="0" max="100" value={aPorcentaje(config.descuentoAlbum)} onChange={(e) => cambiar('descuentoAlbum', e.target.value)} />
                            </label>
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Anticipo (%)</span>
                                <input className={CAMPO} type="number" min="0" max="100" value={aPorcentaje(config.anticipoPorcentaje)} onChange={(e) => cambiar('anticipoPorcentaje', e.target.value)} />
                            </label>
                        </div>
                    </Seccion>

                    <Seccion Icono={Clock} eyebrow="POLÍTICA" titulo="Política de cancelación">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Horas de gracia (sin cargo)</span>
                                <input className={CAMPO} type="number" min="0" value={config.cancelacionHorasGratis} onChange={(e) => cambiar('cancelacionHorasGratis', e.target.value)} />
                            </label>
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Cargo tardío (%)</span>
                                <input className={CAMPO} type="number" min="0" max="100" value={aPorcentaje(config.cancelacionPorcentaje)} onChange={(e) => cambiar('cancelacionPorcentaje', e.target.value)} />
                            </label>
                        </div>
                    </Seccion>

                    <div data-tile className="flex flex-wrap gap-3">
                        <button className={BOTON_PRIMARIO} type="submit">
                            <Save className="mr-2 h-4 w-4" aria-hidden="true" /> Guardar cambios
                        </button>
                        <button className={BOTON_SECUNDARIO} type="button" onClick={restablecer}>
                            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> Restablecer
                        </button>
                    </div>
                </div>
            </form>
        </main>
    );
}
