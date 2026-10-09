// CAPA: Presentación
import { useState } from 'react';
import RegistroGrabacionSesiones from '../components/RegistroGrabacionSesiones.jsx';
import { useProductores } from '../hooks/useProductores.js';
import { ProductorService } from '../services/productorService.js';
import { BOTON_PRIMARIO, CAMPO } from '../styles/clases.js';
import '../styles/tailwind.css';

const ESPECIALIDADES = ['Grabación', 'Mezcla', 'Masterización', 'Producción musical'];

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

            <section className="mt-6 rounded-3xl border border-border bg-surface/70 p-6" aria-labelledby="producers-list-title">
                <div>
                    <p className="workspace-eyebrow">GESTIÓN DE PRODUCTORES</p>
                    <h2 id="producers-list-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                        Productores registrados
                    </h2>
                </div>

                {productores.length > 0 ? (
                    <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                        {productores.map((productor) => (
                            <article
                                className="flex min-w-0 items-center gap-3.5 rounded-xl border border-border bg-white/[0.035] p-3.5 transition hover:-translate-y-0.5 hover:border-[#c08ce8]"
                                key={productor.id}
                            >
                                {productor.imagen ? (
                                    <img
                                        className="h-14 w-14 flex-none rounded-xl border border-[#c08ce8]/25 object-cover"
                                        src={productor.imagen}
                                        alt={`Retrato de ${productor.nombre}`}
                                    />
                                ) : (
                                    <span
                                        className="grid h-14 w-14 flex-none place-items-center rounded-xl border border-[#c08ce8]/25 text-base font-black tracking-tight text-[#dbcaff]"
                                        style={{ background: 'radial-gradient(circle at 30% 20%, rgba(240, 79, 166, 0.26), transparent 55%), rgba(147, 101, 242, 0.16)' }}
                                        aria-hidden="true"
                                    >
                                        {iniciales(productor.nombre)}
                                    </span>
                                )}
                                <div className="grid min-w-0 flex-1 gap-1">
                                    <strong className="break-words text-texto-soft">{productor.nombre}</strong>
                                    <span className="text-sm text-sutil">{productor.especialidad}</span>
                                    <button
                                        className="mt-0.5 w-fit rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-xs font-bold text-texto transition hover:border-accent/60 hover:brightness-110"
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
                    <p className="py-3 text-sutil">Todavía no hay productores registrados.</p>
                )}

                <div className="mt-6 border-t border-border pt-5">
                    <p className="workspace-eyebrow">NUEVO REGISTRO</p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-texto-soft">Registrar productor</h2>
                </div>

                <form className="mt-4 grid max-w-2xl gap-4" onSubmit={manejarRegistro}>
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
