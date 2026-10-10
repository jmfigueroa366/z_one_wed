// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import FormularioArtista from '../components/FormularioArtista.jsx';
import TarjetaArtista from '../components/TarjetaArtista.jsx';
import { useArtistas } from '../hooks/useArtistas.js';
import { CAMPO, ETIQUETA } from '../styles/clases.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    }, [artistasFiltrados]);

    return (
        <main className="workspace-content" data-page="artistas">
            <header className="page-heading border-l-4 border-magenta pl-4">
                <p className="workspace-eyebrow">TALENTO Z-ONE</p>
                <h1>Artistas</h1>
                <p>Conoce a las voces vinculadas al estudio y organiza sus perfiles para próximas sesiones.</p>
            </header>

            <section
                className="relative mt-6 overflow-hidden rounded-[2rem] border border-magenta/25 p-6 sm:p-8"
                style={{
                    background:
                        'radial-gradient(ellipse at 88% 8%, rgba(240, 79, 166, 0.3), transparent 48%), linear-gradient(120deg, rgba(111, 75, 187, 0.34), rgba(23, 19, 34, 0.97) 72%)',
                }}
            >
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-60 w-60 animate-aurora rounded-full bg-[#e34ba6]/25 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 select-none text-[10rem] font-black leading-none tracking-tighter text-white/[0.04] lg:block">
                    ♪
                </div>
                <div className="relative">
                    <p className="workspace-eyebrow">VOCES DEL ESTUDIO</p>
                    <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                        El talento que da vida al sonido.
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-sutil">
                        Artistas vinculados a Z-ONE listos para grabar, ensayar y producir. Explora por estilo y encuentra la próxima voz de tu proyecto.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-4">
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                            <span className="block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Artistas activos</span>
                            <strong className="text-2xl font-black text-texto-soft">{String(artistas.length).padStart(2, '0')}</strong>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                            <span className="block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Géneros y estilos</span>
                            <strong className="text-2xl font-black text-accent-soft">{String(generos.length).padStart(2, '0')}</strong>
                        </div>
                    </div>
                    {generos.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {['Todos', ...generos].map((genero) => {
                                const activo = filtroGenero === genero;
                                return (
                                    <button
                                        key={genero}
                                        type="button"
                                        onClick={() => setFiltroGenero(genero)}
                                        aria-pressed={activo}
                                        className={
                                            activo
                                                ? 'rounded-full border border-accent/60 bg-gradient-to-r from-[#9365f2]/50 to-[#e34ba6]/40 px-3.5 py-1.5 text-xs font-bold text-white transition'
                                                : 'rounded-full border border-border bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-sutil transition hover:border-accent/50 hover:text-texto'
                                        }
                                    >
                                        {genero}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-6 rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur" aria-labelledby="artists-directory-title">
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
                    <p className="mt-5 py-6 text-center text-sutil">No hay artistas que coincidan con la búsqueda.</p>
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
