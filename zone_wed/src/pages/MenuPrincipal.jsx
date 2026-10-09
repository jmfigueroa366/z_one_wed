// CAPA: Presentación
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSesiones } from '../hooks/useSesiones.js';
import { artistasDestacados } from '../data/artistasDestacados.js';
import { productoresDestacados } from '../data/productoresDestacados.js';
import { RUTAS, rutasPermitidasPorRol } from '../config/rutas.js';
import '../styles/principal.css';

export default function MenuPrincipal() {
    const { usuario } = useAuth();
    const rutasPermitidas = rutasPermitidasPorRol(usuario?.rol);
    const puedeGestionarSesiones = rutasPermitidas.includes(RUTAS.SESIONES);
    const [sesiones] = useSesiones();
    const sesionesActivas = sesiones.filter((sesion) =>
        ['confirmada', 'en_proceso'].includes(sesion.estado)
    ).length;
    return (
        <main className="workspace-content dashboard-content">
            <section className="dashboard-hero">
                <p className="workspace-eyebrow">PANEL PRINCIPAL · GESTIÓN MUSICAL</p>
                <h1>Hola, {usuario?.nombre ?? 'usuario'}.</h1>
                <p>Bienvenido al centro operativo de Z-ONE. Organiza la producción y coordina las sesiones del estudio.</p>
                {puedeGestionarSesiones && (
                    <div className="dashboard-actions">
                        <Link className="dashboard-action-primary" to={`${RUTAS.SESIONES}#crear`}>
                            Crear sesión
                        </Link>
                        <Link className="dashboard-action-secondary" to={`${RUTAS.SESIONES}#registrar`}>
                            Registrar sesión
                        </Link>
                    </div>
                )}
            </section>

            <section className="dashboard-summary" aria-label="Resumen del estudio">
                <article className="dashboard-summary-card dashboard-summary-card-primary">
                    <span className="dashboard-card-icon" aria-hidden="true">●</span>
                    <p>Estado de la plataforma</p>
                    <strong>Producción activa</strong>
                    <span className="dashboard-card-note">Servicios del estudio disponibles</span>
                </article>
                <article className="dashboard-summary-card">
                    <span className="dashboard-card-icon" aria-hidden="true">◷</span>
                    <p>Sesiones activas</p>
                    <strong>{sesionesActivas}</strong>
                    <span className="dashboard-card-note">Confirmadas o en proceso</span>
                </article>
                <article className="dashboard-summary-card">
                    <span className="dashboard-card-icon" aria-hidden="true">✦</span>
                    <p>Sesiones registradas</p>
                    <strong>{sesiones.length}</strong>
                    <span className="dashboard-card-note">En la agenda del estudio</span>
                </article>
            </section>

            <section className="dashboard-information">
                <div>
                    <p className="workspace-eyebrow">INFORMACIÓN DE Z-ONE</p>
                    <h2>Una gestión musical centralizada</h2>
                    <p className="dashboard-information-copy">
                        Z-ONE reúne la producción musical, el talento, las salas y la agenda para facilitar la coordinación del estudio.
                    </p>
                </div>
                <div className="dashboard-information-grid">
                    {rutasPermitidas.includes(RUTAS.SESIONES) && (
                        <article>
                            <h3>Producción</h3>
                            <p>Organiza tus sesiones y consulta la actividad del estudio.</p>
                            <Link to={RUTAS.SESIONES}>Ir a sesiones <span aria-hidden="true">→</span></Link>
                        </article>
                    )}
                    {rutasPermitidas.includes(RUTAS.AGENDA) && (
                        <article>
                            <h3>Agenda</h3>
                            <p>Consulta las reservas y actividades programadas.</p>
                            <Link to={RUTAS.AGENDA}>Abrir agenda <span aria-hidden="true">→</span></Link>
                        </article>
                    )}
                    {rutasPermitidas.includes(RUTAS.ARTISTAS) && (
                        <article>
                            <h3>Equipo creativo</h3>
                            <p>Explora artistas y productores del estudio.</p>
                            <Link to={RUTAS.ARTISTAS}>Ver artistas <span aria-hidden="true">→</span></Link>
                        </article>
                    )}
                </div>
            </section>

            <section className="artist-showcase" aria-labelledby="artist-showcase-title">
                <div className="artist-showcase-heading">
                    <div>
                        <p className="workspace-eyebrow">VOCES QUE INSPIRAN</p>
                        <h2 id="artist-showcase-title">Artistas destacados</h2>
                        <p className="artist-showcase-copy">
                            Un recorrido por artistas colombianos y latinos que dejan huella en distintos sonidos.
                        </p>
                    </div>
                    <span className="artist-showcase-count">05 PERFILES</span>
                </div>
                <div className="artist-showcase-grid">
                    {artistasDestacados.map((artista, index) => (
                        <article
                            className="artist-feature-card"
                            key={artista.nombre}
                            style={{ '--artist-index': index }}
                        >
                            <div className="artist-feature-portrait">
                                {artista.imagen ? (
                                    <img
                                        src={artista.imagen}
                                        alt={artista.textoAlternativo}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div className="artist-feature-placeholder" role="img" aria-label="Ilustración tipográfica para Luisra">
                                        <span>{artista.iniciales}</span>
                                        <p>PRINCESA</p>
                                        <span className="artist-placeholder-note">Retrato por confirmar</span>
                                    </div>
                                )}
                            </div>
                            <div className="artist-feature-body">
                                <p className="artist-feature-origin">{artista.origen}</p>
                                <h3>{artista.nombre}</h3>
                                <span className="artist-feature-style">{artista.estilo}</span>
                                <p className="artist-feature-history">{artista.historia}</p>
                                {artista.fotografia ? (
                                    <p className="artist-photo-credit">
                                        Foto:{' '}
                                        <a href={artista.fuenteFotografia} target="_blank" rel="noopener noreferrer">
                                            {artista.fotografia}
                                        </a>
                                        {' · '}
                                        <a href={artista.fuenteLicencia} target="_blank" rel="noopener noreferrer">
                                            {artista.licencia}
                                        </a>
                                    </p>
                                ) : (
                                    <p className="artist-photo-credit">Retrato público pendiente de identificación.</p>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="artist-showcase producer-showcase" aria-labelledby="producer-showcase-title">
                <div className="artist-showcase-heading">
                    <div>
                        <p className="workspace-eyebrow">ARQUITECTOS DEL SONIDO</p>
                        <h2 id="producer-showcase-title">Productores destacados</h2>
                        <p className="artist-showcase-copy">
                            Cuatro productores cuya visión y trabajo en el estudio ayudaron a transformar la historia de la música.
                        </p>
                    </div>
                    <span className="artist-showcase-count">04 PRODUCTORES</span>
                </div>
                <div className="producer-showcase-grid">
                    {productoresDestacados.map((productor, index) => (
                        <article
                            className="artist-feature-card producer-feature-card"
                            key={productor.nombre}
                            style={{ '--artist-index': index }}
                        >
                            <div className="artist-feature-portrait">
                                <img
                                    src={productor.imagen}
                                    alt={productor.textoAlternativo}
                                    loading="lazy"
                                    decoding="async"
                                />
                            </div>
                            <div className="artist-feature-body">
                                <p className="artist-feature-origin">{productor.origen}</p>
                                <h3>{productor.nombre}</h3>
                                <span className="artist-feature-style">{productor.estilo}</span>
                                <p className="artist-feature-history">{productor.historia}</p>
                                <p className="artist-photo-credit">
                                    Foto: {productor.fuenteFoto ? (
                                        <a href={productor.fuenteFoto} target="_blank" rel="noopener noreferrer">
                                            {productor.credito}
                                        </a>
                                    ) : productor.credito}
                                    {productor.licencia && (
                                        <>
                                            {' · '}
                                            {productor.fuenteLicencia ? (
                                                <a href={productor.fuenteLicencia} target="_blank" rel="noopener noreferrer">
                                                    {productor.licencia}
                                                </a>
                                            ) : productor.licencia}
                                        </>
                                    )}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}