// CAPA: Presentación
import { useEffect, useMemo, useState } from 'react';
import FormularioSesion from '../components/FormularioSesion.jsx';
import { useColaboradores } from '../hooks/useColaboradores.js';
import { useSalas } from '../hooks/useSalas.js';
import { useSesiones } from '../hooks/useSesiones.js';
import { CancionService } from '../services/cancionService.js';
import { ProyectoService } from '../services/proyectoService.js';
import { formatearFecha } from '../utils/helpers.js';
import '../styles/tailwind.css';

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

    const sesionesFiltradas = useMemo(
        () => sesiones.filter((sesion) => filtro === 'todas' || sesion.estado === filtro),
        [sesiones, filtro]
    );

    useEffect(() => {
        if (window.location.hash) {
            document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

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
        { etiqueta: 'Sesiones registradas', valor: sesiones.length, icono: '🎤', clase: 'border-accent/30 bg-accent/15 text-accent' },
        { etiqueta: 'Confirmadas', valor: sesiones.filter((sesion) => sesion.estado === 'confirmada').length, icono: '✓', clase: 'border-exito/40 bg-exito/10 text-exito' },
        { etiqueta: 'Cabinas disponibles', valor: salas.length, icono: '🎚', clase: 'border-aviso/40 bg-aviso/10 text-aviso' },
    ];

    return (
        <main className="workspace-content">
            <div className="space-y-5">
                <header className="border-l-[3px] border-[#669fe8] pl-4">
                    <p className="workspace-eyebrow">GESTIÓN · ESTUDIO</p>
                    <h1 className="mb-1 text-3xl font-bold tracking-tight text-texto md:text-4xl">
                        Agenda de cabinas y sesiones
                    </h1>
                    <p className="text-sm leading-6 text-sutil">
                        Registra sesiones y consulta la programación del estudio para coordinar cabinas y horarios.
                    </p>
                </header>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Resumen de sesiones">
                    {resumen.map((item) => (
                        <article
                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent/50"
                            key={item.etiqueta}
                        >
                            <div>
                                <span className="block text-xs text-sutil">{item.etiqueta}</span>
                                <strong className="block text-3xl font-bold text-texto">{item.valor}</strong>
                            </div>
                            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${item.clase}`} aria-hidden="true">
                                {item.icono}
                            </span>
                        </article>
                    ))}
                </section>

                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
                    <section id="registrar" className="scroll-mt-5 rounded-2xl border border-border bg-surface p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="workspace-eyebrow">PROGRAMACIÓN</p>
                                <h2 className="text-xl font-bold tracking-tight text-texto">Sesiones registradas</h2>
                            </div>
                            <a className="shrink-0 text-sm font-bold text-accent transition hover:text-magenta" href="#crear">
                                + Nueva sesión
                            </a>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-2" aria-label="Filtrar sesiones">
                            {FILTROS.map(([valor, etiqueta]) => {
                                const activo = filtro === valor;
                                return (
                                    <button
                                        className={
                                            activo
                                                ? 'rounded-full border border-accent/70 bg-accent/20 px-3.5 py-1.5 text-xs font-semibold text-white transition'
                                                : 'rounded-full border border-border bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-sutil transition hover:border-accent/50 hover:text-texto'
                                        }
                                        key={valor}
                                        onClick={() => setFiltro(valor)}
                                        type="button"
                                        aria-pressed={activo}
                                    >
                                        {etiqueta}
                                    </button>
                                );
                            })}
                        </div>

                        {sesionesFiltradas.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-border">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-2/60">
                                            <th className="px-3 py-2.5 text-[0.68rem] font-bold uppercase tracking-wider text-sutil">
                                                Fecha y hora
                                            </th>
                                            <th className="px-3 py-2.5 text-[0.68rem] font-bold uppercase tracking-wider text-sutil">
                                                Sesión
                                            </th>
                                            <th className="px-3 py-2.5 text-[0.68rem] font-bold uppercase tracking-wider text-sutil">
                                                Cabina
                                            </th>
                                            <th className="px-3 py-2.5 text-[0.68rem] font-bold uppercase tracking-wider text-sutil">
                                                Artista / productor
                                            </th>
                                            <th className="px-3 py-2.5 text-[0.68rem] font-bold uppercase tracking-wider text-sutil">
                                                Estado
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sesionesFiltradas.map((sesion) => (
                                            <tr
                                                className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-2/50"
                                                key={sesion.id}
                                            >
                                                <td className="whitespace-nowrap px-3 py-3">
                                                    <strong className="block font-semibold text-texto">
                                                        {formatearFecha(sesion.fecha, { day: 'numeric' }) || 'Sin fecha'}
                                                    </strong>
                                                    <span className="mt-0.5 block text-xs text-sutil">
                                                        {sesion.hora_inicio ?? '--:--'}–{sesion.hora_fin ?? '--:--'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-texto">
                                                    <span className="font-medium">{sesion.titulo || sesion.tipo || 'Sesión de estudio'}</span>
                                                    {detalleCancion(sesion.cancion_id) && (
                                                        <span className="mt-0.5 block whitespace-normal text-xs text-sutil">
                                                            {detalleCancion(sesion.cancion_id)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-sutil">{obtenerNombreSala(sesion.sala_id)}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-sutil">{obtenerNombreColaborador(sesion.colaborador_id)}</td>
                                                <td className="whitespace-nowrap px-3 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                                                            BADGES[sesion.estado] ?? 'border-border bg-surface-3 text-sutil'
                                                        }`}
                                                    >
                                                        {ESTADOS[sesion.estado] ?? sesion.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
                                <span className="text-2xl text-sutil/60" aria-hidden="true">♪</span>
                                <p className="text-sm text-sutil">No hay sesiones en esta categoría.</p>
                            </div>
                        )}
                    </section>

                    <FormularioSesion salas={salas} colaboradores={colaboradores} />
                </div>
            </div>
        </main>
    );
}