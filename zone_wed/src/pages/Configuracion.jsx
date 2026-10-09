// CAPA: Presentación
import { useState } from 'react';
import '../styles/configuracion.css';

const VARIACIONES_CAMPOS = [
    { id: 'texto', etiqueta: 'Texto' },
    { id: 'numero', etiqueta: 'Número' },
    { id: 'fecha', etiqueta: 'Fecha' },
    { id: 'seleccion', etiqueta: 'Selección' },
];

export default function Configuracion() {
    const [panelesAbiertos, setPanelesAbiertos] = useState({ texto: true });

    const alternarPanel = (id) => {
        setPanelesAbiertos((actuales) => ({
            ...actuales,
            [id]: !actuales[id],
        }));
    };

    return (
        <main className="workspace-content configuration-page" data-page="configuracion">
            <header className="page-heading">
                <p className="workspace-eyebrow">CONFIGURACIÓN</p>
                <h1>Variaciones de campo</h1>
                <p>Tipos de campo disponibles para futuros formularios del sistema.</p>
            </header>

            <section className="configuration-card" aria-labelledby="field-variations-title">
                <div className="configuration-section-heading">
                    <p className="workspace-eyebrow">CONFIGURACIÓN</p>
                    <h2 id="field-variations-title">Variaciones de campo</h2>
                </div>

                <div className="field-accordion">
                    {VARIACIONES_CAMPOS.map(({ id, etiqueta }) => {
                        const abierto = Boolean(panelesAbiertos[id]);
                        const panelId = `field-content-${id}`;

                        return (
                            <article className={`field-panel${abierto ? ' is-open' : ''}`} key={id}>
                                <h3 className="field-panel-heading">
                                    <button
                                        className="field-toggle"
                                        type="button"
                                        aria-expanded={abierto}
                                        aria-controls={panelId}
                                        onClick={() => alternarPanel(id)}
                                    >
                                        <span>{etiqueta}</span>
                                        <span aria-hidden="true">{abierto ? '−' : '＋'}</span>
                                    </button>
                                </h3>
                                {abierto && (
                                    <div className="field-content" id={panelId}>
                                        {id === 'texto' && (
                                            <label>
                                                Nombre del proyecto
                                                <input type="text" placeholder="Escribe un nombre" />
                                            </label>
                                        )}
                                        {id === 'numero' && (
                                            <label>
                                                Cantidad
                                                <input type="number" min="0" placeholder="0" />
                                            </label>
                                        )}
                                        {id === 'fecha' && (
                                            <label>
                                                Fecha de lanzamiento
                                                <input type="date" />
                                            </label>
                                        )}
                                        {id === 'seleccion' && (
                                            <label>
                                                Estado
                                                <select defaultValue="En producción">
                                                    <option>En producción</option>
                                                    <option>En revisión</option>
                                                    <option>Publicado</option>
                                                </select>
                                            </label>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}
