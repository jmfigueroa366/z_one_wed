// CAPA: Presentación
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';
import '../styles/tailwind.css';

const CLAVE_COLAPSO = 'zone.sidebar.colapsado';

export default function WorkspaceLayout() {
    const location = useLocation();
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
            className={`grid min-h-screen text-texto lg:h-screen lg:overflow-hidden ${
                colapsado ? 'lg:grid-cols-[84px_minmax(0,1fr)]' : 'lg:grid-cols-[260px_minmax(0,1fr)]'
            }`}
            style={{
                background:
                    'radial-gradient(ellipse at 72% 0%, rgba(63, 132, 197, 0.2), transparent 38%), linear-gradient(145deg, #000C15 0%, #04192B 52%, #000C15 100%)',
            }}
        >
            <Sidebar
                colapsado={colapsado}
                onAlternar={alternarColapso}
                movilAbierto={movilAbierto}
                onCerrarMovil={() => setMovilAbierto(false)}
            />
            <div className="flex min-w-0 flex-col lg:h-screen lg:overflow-hidden">
                <div className="lg:sticky lg:top-0 lg:z-30 lg:bg-bg">
                    <Header onAbrirMenu={() => setMovilAbierto(true)} />
                </div>
                <main className="scrollbar-discreta min-h-0 flex-1 overflow-y-auto">
                    <div key={location.pathname} className="animate-rise">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
