// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import FormularioArtista from '../components/FormularioArtista.jsx';
import TarjetaArtista, { iniciales } from '../components/TarjetaArtista.jsx';
import { Contador, Ecualizador } from '../components/Animados.jsx';
import { useArtistas } from '../hooks/useArtistas.js';
import { CAMPO, ETIQUETA } from '../styles/clases.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ACENTOS = ['#f04fa6', '#a477ff', '#9ecbff', '#7be0b0', '#ffd166', '#f2a4b1'];
const colorDeGenero = (genero, generos) => ACENTOS[Math.max(0, generos.indexOf(genero)) % ACENTOS.length];

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

    const destacado = artistasFiltrados[0] ?? null;
    const acentoDestacado = destacado ? colorDeGenero(destacado.especialidad, generos) : '#a477ff';

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
                        'radial-gradient(ellipse at 88% 8%, rgba(240, 79, 166, 0.32), transparent 48%), radial-gradient(ellipse at 6% 100%, rgba(111, 75, 187, 0.34), transparent 50%), linear-gradient(120deg, rgba(111, 75, 187, 0.34), rgba(23, 19, 34, 0.97) 72%)',
                }}
            >
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-60 w-60 animate-aurora rounded-full bg-[#e34ba6]/25 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 select-none text-[10rem] font-black leading-none tracking-tighter text-white/[0.045] lg:block">
                    ♪
                </div>
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-xl">
                        <p className="workspace-eyebrow">VOCES DEL ESTUDIO</p>
                        <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                            El talento que da vida al sonido.
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-sutil">
                            Artistas vinculados a Z-ONE listos para grabar, ensayar y producir. Explora por estilo y encuentra la próxima voz de tu proyecto.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-texto-soft"><Contador valor={artistas.length} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Artistas</span>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-accent-soft"><Contador valor={generos.length} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Estilos</span>
                        </div>
                    </div>
                </div>

                {generos.length > 0 && (
                    <div className="relative mt-6 flex flex-wrap gap-2">
                        {['Todos', ...generos].map((genero) => {
                            const activo = filtroGenero === genero;
                            const acento = genero === 'Todos' ? '#a477ff' : colorDeGenero(genero, generos);
                            return (
                                <button
                                    key={genero}
                                    type="button"
                                    onClick={() => setFiltroGenero(genero)}
                                    aria-pressed={activo}
                                    className="rounded-full border px-3.5 py-1.5 text-xs font-bold transition hover:-translate-y-0.5"
                                    style={
                                        activo
                                            ? { borderColor: acento, background: `${acento}33`, color: '#fff', boxShadow: `0 0 18px ${acento}44` }
                                            : { borderColor: 'var(--color-border, #2d2a45)', background: 'rgba(255,255,255,0.04)', color: '#a69ebd' }
                                    }
                                >
                                    {genero}
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
                    aria-label="Artista destacado"
                >
                    <span aria-hidden="true" className="pointer-events-none absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full blur-3xl" style={{ background: `${acentoDestacado}33` }} />
                    <div className="relative flex flex-col items-center gap-5 sm:flex-row">
                        <span className="relative shrink-0">
                            <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl text-4xl font-black text-white sm:h-28 sm:w-28" style={{ background: `linear-gradient(135deg, ${acentoDestacado}, #e34ba6)` }}>
                                {destacado.imagen ? (
                                    <img src={destacado.imagen} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    iniciales(destacado.nombre)
                                )}
                            </span>
                        </span>
                        <div className="min-w-0 flex-1 text-center sm:text-left">
                            <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.16em]" style={{ color: acentoDestacado }}>Spotlight · Artista destacado</p>
                            <h3 className="mt-1 text-2xl font-black tracking-tight text-texto-soft">{destacado.nombre}</h3>
                            <p className="mt-1 text-sm text-sutil">{destacado.especialidad || 'Artista'} · {destacado.usuario_id ? 'Cuenta vinculada' : 'Perfil del estudio'}</p>
                        </div>
                        <Ecualizador />
                    </div>
                </section>
            )}

            <section className="mt-5 rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur" aria-labelledby="artists-directory-title">
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
                            <TarjetaArtista
                                key={artista.id ?? artista.nombre}
                                artista={artista}
                                index={index}
                                acento={colorDeGenero(artista.especialidad, generos)}
                                destacado={artista === destacado}
                            />
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
