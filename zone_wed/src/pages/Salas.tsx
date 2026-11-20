// CAPA: Presentación
import SeccionSalas from '../components/SeccionSalas.tsx';

export default function Salas() {
    return (
        <main className="workspace-content" data-page="salas">
            <header className="page-heading relative border-l-4 border-accent pl-4">
                <p className="workspace-eyebrow">ADMINISTRACIÓN · SALAS</p>
                <h1>Salas del estudio</h1>
                <p>Crea, edita y activa o desactiva las salas que los clientes pueden reservar.</p>
            </header>
            <div className="mt-6">
                <SeccionSalas />
            </div>
        </main>
    );
}