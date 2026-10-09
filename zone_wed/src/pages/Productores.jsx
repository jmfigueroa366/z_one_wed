// CAPA: Presentación
import { useState } from 'react';
import RegistroGrabacionSesiones from '../components/RegistroGrabacionSesiones.jsx';
import { useProductores } from '../hooks/useProductores.js';
import { ProductorService } from '../services/productorService.js';
import '../styles/productores.css';

const ESPECIALIDADES = ['Grabación', 'Mezcla', 'Masterización', 'Producción musical'];

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
        <main className="workspace-content producers-page" data-page="productores">
            <header className="page-heading">
                <p className="workspace-eyebrow">GESTIÓN DE PRODUCTORES</p>
                <h1>Productores registrados</h1>
                <p>El equipo técnico detrás de cada sesión y lanzamiento.</p>
            </header>

            <section className="producers-card" aria-labelledby="producers-list-title">
                <div className="producers-section-heading">
                    <p className="workspace-eyebrow">GESTIÓN DE PRODUCTORES</p>
                    <h2 id="producers-list-title">Productores registrados</h2>
                </div>

                {productores.length > 0 ? (
                    <div className="record-grid">
                        {productores.map((productor) => (
                            <article className="producer-record-card" key={productor.id}>
                                {productor.imagen ? (
                                    <img className="producer-record-image" src={productor.imagen} alt={`Retrato de ${productor.nombre}`} />
                                ) : (
                                    <span className="producer-record-placeholder" aria-hidden="true">
                                        {productor.nombre.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toLocaleUpperCase()}
                                    </span>
                                )}
                                <div>
                                    <strong>{productor.nombre}</strong>
                                    <span>{productor.especialidad}</span>
                                    <button
                                        className="producer-record-action"
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
                    <p className="producers-empty">Todavía no hay productores registrados.</p>
                )}

                <div className="producers-section-heading registration-heading">
                    <p className="workspace-eyebrow">NUEVO REGISTRO</p>
                    <h2>Registrar productor</h2>
                </div>

                <form className="producer-form" onSubmit={manejarRegistro}>
                    <div className="producer-form-row">
                        <label htmlFor="producer-name">Nombre del productor</label>
                        <input
                            id="producer-name"
                            name="nombre"
                            type="text"
                            placeholder="Ej: Marco Reyes"
                            value={formulario.nombre}
                            onChange={manejarCambio}
                            required
                        />
                    </div>
                    <div className="producer-form-row">
                        <label htmlFor="producer-specialty">Especialidad</label>
                        <select
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
                    <div className="producer-form-row">
                        <label htmlFor="producer-image">Foto del productor (opcional)</label>
                        <input
                            id="producer-image"
                            name="imagen"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={manejarImagen}
                        />
                        <span className="producer-image-hint">JPG, PNG o WebP · máximo 1.5 MB. La foto se guarda en este navegador.</span>
                        {formulario.imagen && (
                            <img className="producer-image-preview" src={formulario.imagen} alt="Vista previa del productor" />
                        )}
                    </div>
                    {error && <p className="producer-error" role="alert">{error}</p>}
                    <button className="producer-submit" disabled={cargandoImagen} type="submit">
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
