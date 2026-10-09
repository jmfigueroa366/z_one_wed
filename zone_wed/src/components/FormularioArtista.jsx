// CAPA: Presentación
import { useState } from 'react';
import { ArtistaService } from '../services/artistaService.js';

const ESPECIALIDADES = ['Pop', 'Vallenato', 'Urbano', 'Rock', 'Salsa', 'Canto', 'Otro'];

export default function FormularioArtista({ onRegistrado }) {
    const [formulario, setFormulario] = useState({
        nombre: '',
        especialidad: ESPECIALIDADES[0],
        imagen: '',
    });
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [cargandoImagen, setCargandoImagen] = useState(false);

    const cambiarCampo = (event) => {
        const { name, value } = event.target;
        setFormulario((actual) => ({ ...actual, [name]: value }));
        setError('');
        setMensaje('');
    };

    const manejarImagen = (event) => {
        const archivo = event.target.files?.[0];
        setError('');
        setMensaje('');

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

    const registrarArtista = (event) => {
        event.preventDefault();
        setError('');
        setMensaje('');

        try {
            const nuevoArtista = ArtistaService.crear(formulario);
            setFormulario({ nombre: '', especialidad: ESPECIALIDADES[0], imagen: '' });
            const campoImagen = document.getElementById('artist-image');
            if (campoImagen) campoImagen.value = '';
            setMensaje(`${nuevoArtista.nombre} se agregó al equipo de artistas.`);
        } catch (errorRegistro) {
            setError(errorRegistro instanceof Error ? errorRegistro.message : 'No se pudo registrar el artista.');
        }
    };

    return (
        <section className="artists-registration" aria-labelledby="artist-registration-title">
            <div className="artists-section-heading">
                <div>
                    <p className="workspace-eyebrow">NUEVO TALENTO</p>
                    <h2 id="artist-registration-title">Registrar artista</h2>
                </div>
            </div>

            <form className="artist-form" onSubmit={registrarArtista}>
                <label className="artist-form-field">
                    <span>Nombre artístico</span>
                    <input
                        name="nombre"
                        type="text"
                        value={formulario.nombre}
                        onChange={cambiarCampo}
                        placeholder="Ej: Luna Mar"
                        maxLength={80}
                        required
                    />
                </label>
                <label className="artist-form-field">
                    <span>Género o estilo</span>
                    <select name="especialidad" value={formulario.especialidad} onChange={cambiarCampo}>
                        {ESPECIALIDADES.map((especialidad) => (
                            <option key={especialidad} value={especialidad}>{especialidad}</option>
                        ))}
                    </select>
                </label>
                <div className="artist-form-field artist-image-field">
                    <label htmlFor="artist-image">Foto del artista (opcional)</label>
                    <input
                        id="artist-image"
                        name="imagen"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={manejarImagen}
                    />
                    <span className="artist-image-hint">JPG, PNG o WebP · máximo 1.5 MB. La foto se guarda en este navegador.</span>
                    {formulario.imagen && (
                        <img className="artist-image-preview" src={formulario.imagen} alt="Vista previa del artista" />
                    )}
                </div>
                {error && <p className="artist-form-message artist-form-error" role="alert">{error}</p>}
                {mensaje && <p className="artist-form-message artist-form-success" role="status">{mensaje}</p>}
                <button className="artist-submit" disabled={cargandoImagen} type="submit">
                    {cargandoImagen ? 'Cargando imagen…' : 'Registrar artista'}
                </button>
            </form>
        </section>
    );
}