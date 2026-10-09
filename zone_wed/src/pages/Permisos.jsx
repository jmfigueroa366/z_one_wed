// CAPA: Presentación
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../config/roles.js';
import { PERMISOS, permisosDelRol } from '../config/permisos.js';
import '../styles/tailwind.css';

const ROLES_ORDEN = [ROLES.ADMINISTRADOR, ROLES.COLABORADOR, ROLES.CLIENTE];
const PERMISOS_ORDEN = Object.values(PERMISOS);

export default function Permisos() {
    const { usuario } = useAuth();
    const rolActual = usuario?.rol ?? ROLES.CLIENTE;

    return (
        <main className="workspace-content" data-page="permisos">
            <header className="page-heading border-l-4 border-[#df8b61] pl-4">
                <p className="workspace-eyebrow">ESPACIO DE TRABAJO</p>
                <h1>Permisos</h1>
                <p>Acceso según rol dentro de la aplicación.</p>
            </header>

            <section className="mt-6 rounded-3xl border border-border bg-[#111827]/70 p-6" aria-label="Matriz de permisos por rol">
                <div className="mb-4 flex justify-end">
                    <span className="inline-flex items-center rounded-full border border-exito/40 bg-exito/10 px-3 py-2 text-sm font-semibold capitalize text-exito-soft">
                        Rol actual: {rolActual}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse">
                        <thead>
                            <tr>
                                <th className="border-b border-border px-3.5 py-3 text-left text-xs font-bold uppercase tracking-wider text-sutil">
                                    Permiso
                                </th>
                                {ROLES_ORDEN.map((rol) => (
                                    <th
                                        key={rol}
                                        className="border-b border-border px-3.5 py-3 text-left text-xs font-bold uppercase tracking-wider capitalize text-sutil"
                                    >
                                        {rol}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {PERMISOS_ORDEN.map((permiso) => (
                                <tr key={permiso} className="border-b border-border/60 last:border-0">
                                    <td className="px-3.5 py-3 font-semibold text-texto-soft">{permiso}</td>
                                    {ROLES_ORDEN.map((rol) => {
                                        const tienePermiso = permisosDelRol(rol).includes(permiso);
                                        return (
                                            <td
                                                key={`${rol}-${permiso}`}
                                                className={`px-3.5 py-3 font-bold ${tienePermiso ? 'text-exito' : 'text-peligro-soft/70'}`}
                                            >
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
