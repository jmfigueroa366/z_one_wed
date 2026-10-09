// CAPA: Presentación
import { Link } from 'react-router-dom';
import { useSalas } from '../hooks/useSalas.js';
import { RUTAS } from '../config/rutas.js';
import { formatearMoneda } from '../utils/helpers.js';
import '../styles/catalogo.css';

const SERVICIOS = [
    { nombre: 'Grabación', descripcion: 'Captura voces e instrumentos en una sesión de estudio.' },
    { nombre: 'Producción musical', descripcion: 'Desarrolla arreglos, sonido y dirección para tus canciones.' },
    { nombre: 'Mezcla', descripcion: 'Equilibra pistas y prepara la mezcla de tu proyecto.' },
    { nombre: 'Masterización', descripcion: 'Da el acabado final y prepara el audio para su distribución.' },
];

export default function Catalogo() {
    const [salas] = useSalas();
    const salasActivas = salas.filter((sala) => sala.activo !== false);

    return (
        <main className="workspace-content operations-page catalog-page" data-page="catalogo">
            <header className="page-heading operations-heading">
                <p className="workspace-eyebrow">ESPACIOS Y SERVICIOS</p>
                <h1>Catálogo del estudio</h1>
                <p>Consulta las salas disponibles, sus tarifas registradas y los servicios que puedes coordinar con Z-ONE.</p>
            </header>

            <section className="catalog-section" aria-labelledby="catalog-rooms-title">
                <div className="catalog-section-heading">
                    <div>
                        <p className="workspace-eyebrow">ESPACIOS Z-ONE</p>
                        <h2 id="catalog-rooms-title">Salas de grabación</h2>
                    </div>
                    <span className="catalog-count">{salasActivas.length} disponibles</span>
                </div>

                {salasActivas.length ? (
                    <div className="catalog-room-grid">
                        {salasActivas.map((sala, index) => (
                            <article className="catalog-room-card" key={sala.id ?? sala.nombre}>
                                <div className={`catalog-room-art catalog-room-art-${index % 3}`} aria-hidden="true">
                                    <span>{String(index + 1).padStart(2, '0')}</span>
                                    <span className="catalog-room-symbol">Z</span>
                                </div>
                                <div className="catalog-room-body">
                                    <div className="catalog-room-title">
                                        <h3>{sala.nombre}</h3>
                                        <span className="catalog-availability"><span aria-hidden="true">●</span> Activa</span>
                                    </div>
                                    <p>Espacio del estudio disponible para coordinar sesiones de producción musical.</p>
                                    <div className="catalog-room-price">
                                        <strong>{formatearMoneda(sala.precio_hora)}</strong>
                                        <span>por hora</span>
                                    </div>
                                    <Link className="catalog-book-link" to={`${RUTAS.SESIONES}#crear`}>
                                        Programar una sesión <span aria-hidden="true">→</span>
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <p className="operations-empty">En este momento no hay salas activas en el catálogo.</p>
                )}
            </section>

            <section className="catalog-section catalog-services" aria-labelledby="catalog-services-title">
                <div className="catalog-section-heading">
                    <div>
                        <p className="workspace-eyebrow">FLUJO DE PRODUCCIÓN</p>
                        <h2 id="catalog-services-title">Servicios del estudio</h2>
                    </div>
                </div>
                <div className="catalog-service-grid">
                    {SERVICIOS.map((servicio, index) => (
                        <article className="catalog-service-card" key={servicio.nombre}>
                            <span className="catalog-service-number">{String(index + 1).padStart(2, '0')}</span>
                            <h3>{servicio.nombre}</h3>
                            <p>{servicio.descripcion}</p>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
