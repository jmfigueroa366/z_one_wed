// CAPA: Presentación
import { useState } from 'react';
import RegistroGrabacionSesiones from '../components/RegistroGrabacionSesiones.jsx';
import { useProductores } from '../hooks/useProductores.js';
import { ProductorService } from '../services/productorService.js';
import { BOTON_PRIMARIO, CAMPO } from '../styles/clases.js';
import '../styles/tailwind.css';

const ESPECIALIDADES = ['Grabación', 'Mezcla', 'Masterización', 'Producción musical'];

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
        } catch (errorRegistro) {
            setError(errorRegistro.message || 'No se pudo registrar el productor.');
        }
    };

    return (
        <main className="workspace-content" data-page="productores">
            <header className="page-heading border-l-4 border-[#c08ce8] pl-4">
                <p className="workspace-eyebrow">GESTIÓN DE PRODUCTORES</p>
                <h1>Productores registrados</h1>
                <p>El equipo técnico detrás de cada sesión y lanzamiento.</p>
            </header>

            <section
                className="relative mt-6 overflow-hidden rounded-[2rem] border border-[#c08ce8]/25 p-6 sm:p-8"
                style={{
                    background:
                        'radial-gradient(ellipse at 88% 8%, rgba(192, 140, 232, 0.28), transparent 48%), linear-gradient(120deg, rgba(111, 75, 187, 0.32), rgba(23, 19, 34, 0.97) 72%)',
                }}
            >
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-60 w-60 animate-aurora rounded-full bg-[#c08ce8]/25 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 select-none text-[10rem] font-black leading-none tracking-tighter text-white/[0.04] lg:block">
                    🎛
                </div>
                <div className="relative max-w-2xl">
                    <p className="workspace-eyebrow">ARQUITECTOS DEL SONIDO</p>
                    <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                        El equipo detrás del micrófono.
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-sutil">
                        Productores e ingenieros que convierten una idea en una grabación. Regístralos y coordina la grabación por sesiones.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-4">
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                            <span className="block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Productores</span>
                            <strong className="text-2xl font-black text-texto-soft">{String(productores.length).padStart(2, '0')}</strong>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                            <span className="block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Especialidades</span>
                            <strong className="text-2xl font-black text-accent-soft">{String(ESPECIALIDADES.length).padStart(2, '0')}</strong>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-6 rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur" aria-labelledby="producers-list-title">
                <div>
                    <p className="workspace-eyebrow">EQUIPO</p>
                    <h2 id="producers-list-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                        Productores registrados
                    </h2>
                </div>

                {productores.length > 0 ? (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {productores.map((productor, index) => (
                            <article
                                key={productor.id}
                                className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-[#120f1d]/80 transition duration-300 hover:-translate-y-1.5 hover:border-[#c08ce8]/60 hover:shadow-2xl hover:shadow-black/50"
                            >
                                <div className="relative h-56 overflow-hidden" style={{ background: RETRATO[index % 4] }}>
                                    {productor.imagen ? (
                                        <img
                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                                            src={productor.imagen}
                                            alt={`Retrato de ${productor.nombre}`}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <span className="grid h-full w-full place-items-center text-6xl font-black tracking-tight text-white/85" aria-hidden="true">
                                            {iniciales(productor.nombre)}
                                        </span>
                                    )}
                                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b0812] via-[#0b0812]/25 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-4">
                                        <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-accent-soft">Productor</p>
                                        <h3 className="mt-0.5 text-lg font-bold leading-tight tracking-tight text-texto-soft">{productor.nombre}</h3>
                                        <span className="mt-1 inline-block rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-texto">
                                            {productor.especialidad}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <button
                                        className="w-full rounded-xl border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm font-bold text-texto transition hover:border-accent/60 hover:brightness-110"
                                        type="button"
                                        onClick={() => setProductorGrabacion(productor)}
                                    >
                                        Grabar canción por sesiones
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="mt-5 rounded-2xl border border-dashed border-border bg-surface/40 px-4 py-6 text-center text-sutil">
                        Todavía no hay productores registrados.
                    </p>
                )}
            </section>

            <section className="mt-6 rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur sm:p-7" aria-labelledby="producer-registration-title">
                <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#9365f2] to-[#c08ce8] text-lg text-white" aria-hidden="true">🎛</span>
                    <div>
                        <p className="workspace-eyebrow">NUEVO REGISTRO</p>
                        <h2 id="producer-registration-title" className="text-xl font-bold tracking-tight text-texto-soft">Registrar productor</h2>
                    </div>
                </div>

                <form className="grid max-w-2xl gap-4" onSubmit={manejarRegistro}>
                    <div className="grid gap-2">
                        <label className="text-sm font-semibold text-texto" htmlFor="producer-name">Nombre del productor</label>
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
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-semibold text-texto" htmlFor="producer-specialty">Especialidad</label>
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
                    </div>
                    <div className="grid gap-1.5">
                        <label className="text-sm font-semibold text-texto" htmlFor="producer-image">Foto del productor (opcional)</label>
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
