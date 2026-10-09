// CAPA: Presentación
import { NavLink } from 'react-router-dom';

export default function Navbar({ items = [] }) {
    return (
        <nav className="workspace-nav" aria-label="Navegación principal">
            {items.map((item) => (
                <NavLink
                    key={item.ruta}
                    to={item.ruta}
                    className={({ isActive }) => `workspace-nav-link${isActive ? ' is-active' : ''}`}
                >
                    {item.etiqueta}
                </NavLink>
            ))}
        </nav>
    );
}
