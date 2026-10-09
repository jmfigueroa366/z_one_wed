// CAPA: Presentación
import { useMemo, useState } from 'react';
import { ArtistaService } from '../services/artistaService.js';
import '../styles/artistas.css';

const ESPECIALIDADES = ['Pop', 'Vallenato', 'Urbano', 'Rock', 'Salsa', 'Canto', 'Otro'];

function iniciales(nombre) {
    return String(nombre ?? '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0] ?? '')
        .join('')
        .toLocaleUpperCase();
}

export default function Artistas() {
    const [artistas, setArtistas] = useState(() => ArtistaService.listar());
    const [busqueda, setBusqueda] = useState('');
    const [filtroGenero, setFiltroGenero] = useState('Todos');
    const [formulario, setFormulario] = useState({
        nombre: '',
        especialidad: ESPECIALIDADES[0],
        imagen: '',
    });
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [cargandoImagen, setCargandoImagen] = useState(false);

    const generos = useMemo(
        () => [...new Set(artistas.map((artista) => artista.especialidad).filter(Boolean))].sort(),
        [artistas]
    );
    const artistasFiltrados = useMemo(() => artistas.filter((artista) => {
        const coincideBusqueda = `${artista.nombre} ${artista.especialidad}`
            .toLocaleLowerCase()
            .includes(busqueda.trim().toLocaleLowerCase());
        return coincideBusqueda && (filtroGenero === 'Todos' || artista.especialidad === filtroGenero);
    }), [artistas, busqueda, filtroGenero]);

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
            setArtistas((actuales) => [...actuales, nuevoArtista]);
            setFormulario({ nombre: '', especialidad: ESPECIALIDADES[0], imagen: '' });
            const campoImagen = document.getElementById('artist-image');
            if (campoImagen) campoImagen.value = '';
            setFiltroGenero('Todos');
            setBusqueda('');
            setMensaje(`${nuevoArtista.nombre} se agregó al equipo de artistas.`);
        } catch (errorRegistro) {
            setError(errorRegistro instanceof Error ? errorRegistro.message : 'No se pudo registrar el artista.');
        }
    };

    return (
        <main className="workspace-content artists-page" data-page="artistas">
            <header className="page-heading artists-heading">
                <p className="workspace-eyebrow">TALENTO Z-ONE</p>
                <h1>Artistas</h1>
                <p>Conoce a las voces vinculadas al estudio y organiza sus perfiles para próximas sesiones.</p>
            </header>

            <section className="artists-summary" aria-label="Resumen de artistas">
                <div>
                    <span>Artistas activos</span>
                    <strong>{artistas.length}</strong>
                </div>
                <div>
                    <span>Géneros y estilos</span>
                    <strong>{generos.length}</strong>
                </div>
            </section>

            <section className="artists-directory" aria-labelledby="artists-directory-title">
                <div className="artists-section-heading">
                    <div>
                        <p className="workspace-eyebrow">DIRECTORIO</p>
                        <h2 id="artists-directory-title">Talento del estudio</h2>
                    </div>
                    <span className="artists-count">{artistasFiltrados.length} perfiles</span>
                </div>

                <div className="artists-filters">
                    <label className="artists-search">
                        <span>Buscar artista</span>
                        <input
                            type="search"
                            value={busqueda}
                            onChange={(event) => setBusqueda(event.target.value)}
                            placeholder="Nombre o género"
                        />
                    </label>
                    <label className="artists-genre-filter">
                        <span>Género o estilo</span>
                        <select value={filtroGenero} onChange={(event) => setFiltroGenero(event.target.value)}>
                            <option value="Todos">Todos los estilos</option>
                            {generos.map((genero) => <option key={genero} value={genero}>{genero}</option>)}
                        </select>
                    </label>
                </div>

                {artistasFiltrados.length ? (
                    <div className="artists-card-grid">
                        {artistasFiltrados.map((artista, index) => (
                            <article className="artist-directory-card" key={artista.id ?? artista.nombre}>
                                <div className={`artist-directory-portrait artist-directory-portrait-${index % 4}`}>
                                    {artista.imagen ? (
                                        <img src={artista.imagen} alt={`Retrato de ${artista.nombre}`} loading="lazy" decoding="async" />
                                    ) : (
                                        <span className="artist-directory-initials" aria-hidden="true">{iniciales(artista.nombre)}</span>
                                    )}
                                    <span className="artist-directory-status"><span aria-hidden="true">●</span> Activo</span>
                                </div>
                                <div className="artist-directory-body">
                                    <p className="workspace-eyebrow">ARTISTA Z-ONE</p>
                                    <h3>{artista.nombre}</h3>
                                    <span className="artist-directory-genre">{artista.especialidad || 'Artista'}</span>
                                    {artista.usuario_id && <span className="artist-directory-account">Cuenta vinculada al estudio</span>}
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="artists-empty">No hay artistas que coincidan con la búsqueda.</p>
                )}
            </section>

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
        </main>
    );
}
