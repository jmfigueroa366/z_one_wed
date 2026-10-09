// CAPA: Presentación
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../config/roles.js';
import { PERMISOS, permisosDelRol } from '../config/permisos.js';
import '../styles/permisos.css';

const ROLES_ORDEN = [ROLES.ADMINISTRADOR, ROLES.COLABORADOR, ROLES.CLIENTE];
const PERMISOS_ORDEN = Object.values(PERMISOS);

export default function Permisos() {
    const { usuario } = useAuth();
    const rolActual = usuario?.rol ?? ROLES.CLIENTE;

    return (
        <main className="workspace-content" data-page="permisos">
            <header className="page-heading">
                <p className="workspace-eyebrow">ESPACIO DE TRABAJO</p>
                <h1>Permisos</h1>
                <p>Acceso según rol dentro de la aplicación.</p>
            </header>

            <section className="permisos-panel" aria-label="Matriz de permisos por rol">
                <div className="permisos-resumen">
                    <span className="chip chip-activo">Rol actual: {rolActual}</span>
                </div>

                <div className="permisos-table-wrap">
                    <table className="permisos-table">
                        <thead>
                            <tr>
                                <th>Permiso</th>
                                {ROLES_ORDEN.map((rol) => (
                                    <th key={rol}>{rol}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {PERMISOS_ORDEN.map((permiso) => (
                                <tr key={permiso}>
                                    <td>{permiso}</td>
                                    {ROLES_ORDEN.map((rol) => {
                                        const tienePermiso = permisosDelRol(rol).includes(permiso);
                                        return (
                                            <td key={`${rol}-${permiso}`} className={tienePermiso ? 'si' : 'no'}>
                                                {tienePermiso ? 'Sí' : 'No'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
