// CAPA: Presentación
import { RUTAS, rutasPermitidasPorRol } from '../config/rutas.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import Navbar from './Navbar.jsx';

const NAVEGACION = [
    { ruta: RUTAS.MENU_PRINCIPAL, etiqueta: 'Inicio' },
    { ruta: RUTAS.AGENDA, etiqueta: 'Agenda' },
    { ruta: RUTAS.SOLICITUDES, etiqueta: 'Solicitudes' },
    { ruta: RUTAS.ARTISTAS, etiqueta: 'Artistas' },
    { ruta: RUTAS.PRODUCTORES, etiqueta: 'Productores' },
    { ruta: RUTAS.CATALOGO, etiqueta: 'Catálogo' },
    { ruta: RUTAS.PROYECTOS, etiqueta: 'Mis proyectos' },
    { ruta: RUTAS.SESIONES, etiqueta: 'Sesiones' },
    { ruta: RUTAS.ESTADISTICAS, etiqueta: 'Estadísticas' },
    { ruta: RUTAS.PERMISOS, etiqueta: 'Permisos' },
    { ruta: RUTAS.CHATBOT, etiqueta: 'Chatbot' },
    { ruta: RUTAS.CONFIGURACION, etiqueta: 'Configuración' },
];

export default function Sidebar() {
    const { usuario } = useAuth();
    const rutasPermitidas = rutasPermitidasPorRol(usuario?.rol);
    const items = NAVEGACION.filter((item) => rutasPermitidas.includes(item.ruta));

    return (
        <aside className="workspace-sidebar">
            <Link className="workspace-brand" to={RUTAS.MENU_PRINCIPAL} aria-label="Z-ONE inicio">
                <span>Z</span>-ONE
            </Link>
            <Navbar items={items} />
        </aside>
    );
}
