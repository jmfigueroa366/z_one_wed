// CAPA: Presentación
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RUTAS } from './config/rutas.js';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import WorkspaceLayout from './components/WorkspaceLayout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MenuPrincipal from './pages/MenuPrincipal.jsx';
import MisProyectos from './pages/MisProyectos.jsx';
import Agenda from './pages/Agenda.jsx';
import Artistas from './pages/Artistas.jsx';
import Escuchar from './pages/Escuchar.jsx';
import Catalogo from './pages/Catalogo.jsx';
import Chatbot from './pages/Chatbot.jsx';
import Configuracion from './pages/Configuracion.jsx';
import Estadisticas from './pages/Estadisticas.jsx';
import Permisos from './pages/Permisos.jsx';
import Productores from './pages/Productores.jsx';
import Sesiones from './pages/Sesiones.jsx';
import Solicitudes from './pages/Solicitudes.jsx';

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path={RUTAS.LOGIN} element={<Login />} />
                    <Route path={RUTAS.REGISTRO} element={<Register />} />

                    <Route element={
                        <ProtectedRoute>
                            <WorkspaceLayout />
                        </ProtectedRoute>
                    }>
                        <Route path={RUTAS.MENU_PRINCIPAL} element={<MenuPrincipal />} />
                        <Route path={RUTAS.ESTUDIO} element={<Escuchar />} />
                        <Route path={RUTAS.AGENDA} element={<Agenda />} />
                        <Route path={RUTAS.ARTISTAS} element={<Artistas />} />
                        <Route path={RUTAS.CATALOGO} element={<Catalogo />} />
                        <Route path={RUTAS.CHATBOT} element={<Chatbot />} />
                        <Route path={RUTAS.CONFIGURACION} element={<Configuracion />} />
                        <Route path={RUTAS.ESTADISTICAS} element={<Estadisticas />} />
                        <Route path={RUTAS.PERMISOS} element={<Permisos />} />
                        <Route path={RUTAS.PRODUCTORES} element={<Productores />} />
                        <Route path={RUTAS.PROYECTOS} element={<MisProyectos />} />
                        <Route path={RUTAS.SESIONES} element={<Sesiones />} />
                        <Route path={RUTAS.SOLICITUDES} element={<Solicitudes />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
