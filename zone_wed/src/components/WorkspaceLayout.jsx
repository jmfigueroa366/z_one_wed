// CAPA: Presentación
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import '../styles/tailwind.css';
import '../styles/principal.css';

export default function WorkspaceLayout() {
    return (
        <div
            className="grid min-h-screen text-texto lg:grid-cols-[260px_minmax(0,1fr)]"
            style={{
                background:
                    'radial-gradient(ellipse at 72% 0%, rgba(93, 49, 170, 0.2), transparent 38%), linear-gradient(145deg, #100d1b 0%, #151023 52%, #110d19 100%)',
            }}
        >
            <Sidebar />
            <div className="min-w-0">
                <Header />
                <Outlet />
            </div>
        </div>
    );
}
