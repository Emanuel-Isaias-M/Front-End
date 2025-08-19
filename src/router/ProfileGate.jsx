// src/router/ProfileGate.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfileGate({ children }) {
  const { currentProfile } = useAuth();
  if (!currentProfile) return <Navigate to="/perfiles" replace />;
  // Si viene children, lo renderizo; sino uso <Outlet /> para rutas anidadas
  return children ?? <Outlet />;
}

