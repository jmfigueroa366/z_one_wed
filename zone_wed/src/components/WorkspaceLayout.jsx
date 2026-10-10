// CAPA: Presentación
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import '../styles/tailwind.css';

const CLAVE_COLAPSO = 'zone.sidebar.colapsado';

export default function WorkspaceLayout() {
    const [colapsado, setColapsado] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem(CLAVE_COLAPSO) === '1';
    });
    const [movilAbierto, setMovilAbierto] = useState(false);

    const alternarColapso = () => {
        setColapsado((actual) => {
            const siguiente = !actual;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(CLAVE_COLAPSO, siguiente ? '1' : '0');
            }
            return siguiente;
        });
    };

    return (
        <div
            className={`grid min-h-screen text-texto ${
                colapsado ? 'lg:grid-cols-[84px_minmax(0,1fr)]' : 'lg:grid-cols-[260px_minmax(0,1fr)]'
            }`}
            style={{
                background:
                    'radial-gradient(ellipse at 72% 0%, rgba(93, 49, 170, 0.2), transparent 38%), linear-gradient(145deg, #100d1b 0%, #151023 52%, #110d19 100%)',
            }}
        >
            <Sidebar
                colapsado={colapsado}
                onAlternar={alternarColapso}
                movilAbierto={movilAbierto}
                onCerrarMovil={() => setMovilAbierto(false)}
            />
            <div className="min-w-0">
                <Header onAbrirMenu={() => setMovilAbierto(true)} />
                <Outlet />
            </div>
        </div>
    );
}
