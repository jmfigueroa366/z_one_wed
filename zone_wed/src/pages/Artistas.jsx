// CAPA: Presentación
import { useMemo, useState } from 'react';
import FormularioArtista from '../components/FormularioArtista.jsx';
import TarjetaArtista from '../components/TarjetaArtista.jsx';
import { useArtistas } from '../hooks/useArtistas.js';
import '../styles/artistas.css';

export default function Artistas() {
    const [artistas] = useArtistas();
    const [busqueda, setBusqueda] = useState('');
    const [filtroGenero, setFiltroGenero] = useState('Todos');

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
                            <TarjetaArtista key={artista.id ?? artista.nombre} artista={artista} index={index} />
                        ))}
                    </div>
                ) : (
                    <p className="artists-empty">No hay artistas que coincidan con la búsqueda.</p>
                )}
            </section>

            <FormularioArtista
                onRegistrado={() => {
                    setFiltroGenero('Todos');
                    setBusqueda('');
                }}
            />
        </main>
    );
}