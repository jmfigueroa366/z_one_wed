// CAPA: Presentación
import { Navigate, useLocation } from 'react-router-dom';
import { rutaEsPermitida } from '../config/rutas.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ProtectedRouteProps {
    children: React.ReactNode;
    rolesPermitidos?: string[];
    redirectTo?: string;
}

export default function ProtectedRoute({ children, rolesPermitidos = [], redirectTo = '/login' }: ProtectedRouteProps) {
    const { usuario, cargando } = useAuth();
    const location = useLocation();

    if (cargando) {
        return <main className="estado-cargando">Cargando sesión...</main>;
    }

    if (!usuario) {
        return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }

    const tieneRolPermitido = rolesPermitidos.length === 0 || rolesPermitidos.includes(usuario.rol);
    const rutaPermitida = rutaEsPermitida(usuario.rol, location.pathname);

    if (!tieneRolPermitido || !rutaPermitida) {
        return <Navigate to="/menu-principal" replace />;
    }

    return children;
}
