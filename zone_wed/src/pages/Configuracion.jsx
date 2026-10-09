// CAPA: Presentación
import { useState } from 'react';
import '../styles/tailwind.css';

const VARIACIONES_CAMPOS = [
    { id: 'texto', etiqueta: 'Texto' },
    { id: 'numero', etiqueta: 'Número' },
    { id: 'fecha', etiqueta: 'Fecha' },
    { id: 'seleccion', etiqueta: 'Selección' },
];

const CAMPO =
    'w-full rounded-xl border border-border bg-surface-2 px-3.5 py-3 text-sm text-texto outline-none transition [color-scheme:dark] placeholder:text-sutil/70 focus:border-accent focus:ring-2 focus:ring-accent/40 [&>option]:bg-surface-3 [&>option]:text-texto';
const ETIQUETA = 'grid gap-2 text-sm font-semibold text-[#c9c2d8]';

export default function Configuracion() {
    const [panelesAbiertos, setPanelesAbiertos] = useState({ texto: true });

    const alternarPanel = (id) => {
        setPanelesAbiertos((actuales) => ({
            ...actuales,
            [id]: !actuales[id],
        }));
    };

    return (
        <main className="workspace-content" data-page="configuracion">
            <header className="page-heading border-l-4 border-[#9ba8c8] pl-4">
                <p className="workspace-eyebrow">CONFIGURACIÓN</p>
                <h1>Variaciones de campo</h1>
                <p>Tipos de campo disponibles para futuros formularios del sistema.</p>
            </header>

            <section
                className="mt-6 max-w-3xl rounded-3xl border border-border bg-surface/70 p-6"
                aria-labelledby="field-variations-title"
            >
                <div className="mb-5">
                    <p className="workspace-eyebrow">CONFIGURACIÓN</p>
                    <h2 id="field-variations-title" className="mt-1 text-xl font-bold tracking-tight text-texto-soft">
                        Variaciones de campo
                    </h2>
                </div>

                <div className="grid gap-3">
                    {VARIACIONES_CAMPOS.map(({ id, etiqueta }) => {
                        const abierto = Boolean(panelesAbiertos[id]);
                        const panelId = `field-content-${id}`;

                        return (
                            <article
                                key={id}
                                className={`overflow-hidden rounded-xl border bg-white/[0.025] transition ${
                                    abierto ? 'border-accent/50' : 'border-border'
                                }`}
                            >
                                <h3 className="m-0">
                                    <button
                                        className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-bold text-texto transition hover:text-accent-soft"
                                        type="button"
                                        aria-expanded={abierto}
                                        aria-controls={panelId}
                                        onClick={() => alternarPanel(id)}
                                    >
                                        <span>{etiqueta}</span>
                                        <span aria-hidden="true" className="text-accent-soft">{abierto ? '−' : '＋'}</span>
                                    </button>
                                </h3>
                                {abierto && (
                                    <div className="px-4 pb-4 pt-0.5" id={panelId}>
                                        {id === 'texto' && (
                                            <label className={ETIQUETA}>
                                                Nombre del proyecto
                                                <input className={CAMPO} type="text" placeholder="Escribe un nombre" />
                                            </label>
                                        )}
                                        {id === 'numero' && (
                                            <label className={ETIQUETA}>
                                                Cantidad
                                                <input className={CAMPO} type="number" min="0" placeholder="0" />
                                            </label>
                                        )}
                                        {id === 'fecha' && (
                                            <label className={ETIQUETA}>
                                                Fecha de lanzamiento
                                                <input className={CAMPO} type="date" />
                                            </label>
                                        )}
                                        {id === 'seleccion' && (
                                            <label className={ETIQUETA}>
                                                Estado
                                                <select className={CAMPO} defaultValue="En producción">
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
