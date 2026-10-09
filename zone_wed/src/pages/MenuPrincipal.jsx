// CAPA: Presentación
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SesionService } from '../services/sesionService.js';
import { RUTAS, rutasPermitidasPorRol } from '../config/rutas.js';
import '../styles/principal.css';

const artistasDestacados = [
    {
        nombre: 'Shakira',
        origen: 'Barranquilla, Colombia',
        estilo: 'Pop latino · fusión',
        historia: 'Cantautora colombiana nacida en Barranquilla, desarrolló una carrera internacional reconocida por combinar pop, rock y ritmos latinos. Sus canciones han llevado sonidos y expresiones de la música en español a públicos de todo el mundo.',
        imagen: '/Imagenes/artistas/shakira.jpg',
        textoAlternativo: 'Shakira en la gala de los Latin Grammy de 2023',
        fotografia: 'Junta de Andalucía',
        fuenteFotografia: 'https://commons.wikimedia.org/wiki/File:2023-11-16_Gala_de_los_Latin_Grammy,_03_(cropped)02.jpg',
        licencia: 'CC BY-SA 2.0',
        fuenteLicencia: 'https://creativecommons.org/licenses/by-sa/2.0/',
    },
    {
        nombre: 'Luisra',
        origen: 'Artista destacado',
        estilo: 'Canción destacada · «Princesa»',
        historia: 'La canción «Princesa», que compartiste como referencia, es el punto de partida para conocer la propuesta musical de Luisra en esta selección.',
        iniciales: 'LR',
        fotografia: null,
    },
    {
        nombre: 'Carlos Vives',
        origen: 'Santa Marta, Colombia',
        estilo: 'Vallenato · pop latino',
        historia: 'Cantante, compositor y actor samario, Carlos Vives ayudó a acercar el vallenato a nuevas audiencias al mezclar sus raíces caribeñas con pop y rock. Su trayectoria conecta la música tradicional colombiana con sonidos contemporáneos.',
        imagen: '/Imagenes/artistas/carlos-vives.jpg',
        textoAlternativo: 'Carlos Vives en el Foro Económico Mundial sobre América Latina de 2010',
        fotografia: 'World Economic Forum / Edgar Alberto Domínguez Cataño',
        fuenteFotografia: 'https://commons.wikimedia.org/wiki/File:Carlos_Vives_-_World_Economic_Forum_on_Latin_America_2010.jpg',
        licencia: 'CC BY-SA 2.0',
        fuenteLicencia: 'https://creativecommons.org/licenses/by-sa/2.0/',
    },
    {
        nombre: 'Andrés Cepeda',
        origen: 'Bogotá, Colombia',
        estilo: 'Pop · balada · bolero',
        historia: 'El cantante y compositor bogotano inició su camino musical como voz principal de Poligamia. Después desarrolló una carrera solista que explora el pop romántico, la balada y el bolero.',
        imagen: '/Imagenes/artistas/andres-cepeda.jpg',
        textoAlternativo: 'Retrato de Andrés Cepeda',
        fotografia: 'SonyCOL',
        fuenteFotografia: 'https://commons.wikimedia.org/wiki/File:AndresCepeda2018TVA.jpg',
        licencia: 'CC BY-SA 4.0',
        fuenteLicencia: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    {
        nombre: 'Jean Carlos Centeno',
        origen: 'Cabimas, Venezuela · carrera en Colombia',
        estilo: 'Cantante · compositor',
        historia: 'Nacido en Venezuela y criado en Colombia, Jean Carlos Centeno se hizo conocido como cantante y compositor de vallenato. Su etapa con el Binomio de Oro de América y su carrera solista lo consolidaron como una de las voces destacadas del género.',
        imagen: '/Imagenes/artistas/jean-carlos-centeno.jpg',
        textoAlternativo: 'Jean Carlos Centeno durante un concierto vallenato',
        fotografia: 'Lulema07',
        fuenteFotografia: 'https://commons.wikimedia.org/wiki/File:Concierto_vallenato_JCC.jpg',
        licencia: 'CC BY-SA 4.0',
        fuenteLicencia: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
];

const productoresDestacados = [
    {
        nombre: 'Quincy Jones',
        origen: 'Chicago, Estados Unidos',
        estilo: 'Producción · arreglos · composición',
        historia: 'Productor, compositor y arreglista cuya carrera abarcó más de siete décadas. Su trabajo con Michael Jackson en álbumes como Off the Wall, Thriller y Bad, además de su trayectoria en jazz, cine y televisión, lo convirtió en una figura clave de la música popular.',
        imagen: '/Imagenes/productores/quincy-jones.jpg',
        textoAlternativo: 'Quincy Jones sentado frente a un piano',
        credito: 'Foto proporcionada por ti',
    },
    {
        nombre: 'Sam Phillips',
        origen: 'Florence, Alabama · Sun Studio, Memphis',
        estilo: 'Rock and roll · Sun Records',
        historia: 'Fundó Sun Records y Sun Studio en Memphis. Desde allí produjo las primeras grabaciones de Elvis Presley y trabajó con figuras como Johnny Cash, Jerry Lee Lewis, Carl Perkins y Howlin’ Wolf, dejando una huella decisiva en los inicios del rock and roll.',
        imagen: '/Imagenes/productores/sam-phillips.jpg',
        textoAlternativo: 'Sam Phillips con Elvis Presley y Bob Neal en 1955',
        credito: 'The Cash Box Publishing Co., Inc.',
        fuenteFoto: 'https://commons.wikimedia.org/wiki/File:Sam_Phillips_in_1955_(cropped).jpg',
        licencia: 'Dominio público',
    },
    {
        nombre: 'Phil Spector',
        origen: 'Bronx, Nueva York',
        estilo: 'Pop · arreglos orquestales',
        historia: 'Productor y compositor estadounidense asociado con la técnica de producción conocida como «Wall of Sound». Sus densos arreglos y capas instrumentales marcaron grabaciones pop de los años sesenta y colaboraciones posteriores con distintos artistas.',
        imagen: '/Imagenes/productores/phil-spector.jpg',
        textoAlternativo: 'Retrato de Phil Spector en 1965',
        credito: 'New York World-Telegram and Sun · Library of Congress',
        fuenteFoto: 'https://commons.wikimedia.org/wiki/File:Phil_Spector_in_1965.jpg',
        licencia: 'Dominio público',
    },
    {
        nombre: 'George Martin',
        origen: 'Londres, Inglaterra',
        estilo: 'Producción · arreglos · experimentación',
        historia: 'Productor, arreglista y músico inglés, es recordado por su estrecha colaboración con The Beatles. Sus conocimientos musicales y su apertura a nuevas técnicas de grabación ayudaron a dar forma al sonido de sus álbumes y a sus arreglos orquestales.',
        imagen: '/Imagenes/productores/george-martin.jpg',
        textoAlternativo: 'George Martin tras bambalinas del espectáculo The Beatles LOVE',
        credito: 'Adamsharp',
        fuenteFoto: 'https://commons.wikimedia.org/wiki/File:George_Martin_-_backstage_at_LOVE.jpg',
        licencia: 'CC BY-SA 3.0',
        fuenteLicencia: 'https://creativecommons.org/licenses/by-sa/3.0/',
    },
];

export default function MenuPrincipal() {
    const { usuario } = useAuth();
    const rutasPermitidas = rutasPermitidasPorRol(usuario?.rol);
    const puedeGestionarSesiones = rutasPermitidas.includes(RUTAS.SESIONES);
    const sesiones = SesionService.listar();
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