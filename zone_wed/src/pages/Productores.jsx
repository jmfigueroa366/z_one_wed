// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import RegistroGrabacionSesiones from '../components/RegistroGrabacionSesiones.jsx';
import { Contador, Ecualizador } from '../components/Animados.jsx';
import { useProductores } from '../hooks/useProductores.js';
import { ProductorService } from '../services/productorService.js';
import { BOTON_PRIMARIO, CAMPO, ETIQUETA } from '../styles/clases.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ESPECIALIDADES = ['Grabación', 'Mezcla', 'Masterización', 'Producción musical'];
const ACENTO_ESPECIALIDAD = {
    'Grabación': '#9ecbff',
    'Mezcla': '#a477ff',
    'Masterización': '#f04fa6',
    'Producción musical': '#7be0b0',
};

const RETRATO = [
    'radial-gradient(circle at 30% 18%, rgba(240, 79, 166, 0.34), transparent 55%), linear-gradient(150deg, #3a2a52, #171322 82%)',
    'radial-gradient(circle at 72% 16%, rgba(79, 170, 210, 0.32), transparent 55%), linear-gradient(150deg, #25374a, #171322 82%)',
    'radial-gradient(circle at 40% 20%, rgba(211, 166, 75, 0.3), transparent 55%), linear-gradient(150deg, #463629, #171322 82%)',
    'radial-gradient(circle at 66% 18%, rgba(147, 101, 242, 0.36), transparent 55%), linear-gradient(150deg, #2e2547, #171322 82%)',
];

function iniciales(nombre) {
    return String(nombre ?? '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0] ?? '')
        .join('')
        .toLocaleUpperCase();
}

export default function Productores() {
    const [productores] = useProductores();
    const [formulario, setFormulario] = useState({ nombre: '', especialidad: ESPECIALIDADES[0], imagen: '' });
    const [error, setError] = useState('');
    const [cargandoImagen, setCargandoImagen] = useState(false);
    const [productorGrabacion, setProductorGrabacion] = useState(null);
    const [filtroEspecialidad, setFiltroEspecialidad] = useState('Todas');
    const gridRef = useRef(null);

    const especialidadesPresentes = useMemo(
        () => [...new Set(productores.map((productor) => productor.especialidad).filter(Boolean))],
        [productores]
    );
    const productoresFiltrados = useMemo(
        () => productores.filter((productor) => filtroEspecialidad === 'Todas' || productor.especialidad === filtroEspecialidad),
        [productores, filtroEspecialidad]
    );
    const destacado = productoresFiltrados[0] ?? null;
    const acentoDestacado = destacado ? (ACENTO_ESPECIALIDAD[destacado.especialidad] ?? '#a477ff') : '#a477ff';

    useEffect(() => {
        const grid = gridRef.current;
        if (!grid || MENOS_MOVIMIENTO()) return undefined;
        const animacion = anime({
            targets: grid.children,
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 480,
            delay: anime.stagger(70),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [productoresFiltrados]);

    const manejarCambio = (event) => {
        const { name, value } = event.target;
        setFormulario((actual) => ({ ...actual, [name]: value }));
    };

    const manejarImagen = (event) => {
        const archivo = event.target.files?.[0];
        setError('');

        if (!archivo) {
            setFormulario((actual) => ({ ...actual, imagen: '' }));
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
            setError('La imagen debe estar en formato JPG, PNG o WebP.');
            event.target.value = '';
            return;
        }

        if (archivo.size > 1.5 * 1024 * 1024) {
            setError('La imagen debe pesar 1.5 MB o menos.');
            event.target.value = '';
            return;
        }

        setCargandoImagen(true);
        const lector = new FileReader();
        lector.onload = () => {
            if (typeof lector.result !== 'string') {
                setError('No se pudo leer la imagen seleccionada.');
            } else {
                setFormulario((actual) => ({ ...actual, imagen: lector.result }));
            }
            setCargandoImagen(false);
        };
        lector.onerror = () => {
            setError('No se pudo leer la imagen seleccionada.');
            setCargandoImagen(false);
        };
        lector.readAsDataURL(archivo);
    };

    const manejarRegistro = (event) => {
        event.preventDefault();
        setError('');

        try {
            ProductorService.crear(formulario);
            setFormulario({ nombre: '', especialidad: ESPECIALIDADES[0], imagen: '' });
            const campoImagen = document.getElementById('producer-image');
            if (campoImagen) campoImagen.value = '';
            setFiltroEspecialidad('Todas');
        } catch (errorRegistro) {
            setError(errorRegistro.message || 'No se pudo registrar el productor.');
        }
    };

    return (
        <main className="workspace-content" data-page="productores">
            <header className="page-heading border-l-4 border-[#9ecbff] pl-4">
                <p className="workspace-eyebrow">GESTIÓN DE PRODUCTORES</p>
                <h1>Productores registrados</h1>
                <p>El equipo técnico detrás de cada sesión y lanzamiento.</p>
            </header>

            <section
                className="relative mt-6 overflow-hidden rounded-[2rem] border border-[#9ecbff]/25 p-6 sm:p-8"
                style={{
                    background:
                        'radial-gradient(ellipse at 88% 8%, rgba(158, 203, 255, 0.26), transparent 48%), radial-gradient(ellipse at 6% 100%, rgba(111, 75, 187, 0.32), transparent 50%), linear-gradient(120deg, rgba(37, 55, 74, 0.5), rgba(23, 19, 34, 0.97) 72%)',
                }}
            >
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-60 w-60 animate-aurora rounded-full bg-[#9ecbff]/25 blur-3xl" />
                <SlidersHorizontal aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden h-40 w-40 -translate-y-1/2 text-white/[0.045] lg:block" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-xl">
                        <p className="workspace-eyebrow">ARQUITECTOS DEL SONIDO</p>
                        <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                            El equipo detrás del micrófono.
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-sutil">
                            Productores e ingenieros que convierten una idea en una grabación. Regístralos y coordina la grabación por sesiones.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-texto-soft"><Contador valor={productores.length} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Productores</span>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-[#9ecbff]"><Contador valor={ESPECIALIDADES.length} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Especialidades</span>
                        </div>
                    </div>
                </div>

                {especialidadesPresentes.length > 0 && (
                    <div className="relative mt-6 flex flex-wrap gap-2">
                        {['Todas', ...especialidadesPresentes].map((especialidad) => {
                            const activo = filtroEspecialidad === especialidad;
                            const acento = especialidad === 'Todas' ? '#a477ff' : (ACENTO_ESPECIALIDAD[especialidad] ?? '#a477ff');
                            return (
                                <button
                                    key={especialidad}
                                    type="button"
                                    onClick={() => setFiltroEspecialidad(especialidad)}
                                    aria-pressed={activo}
                                    className="rounded-full border px-3.5 py-1.5 text-xs font-bold transition hover:-translate-y-0.5"
                                    style={
                                        activo
                                            ? { borderColor: acento, background: `${acento}33`, color: '#fff', boxShadow: `0 0 18px ${acento}44` }
                                            : { borderColor: 'var(--color-border, #2d2a45)', background: 'rgba(255,255,255,0.04)', color: '#a69ebd' }
                                    }
                                >
                                    {especialidad}
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            {destacado && (
                <section
                    className="relative mt-5 overflow-hidden rounded-[2rem] border p-5 sm:p-6"
                    style={{ borderColor: `${acentoDestacado}55`, background: 'linear-gradient(120deg, rgba(23,19,34,0.9), rgba(18,15,29,0.95))' }}
                    aria-label="Productor destacado"
                >
                    <span aria-hidden="true" className="pointer-events-none absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full blur-3xl" style={{ background: `${acentoDestacado}33` }} />
                    <div className="relative flex flex-col items-center gap-5 sm:flex-row">
                        <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl text-4xl font-black text-white sm:h-28 sm:w-28" style={{ background: `linear-gradient(135deg, ${acentoDestacado}, #7b3fd6)` }}>
                            {destacado.imagen ? (
                                <img src={destacado.imagen} alt="" className="h-full w-full object-cover" />
                            ) : (
                                iniciales(destacado.nombre)
                            )}
                        </span>
                        <div className="min-w-0 flex-1 text-center sm:text-left">
                            <p className="flex items-center justify-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.16em] sm:justify-start" style={{ color: acentoDestacado }}>
                                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Spotlight · Productor destacado
                            </p>
                            <h3 className="mt-1 text-2xl font-black tracking-tight text-texto-soft">{destacado.nombre}</h3>
                            <p className="mt-1 text-sm text-sutil">{destacado.especialidad} · {destacado.usuario_id ? 'Cuenta vinculada' : 'Perfil del estudio'}</p>
                        </div>
                        <Ecualizador desde="#9365f2" hasta="#9ecbff" />
                    </div>
                </section>
            )}

            <section className="mt-5 rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur" aria-labelledby="producers-list-title">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="workspace-eyebrow">EQUIPO</p>
                        <h2 id="producers-list-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                            Productores registrados
                        </h2>
                    </div>
                    <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent-soft">
                        {productoresFiltrados.length} registrados
                    </span>
                </div>

                {productoresFiltrados.length > 0 ? (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" ref={gridRef}>
                        {productoresFiltrados.map((productor, index) => {
                            const acento = ACENTO_ESPECIALIDAD[productor.especialidad] ?? '#a477ff';
                            const esDestacado = productor === destacado;
                            return (
                                <article
                                    key={productor.id}
                                    className="group relative overflow-hidden rounded-[1.75rem] border bg-[#120f1d]/80 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/50"
                                    style={{ borderColor: esDestacado ? acento : 'var(--color-border, #2d2a45)' }}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="pointer-events-none absolute -inset-px rounded-[1.75rem] opacity-0 blur-xl transition duration-500 group-hover:opacity-60"
                                        style={{ background: `${acento}55` }}
                                    />
                                    <div className="relative h-56 overflow-hidden" style={{ background: RETRATO[index % 4] }}>
                                        {productor.imagen ? (
                                            <img
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                                src={productor.imagen}
                                                alt={`Retrato de ${productor.nombre}`}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ) : (
                                            <span className="grid h-full w-full place-items-center text-6xl font-black tracking-tight text-white/85" aria-hidden="true">
                                                {iniciales(productor.nombre)}
                                            </span>
                                        )}
                                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b0812] via-[#0b0812]/25 to-transparent" />
                                        <div className="absolute inset-x-0 bottom-0 p-4">
                                            <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em]" style={{ color: acento }}>Productor</p>
                                            <h3 className="mt-0.5 text-lg font-bold leading-tight tracking-tight text-texto-soft">{productor.nombre}</h3>
                                            <span
                                                className="mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                                                style={{ borderColor: `${acento}59`, background: `${acento}1f`, color: '#f2effb' }}
                                            >
                                                {productor.especialidad}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <button
                                            className="w-full rounded-xl border px-3 py-2.5 text-sm font-bold text-texto transition hover:brightness-110"
                                            style={{ borderColor: `${acento}66`, background: `${acento}1f` }}
                                            type="button"
                                            onClick={() => setProductorGrabacion(productor)}
                                        >
                                            Grabar canción por sesiones
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="mt-5 rounded-2xl border border-dashed border-border bg-surface/40 px-4 py-6 text-center text-sutil">
                        {productores.length === 0 ? 'Todavía no hay productores registrados.' : 'No hay productores con esa especialidad.'}
                    </p>
                )}
            </section>

            <section className="mt-6 rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur sm:p-7" aria-labelledby="producer-registration-title">
                <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#9365f2] to-[#9ecbff] text-white" aria-hidden="true">
                        <SlidersHorizontal className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="workspace-eyebrow">NUEVO REGISTRO</p>
                        <h2 id="producer-registration-title" className="text-xl font-bold tracking-tight text-texto-soft">Registrar productor</h2>
                    </div>
                </div>

                <form className="grid max-w-2xl gap-4" onSubmit={manejarRegistro}>
                    <label>
                        <span className={ETIQUETA}>Nombre del productor</span>
                        <input
                            className={CAMPO}
                            id="producer-name"
                            name="nombre"
                            type="text"
                            placeholder="Ej: Marco Reyes"
                            value={formulario.nombre}
                            onChange={manejarCambio}
                            required
                        />
                    </label>
                    <label>
                        <span className={ETIQUETA}>Especialidad</span>
                        <select
                            className={CAMPO}
                            id="producer-specialty"
                            name="especialidad"
                            value={formulario.especialidad}
                            onChange={manejarCambio}
                        >
                            {ESPECIALIDADES.map((especialidad) => (
                                <option key={especialidad} value={especialidad}>{especialidad}</option>
                            ))}
                        </select>
                    </label>
                    <div className="grid gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-sutil" htmlFor="producer-image">Foto del productor (opcional)</label>
                        <input
                            className={`${CAMPO} text-xs file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-accent/40 file:bg-accent/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-texto`}
                            id="producer-image"
                            name="imagen"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={manejarImagen}
                        />
                        <span className="text-xs leading-5 text-sutil">JPG, PNG o WebP · máximo 1.5 MB. La foto se guarda en este navegador.</span>
                        {formulario.imagen && (
                            <img
                                className="mt-1 rounded-xl border border-border object-cover"
                                style={{ width: '108px', height: '108px' }}
                                src={formulario.imagen}
                                alt="Vista previa del productor"
                            />
                        )}
                    </div>
                    {error && <p className="m-0 text-sm text-peligro-soft" role="alert">{error}</p>}
                    <button className={`${BOTON_PRIMARIO} w-fit`} disabled={cargandoImagen} type="submit">
                        {cargandoImagen ? 'Cargando imagen…' : 'Registrar productor'}
                    </button>
                </form>
            </section>

            {productorGrabacion && (
                <RegistroGrabacionSesiones
                    productor={productorGrabacion}
                    onCerrar={() => setProductorGrabacion(null)}
                />
            )}
        </main>
    );
}
