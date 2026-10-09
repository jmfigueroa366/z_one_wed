// CAPA: Presentación
export default function PageContent({ title, description, pageId }) {
    return (
        <main className="workspace-content" data-page={pageId}>
            <header className="page-heading">
                <p className="workspace-eyebrow">ESPACIO DE TRABAJO</p>
                <h1>{title}</h1>
                <p>{description}</p>
            </header>
            <section className="migration-notice" aria-label="Estado de migración">
                <h2>Vista preparada</h2>
                <p>
                    La estructura React de esta sección está lista. Su interfaz y lógica original
                    se migrarán en el siguiente paso, sin sustituirlas por funcionalidad inventada.
                </p>
            </section>
        </main>
    );
}
