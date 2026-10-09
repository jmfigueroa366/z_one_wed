// CAPA: Presentación
import { Link } from 'react-router-dom';
import { useSalas } from '../hooks/useSalas.js';
import { RUTAS } from '../config/rutas.js';
import { formatearMoneda } from '../utils/helpers.js';
import '../styles/tailwind.css';

const SERVICIOS = [
    { nombre: 'Grabación', descripcion: 'Captura voces e instrumentos en una sesión de estudio.' },
    { nombre: 'Producción musical', descripcion: 'Desarrolla arreglos, sonido y dirección para tus canciones.' },
    { nombre: 'Mezcla', descripcion: 'Equilibra pistas y prepara la mezcla de tu proyecto.' },
    { nombre: 'Masterización', descripcion: 'Da el acabado final y prepara el audio para su distribución.' },
];

const ARTE_SALA = [
    'radial-gradient(ellipse at 72% 14%, rgba(234, 94, 176, 0.32), transparent 43%), linear-gradient(135deg, #30254a, #171322 78%)',
    'radial-gradient(ellipse at 26% 16%, rgba(79, 170, 210, 0.3), transparent 46%), linear-gradient(135deg, #25374a, #171322 78%)',
    'radial-gradient(ellipse at 68% 12%, rgba(211, 166, 75, 0.28), transparent 46%), linear-gradient(135deg, #463629, #171322 78%)',
];

export default function Catalogo() {
    const [salas] = useSalas();
    const salasActivas = salas.filter((sala) => sala.activo !== false);

    return (
        <main className="workspace-content" data-page="catalogo">
            <header className="page-heading border-l-4 border-[#f2b84b] pl-4">
                <p className="workspace-eyebrow">ESPACIOS Y SERVICIOS</p>
                <h1>Catálogo del estudio</h1>
                <p>Consulta las salas disponibles, sus tarifas registradas y los servicios que puedes coordinar con Z-ONE.</p>
            </header>

            <section className="mt-6 grid gap-5 rounded-3xl border border-border bg-surface/70 p-6" aria-labelledby="catalog-rooms-title">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="workspace-eyebrow">ESPACIOS Z-ONE</p>
                        <h2 id="catalog-rooms-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                            Salas de grabación
                        </h2>
                    </div>
                    <span className="rounded-full border border-exito/40 bg-exito/10 px-3 py-1.5 text-xs font-bold text-exito-soft">
                        {salasActivas.length} disponibles
                    </span>
                </div>

                {salasActivas.length ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {salasActivas.map((sala, index) => (
                            <article
                                className="overflow-hidden rounded-2xl border border-border bg-[#120f1d]/80 transition hover:-translate-y-1 hover:border-accent/40"
                                key={sala.id ?? sala.nombre}
                            >
                                <div
                                    className="relative flex h-32 items-end justify-between overflow-hidden p-4"
                                    style={{ background: ARTE_SALA[index % 3] }}
                                    aria-hidden="true"
                                >
                                    <span className="text-xs font-extrabold tracking-[0.12em] text-white/60">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="text-7xl font-black leading-none tracking-tighter text-white/15">Z</span>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-2.5">
                                        <h3 className="text-base font-bold text-texto-soft">{sala.nombre}</h3>
                                        <span className="shrink-0 text-xs font-bold text-exito-soft">
                                            <span aria-hidden="true">●</span> Activa
                                        </span>
                                    </div>
                                    <p className="my-3 text-sm leading-6 text-sutil">
                                        Espacio del estudio disponible para coordinar sesiones de producción musical.
                                    </p>
                                    <div className="flex items-baseline gap-2 border-t border-border/60 py-3">
                                        <strong className="text-xl font-bold text-texto-soft">{formatearMoneda(sala.precio_hora)}</strong>
                                        <span className="text-xs text-sutil">por hora</span>
                                    </div>
                                    <Link
                                        className="inline-flex items-center gap-2 text-sm font-bold text-accent-soft transition hover:text-magenta"
                                        to={`${RUTAS.SESIONES}#crear`}
                                    >
                                        Programar una sesión <span aria-hidden="true">→</span>
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="py-3 text-center text-sutil">En este momento no hay salas activas en el catálogo.</p>
                )}
            </section>

            <section className="mt-6 grid gap-5 rounded-3xl border border-border bg-surface/70 p-6" aria-labelledby="catalog-services-title">
                <div>
                    <p className="workspace-eyebrow">FLUJO DE PRODUCCIÓN</p>
                    <h2 id="catalog-services-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                        Servicios del estudio
                    </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {SERVICIOS.map((servicio, index) => (
                        <article className="min-h-[150px] rounded-xl border border-border bg-white/[0.025] p-4" key={servicio.nombre}>
                            <span className="mb-4 inline-block text-xs font-extrabold tracking-[0.12em] text-accent-soft">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <h3 className="text-base font-bold text-texto-soft">{servicio.nombre}</h3>
                            <p className="mt-2 text-sm leading-6 text-sutil">{servicio.descripcion}</p>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
