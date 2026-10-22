// CAPA: Presentaci��n
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { ArtistaService } from '../services/artistaService.ts';
import { BOTON_PRIMARIO, CAMPO, ETIQUETA } from '../styles/clases.ts';
import '../styles/tailwind.css';

const ESPECIALIDADES = ['Pop', 'Vallenato', 'Urbano', 'Rock', 'Salsa', 'Canto', 'Otro'];

interface FormularioArtistaProps {
    onRegistrado: () => void;
}

export default function FormularioArtista({ onRegistrado: _onRegistrado }: FormularioArtistaProps) {
    const [formulario, setFormulario] = useState({
        nombre: '',
        especialidad: ESPECIALIDADES[0],
        imagen: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [cargandoImagen, setCargandoImagen] = useState(false);

    const cambiarCampo = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setFormulario((actual) => ({ ...actual, [name]: value }));
        setError('');
        setMensaje('');
    };

    const manejarImagen = (event: ChangeEvent<HTMLInputElement>) => {
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
                setFormulario((actual) => ({ ...actual, imagen: lector.result as string }));
            }
            setCargandoImagen(false);
        };
        lector.onerror = () => {
            setError('No se pudo leer la imagen seleccionada.');
            setCargandoImagen(false);
        };
        lector.readAsDataURL(archivo);
    };

    const registrarArtista = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setMensaje('');

        try {
            const nuevoArtista = await ArtistaService.crear(formulario);
            const correoCreado = formulario.email;
            setFormulario({ nombre: '', especialidad: ESPECIALIDADES[0], imagen: '', email: '', password: '' });
            const campoImagen = document.getElementById('artist-image') as HTMLInputElement | null;
            if (campoImagen) campoImagen.value = '';
            setMensaje(`${nuevoArtista.nombre} se agregó al equipo de artistas. Cuenta: ${correoCreado}`);
        } catch (errorRegistro) {
            setError(errorRegistro instanceof Error ? errorRegistro.message : 'No se pudo registrar el artista.');
        }
    };

    return (
        <section className="rounded-3xl border border-border bg-surface/70 p-6" aria-labelledby="artist-registration-title">
            <div>
                <p className="workspace-eyebrow">NUEVO TALENTO</p>
                <h2 id="artist-registration-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                    Registrar artista
                </h2>
            </div>

            <form className="mt-5 grid max-w-2xl gap-4" onSubmit={registrarArtista}>
                <label>
                    <span className={ETIQUETA}>Nombre artístico</span>
                    <input
                        className={CAMPO}
                        name="nombre"
                        type="text"
                        value={formulario.nombre}
                        onChange={cambiarCampo}
                        placeholder="Ej: Luna Mar"
                        maxLength={80}
                        required
                    />
                </label>
                <label>
                    <span className={ETIQUETA}>Correo electrónico (para login)</span>
                    <input
                        className={CAMPO}
                        name="email"
                        type="email"
                        value={formulario.email}
                        onChange={cambiarCampo}
                        placeholder="artista@correo.com"
                        required
                    />
                </label>
                <label>
                    <span className={ETIQUETA}>Contraseña (para login)</span>
                    <input
                        className={CAMPO}
                        name="password"
                        type="password"
                        value={formulario.password}
                        onChange={cambiarCampo}
                        placeholder="Mínimo 6 caracteres"
                        required
                    />
                </label>
                <label>
                    <span className={ETIQUETA}>Género o estilo</span>
                    <select className={CAMPO} name="especialidad" value={formulario.especialidad} onChange={cambiarCampo}>
                        {ESPECIALIDADES.map((especialidad) => (
                            <option key={especialidad} value={especialidad}>{especialidad}</option>
                        ))}
                    </select>
                </label>
                <div className="grid gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-sutil" htmlFor="artist-image">
                        Foto del artista (opcional)
                    </label>
                    <input
                        className={`${CAMPO} text-xs file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-accent/40 file:bg-accent/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-texto`}
                        id="artist-image"
                        name="imagen"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={manejarImagen}
                    />
                    <span className="text-xs leading-5 text-sutil">
                        JPG, PNG o WebP �� mǭximo 1.5 MB. La foto se guarda en este navegador.
                    </span>
                    {formulario.imagen && (
                        <img
                            className="mt-1.5 rounded-xl border border-border object-cover"
                            style={{ width: '108px', height: '108px' }}
                            src={formulario.imagen}
                            alt="Vista previa del artista"
                        />
                    )}
                </div>
                {error && <p className="m-0 text-sm text-peligro-soft" role="alert">{error}</p>}
                {mensaje && <p className="m-0 text-sm text-exito-soft" role="status">{mensaje}</p>}
                <button className={`${BOTON_PRIMARIO} w-fit`} disabled={cargandoImagen} type="submit">
                    {cargandoImagen ? 'Cargando imagen�?�' : 'Registrar artista'}
                </button>
            </form>
        </section>
    );
}
