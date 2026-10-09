// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import FormularioArtista from '../components/FormularioArtista.jsx';
import TarjetaArtista from '../components/TarjetaArtista.jsx';
import { useArtistas } from '../hooks/useArtistas.js';
import { CAMPO, ETIQUETA } from '../styles/clases.js';
import '../styles/tailwind.css';

export default function Artistas() {
    const [artistas] = useArtistas();
    const [busqueda, setBusqueda] = useState('');
    const [filtroGenero, setFiltroGenero] = useState('Todos');
    const gridRef = useRef(null);

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

    useEffect(() => {
        const grid = gridRef.current;
        if (!grid || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        const animacion = anime({
            targets: grid.children,
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 480,
            delay: anime.stagger(70),
            easing: 'easeOutCubic',
        });

        return () => animacion.pause();
    }, [artistasFiltrados]);

    return (
        <main className="workspace-content" data-page="artistas">
            <header className="page-heading border-l-4 border-magenta pl-4">
                <p className="workspace-eyebrow">TALENTO Z-ONE</p>
                <h1>Artistas</h1>
                <p>Conoce a las voces vinculadas al estudio y organiza sus perfiles para próximas sesiones.</p>
            </header>

            <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-label="Resumen de artistas">
                <div className="rounded-2xl border border-border bg-surface/70 px-5 py-4">
                    <span className="text-sm text-sutil">Artistas activos</span>
                    <strong className="mt-1 block text-3xl font-black text-texto-soft">{artistas.length}</strong>
                </div>
                <div className="rounded-2xl border border-border bg-surface/70 px-5 py-4">
                    <span className="text-sm text-sutil">Géneros y estilos</span>
                    <strong className="mt-1 block text-3xl font-black text-accent-soft">{generos.length}</strong>
                </div>
            </section>

            <section className="mt-6 rounded-3xl border border-border bg-surface/70 p-6" aria-labelledby="artists-directory-title">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="workspace-eyebrow">DIRECTORIO</p>
                        <h2 id="artists-directory-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                            Talento del estudio
                        </h2>
                    </div>
                    <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent-soft">
                        {artistasFiltrados.length} perfiles
                    </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label>
                        <span className={ETIQUETA}>Buscar artista</span>
                        <input
                            className={CAMPO}
                            type="search"
                            value={busqueda}
                            onChange={(event) => setBusqueda(event.target.value)}
                            placeholder="Nombre o género"
                        />
                    </label>
                    <label>
                        <span className={ETIQUETA}>Género o estilo</span>
                        <select className={CAMPO} value={filtroGenero} onChange={(event) => setFiltroGenero(event.target.value)}>
                            <option value="Todos">Todos los estilos</option>
                            {generos.map((genero) => <option key={genero} value={genero}>{genero}</option>)}
                        </select>
                    </label>
                </div>

                {artistasFiltrados.length ? (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" ref={gridRef}>
                        {artistasFiltrados.map((artista, index) => (
                            <TarjetaArtista key={artista.id ?? artista.nombre} artista={artista} index={index} />
                        ))}
                    </div>
                ) : (
                    <p className="py-4 text-center text-sutil">No hay artistas que coincidan con la búsqueda.</p>
                )}
            </section>

            <div className="mt-6">
                <FormularioArtista
                    onRegistrado={() => {
                        setFiltroGenero('Todos');
                        setBusqueda('');
                    }}
                />
            </div>
        </main>
    );
}
