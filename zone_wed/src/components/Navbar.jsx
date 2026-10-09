// CAPA: Presentación
import { NavLink } from 'react-router-dom';
import '../styles/tailwind.css';

export default function Navbar({ items = [] }) {
    return (
        <nav
            className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
            aria-label="Navegación principal"
        >
            {items.map((item) => (
                <NavLink
                    key={item.ruta}
                    to={item.ruta}
                    className={({ isActive }) =>
                        `shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                            isActive
                                ? 'bg-gradient-to-r from-[#7f55e2]/60 to-[#d73f9a]/40 text-white shadow-lg shadow-black/20'
                                : 'text-[#c8c1d7] hover:bg-white/5 hover:text-white'
                        }`
                    }
                >
                    {item.etiqueta}
                </NavLink>
            ))}
        </nav>
    );
}
