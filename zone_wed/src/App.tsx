// CAPA: Presentación
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RUTAS } from './config/rutas.ts';
import { AuthProvider } from './context/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import WorkspaceLayout from './components/WorkspaceLayout.tsx';
import LandingPage from './pages/LandingPage.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import MenuPrincipal from './pages/MenuPrincipal.tsx';
import MisProyectos from './pages/MisProyectos.tsx';
import Agenda from './pages/Agenda.tsx';
import Artistas from './pages/Artistas.tsx';
import Escuchar from './pages/Escuchar.tsx';
import Catalogo from './pages/Catalogo.tsx';
import Chatbot from './pages/Chatbot.tsx';
import Configuracion from './pages/Configuracion.tsx';
import Estadisticas from './pages/Estadisticas.tsx';
import CuandoSuena from './pages/CuandoSuena.tsx';
import Productores from './pages/Productores.tsx';
import Sesiones from './pages/Sesiones.tsx';
import Solicitudes from './pages/Solicitudes.tsx';
import Pagos from './pages/Pagos.tsx';
import Precios from './pages/Precios.tsx';

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
                        <Route path={RUTAS.CUANDO_SUENA} element={<CuandoSuena />} />
                        <Route path={RUTAS.PRODUCTORES} element={<Productores />} />
                        <Route path={RUTAS.PROYECTOS} element={<MisProyectos />} />
                        <Route path={RUTAS.SESIONES} element={<Sesiones />} />
                        <Route path={RUTAS.SOLICITUDES} element={<Solicitudes />} />
                        <Route path={RUTAS.PAGOS} element={<Pagos />} />
                        <Route path={RUTAS.PRECIOS} element={<Precios />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
