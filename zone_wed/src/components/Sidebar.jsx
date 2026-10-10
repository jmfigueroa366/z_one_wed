// CAPA: Presentación
import { RUTAS, rutasPermitidasPorRol } from '../config/rutas.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import '../styles/tailwind.css';

const NAVEGACION = [
    { ruta: RUTAS.MENU_PRINCIPAL, etiqueta: 'Inicio' },
    { ruta: RUTAS.SESIONES, etiqueta: 'Sesiones' },
    { ruta: RUTAS.AGENDA, etiqueta: 'Agenda' },
    { ruta: RUTAS.SOLICITUDES, etiqueta: 'Solicitudes' },
    { ruta: RUTAS.ARTISTAS, etiqueta: 'Artistas' },
    { ruta: RUTAS.PRODUCTORES, etiqueta: 'Productores' },
    { ruta: RUTAS.CATALOGO, etiqueta: 'Catálogo' },
    { ruta: RUTAS.PROYECTOS, etiqueta: 'Mis proyectos' },
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
        <aside className="flex flex-col gap-6 border-b border-border bg-[#0d0a17]/80 p-4 lg:border-b-0 lg:border-r lg:p-6">
            <Link className="flex items-center gap-2.5" to={RUTAS.MENU_PRINCIPAL} aria-label="Z-ONE inicio">
                <img src="/Imagenes/logo.png" alt="" className="h-9 w-9 object-contain" />
                <span className="text-2xl font-extrabold leading-none tracking-tight text-texto-soft">
                    <span className="text-magenta">Z</span>-ONE
                </span>
            </Link>
            <Navbar items={items} />
        </aside>
    );
}
