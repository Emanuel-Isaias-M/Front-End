// src/router/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Props:
 * - requireProfile: boolean (default: false)
 * - requireRoles: string[] | undefined (p.ej. ['admin'] o ['admin','editor'])
 */
export default function ProtectedRoute({ requireProfile = false, requireRoles }) {
  const { isAuthenticated, currentProfile, loadingSession, user } = useAuth();
  const roles = user?.roles || [];

  if (loadingSession) {
    return <div className="p-6 text-center">Cargando…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireProfile && !currentProfile) {
    return <Navigate to="/perfiles" replace />;
  }

  if (requireRoles && !requireRoles.some((r) => roles.includes(r))) {
    // si no tiene los roles necesarios, lo mando a Películas
    return <Navigate to="/discover" replace />;
  }

  // Importante: con rutas anidadas, devolvemos <Outlet /> en lugar de children
  return <Outlet />;
}
