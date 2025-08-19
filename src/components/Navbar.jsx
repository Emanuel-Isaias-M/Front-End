import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  const { isAuthenticated, currentProfile, logout, user } = useAuth();
  const roles = user?.roles || [];
  const isAdmin = roles.includes("admin");
  const canEdit = isAdmin || roles.includes("editor");

  const navigate = useNavigate();
  const location = useLocation();

  // Cierro el menú al cambiar de ruta
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Aplico tema al <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const LinkItem = ({ to, children, className = "" }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded md:hover:bg-gray-100 dark:md:hover:bg-neutral-800 ${isActive ? "font-semibold" : ""} ${className}`
      }
    >
      {children}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b dark:bg-black/60">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        {/* Brand */}
        <Link
          to={isAuthenticated && currentProfile ? "/discover" : "/login"}
          className="text-xl font-semibold"
        >
          🎬 Nodo Cine
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {/* Links si hay token + perfil */}
          {isAuthenticated && currentProfile && (
            <>
              {/* Películas (TMDB) visible para todos */}
              <LinkItem to="/discover">Películas</LinkItem>

              {/* Nodo-Cine (tu CRUD local) visible para todos */}
              <LinkItem to="/items">Nodo-Cine</LinkItem>

              {/* Crear visible solo para admin/editor */}
              {canEdit && <LinkItem to="/items/create">Crear</LinkItem>}

              {/* Botón extra solo admin */}
              {isAdmin && (
                <LinkItem
                  to="/admin/dev"
                  className="border border-red-300 dark:border-red-700"
                >
                  Admin (DEV)
                </LinkItem>
              )}

              {/* Mi lista visible para todos */}
              <LinkItem to="/watchlist">Mi lista</LinkItem>
            </>
          )}

          {/* Elegir perfil si falta */}
          {isAuthenticated && !currentProfile && (
            <LinkItem to="/perfiles">Elegir perfil</LinkItem>
          )}

          {/* Toggle de tema */}
          <button
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
            title={theme === "light" ? "Cambiar a oscuro" : "Cambiar a claro"}
            aria-label="Cambiar tema"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {/* Perfil + Logout / Login / Registro */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 ml-2 border-l dark:border-neutral-800">
              <span className="text-sm opacity-80">
                {currentProfile ? `Perfil: ${currentProfile.name}` : "Sin perfil"}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <>
              <LinkItem to="/login">Iniciar sesión</LinkItem>
              <LinkItem to="/register">Crear cuenta</LinkItem>
            </>
          )}
        </div>

        {/* Botón hamburguesa (mobile) */}
        <button
          className="md:hidden inline-flex items-center justify-center p-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
          aria-expanded={open}
          aria-label="Abrir menú"
          onClick={() => setOpen((v) => !v)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Menú mobile */}
      <div className={`md:hidden ${open ? "block" : "hidden"} border-t dark:border-neutral-800`}>
        <nav className="px-4 py-3 flex flex-col gap-2">
          {isAuthenticated && currentProfile && (
            <>
              <Link
                to="/discover"
                className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                Películas
              </Link>

              <Link
                to="/items"
                className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                Nodo-Cine
              </Link>

              {canEdit && (
                <Link
                  to="/items/create"
                  className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  Crear
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin/dev"
                  className="px-3 py-2 rounded border border-red-300 dark:border-red-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  Admin (DEV)
                </Link>
              )}

              <Link
                to="/watchlist"
                className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                Mi lista
              </Link>
            </>
          )}

          {isAuthenticated && !currentProfile && (
            <Link to="/perfiles" className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800">
              Elegir perfil
            </Link>
          )}

          {/* Toggle de tema en mobile */}
          <button
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            {theme === "light" ? "🌙 Modo oscuro" : "☀️ Modo claro"}
          </button>

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link to="/login" className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-neutral-800">
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
