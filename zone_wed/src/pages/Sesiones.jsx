// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import FormularioSesion from '../components/FormularioSesion.jsx';
import { useColaboradores } from '../hooks/useColaboradores.js';
import { useSalas } from '../hooks/useSalas.js';
import { useSesiones } from '../hooks/useSesiones.js';
import { CancionService } from '../services/cancionService.js';
import { ProyectoService } from '../services/proyectoService.js';
import { formatearFecha } from '../utils/helpers.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ESTADOS = {
    confirmada: 'Confirmada',
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    completada: 'Completada',
    cancelada: 'Cancelada',
};

const BADGES = {
    confirmada: 'border-exito/30 bg-exito/10 text-exito',
    en_proceso: 'border-exito/30 bg-exito/10 text-exito',
    pendiente: 'border-aviso/30 bg-aviso/10 text-aviso',
    completada: 'border-[#5393da]/30 bg-[#5393da]/10 text-[#9ecbff]',
    cancelada: 'border-peligro/30 bg-peligro/10 text-peligro',
};

const PUNTO = {
    confirmada: 'bg-exito shadow-[0_0_14px_rgba(123,224,176,0.7)]',
    en_proceso: 'bg-exito shadow-[0_0_14px_rgba(123,224,176,0.7)]',
    pendiente: 'bg-aviso shadow-[0_0_14px_rgba(255,209,102,0.7)]',
    completada: 'bg-[#5393da] shadow-[0_0_14px_rgba(83,147,218,0.7)]',
    cancelada: 'bg-peligro shadow-[0_0_14px_rgba(255,138,138,0.7)]',
};

const FILTROS = [
    ['todas', 'Todas'],
    ['confirmada', 'Confirmadas'],
    ['pendiente', 'Pendientes'],
    ['cancelada', 'Canceladas'],
];

export default function Sesiones() {
    const [sesiones] = useSesiones();
    const [salas] = useSalas(true);
    const [colaboradores] = useColaboradores(true);
    const [filtro, setFiltro] = useState('todas');
    const listaRef = useRef(null);

    const sesionesFiltradas = useMemo(
        () =>
            sesiones
                .filter((sesion) => filtro === 'todas' || sesion.estado === filtro)
                .sort((a, b) => `${a.fecha} ${a.hora_inicio ?? ''}`.localeCompare(`${b.fecha} ${b.hora_inicio ?? ''}`)),
        [sesiones, filtro]
    );

    const dias = useMemo(() => {
        const mapa = new Map();
        sesionesFiltradas.forEach((sesion) => {
            const clave = sesion.fecha ?? 'sin-fecha';
            if (!mapa.has(clave)) mapa.set(clave, []);
            mapa.get(clave).push(sesion);
        });
        return [...mapa.entries()];
    }, [sesionesFiltradas]);

    useEffect(() => {
        if (window.location.hash) {
            document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const contenedor = listaRef.current;
        if (!contenedor) return undefined;
        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-sesion]'),
            opacity: [0, 1],
            translateX: [-14, 0],
            duration: 420,
            delay: anime.stagger(55),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [dias]);

    const obtenerNombreSala = (id) =>
        salas.find((sala) => String(sala.id) === String(id))?.nombre ?? 'Sala no disponible';
    const obtenerNombreColaborador = (id) =>
        colaboradores.find((colaborador) => String(colaborador.id) === String(id))?.nombre ?? 'Sin asignar';

    const canciones = useMemo(() => CancionService.listar(), []);
    const proyectos = useMemo(() => ProyectoService.listar(), []);
    const detalleCancion = (id) => {
        const cancion = canciones.find((c) => String(c.id) === String(id));
        if (!cancion) return null;
        const proyecto = proyectos.find((p) => String(p.id) === String(cancion.proyecto_id));
        const partes = Array.isArray(cancion.partes) && cancion.partes.length > 0 ? ` · ${cancion.partes.join(', ')}` : '';
        return `${cancion.nombre}${proyecto ? ` · ${proyecto.nombre}` : ''}${partes}`;
    };

    const resumen = [
        { etiqueta: 'Sesiones registradas', valor: sesiones.length, icono: '🎤', clase: 'from-[#5b418f]/50' },
        { etiqueta: 'Confirmadas', valor: sesiones.filter((sesion) => sesion.estado === 'confirmada').length, icono: '✓', clase: 'from-exito/30' },
        { etiqueta: 'Cabinas disponibles', valor: salas.length, icono: '🎚', clase: 'from-[#5393da]/30' },
    ];

    return (
        <main className="workspace-content" data-page="sesiones">
            <header className="page-heading relative border-l-4 border-[#669fe8] pl-4">
                <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-16 h-52 w-52 animate-aurora rounded-full bg-[#5393da]/15 blur-3xl" />
                <p className="workspace-eyebrow">GESTIÓN · ESTUDIO</p>
                <h1>Agenda de cabinas y sesiones</h1>
                <p>Registra sesiones y sigue la programación del estudio como una línea de tiempo viva.</p>
            </header>

            <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Resumen de sesiones">
                {resumen.map((item) => (
                    <article
                        key={item.etiqueta}
                        className={`relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${item.clase} to-surface/40 p-4 transition hover:-translate-y-0.5 hover:border-accent/50`}
                    >
                        <div>
                            <span className="block text-xs text-sutil">{item.etiqueta}</span>
                            <strong className="block text-3xl font-bold text-texto-soft">{item.valor}</strong>
                        </div>
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-black/20 text-lg" aria-hidden="true">
                            {item.icono}
                        </span>
                    </article>
                ))}
            </section>

            <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
                <section id="registrar" className="scroll-mt-5 rounded-[2rem] border border-border bg-surface/60 p-5 backdrop-blur sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="workspace-eyebrow">PROGRAMACIÓN</p>
                            <h2 className="text-xl font-bold tracking-tight text-texto-soft">Línea de sesiones</h2>
                        </div>
                        <a className="shrink-0 text-sm font-bold text-accent transition hover:text-magenta" href="#crear">
                            + Nueva sesión
                        </a>
                    </div>

                    <div className="mb-5 flex flex-wrap gap-2" aria-label="Filtrar sesiones">
                        {FILTROS.map(([valor, etiqueta]) => {
                            const activo = filtro === valor;
                            return (
                                <button
                                    key={valor}
                                    type="button"
                                    onClick={() => setFiltro(valor)}
                                    aria-pressed={activo}
                                    className={
                                        activo
                                            ? 'rounded-full border border-accent/70 bg-gradient-to-r from-[#9365f2]/40 to-[#e34ba6]/30 px-3.5 py-1.5 text-xs font-bold text-white transition'
                                            : 'rounded-full border border-border bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-sutil transition hover:border-accent/50 hover:text-texto'
                                    }
                                >
                                    {etiqueta}
                                </button>
                            );
                        })}
                    </div>

                    {sesionesFiltradas.length > 0 ? (
                        <div ref={listaRef} className="grid gap-6">
                            {dias.map(([fecha, items]) => (
                                <div key={fecha}>
                                    <div className="mb-3 flex items-center gap-3">
                                        <span className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs font-bold capitalize text-texto-soft">
                                            {formatearFecha(fecha, { weekday: 'long', day: 'numeric', month: 'long' }) || 'Sin fecha'}
                                        </span>
                                        <span className="h-px flex-1 bg-border/60" />
                                        <span className="text-xs text-sutil">{items.length} sesión{items.length === 1 ? '' : 'es'}</span>
                                    </div>

                                    <ol className="grid gap-3">
                                        {items.map((sesion) => (
                                            <li key={sesion.id} data-sesion className="grid grid-cols-[58px_auto_1fr] gap-3">
                                                <div className="pt-4 text-right">
                                                    <strong className="block text-sm font-bold tabular-nums text-texto-soft">{sesion.hora_inicio ?? '--:--'}</strong>
                                                    <span className="block text-[0.68rem] text-sutil">{sesion.hora_fin ?? '--:--'}</span>
                                                </div>
                                                <div className="relative flex justify-center">
                                                    <span aria-hidden="true" className="absolute inset-y-0 w-px bg-border/70" />
                                                    <span
                                                        aria-hidden="true"
                                                        className={`relative mt-5 h-3 w-3 rounded-full ring-4 ring-surface ${PUNTO[sesion.estado] ?? 'bg-sutil'}`}
                                                    />
                                                </div>
                                                <article className="group rounded-2xl border border-border bg-white/[0.02] p-4 transition hover:border-accent/50 hover:bg-white/[0.04]">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <h3 className="text-sm font-bold text-texto-soft">
                                                            {sesion.titulo || sesion.tipo || 'Sesión de estudio'}
                                                        </h3>
                                                        <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${BADGES[sesion.estado] ?? 'border-border bg-surface-3 text-sutil'}`}>
                                                            {ESTADOS[sesion.estado] ?? sesion.estado}
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-sutil">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <span aria-hidden="true">🎚</span> {obtenerNombreSala(sesion.sala_id)}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <span aria-hidden="true">🎤</span> {obtenerNombreColaborador(sesion.colaborador_id)}
                                                        </span>
                                                    </div>
                                                    {detalleCancion(sesion.cancion_id) && (
                                                        <p className="mt-2 rounded-lg border border-border/60 bg-black/20 px-2.5 py-1.5 text-xs text-sutil">
                                                            ♪ {detalleCancion(sesion.cancion_id)}
                                                        </p>
                                                    )}
                                                </article>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-surface/40 py-12 text-center">
                            <span className="text-2xl text-sutil/60" aria-hidden="true">♪</span>
                            <p className="text-sm text-sutil">No hay sesiones en esta categoría.</p>
                        </div>
                    )}
                </section>

                <FormularioSesion salas={salas} colaboradores={colaboradores} />
            </div>
        </main>
    );
}
