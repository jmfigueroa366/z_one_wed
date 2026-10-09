// CAPA: Presentación
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import '../styles/principal.css';

export default function WorkspaceLayout() {
    return (
        <div className="workspace">
            <Sidebar />
            <div className="workspace-main">
                <Header />
                <Outlet />
            </div>
        </div>
    );
}
