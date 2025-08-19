import { Routes, Route, Navigate } from "react-router-dom";

// CRUD catálogo (MongoDB)
import MovieList from "../pages/MovieList.jsx";
import MovieDetail from "../pages/MovieDetail.jsx";
import MovieCreate from "../pages/MovieCreate.jsx";
import MovieEdit from "../pages/MovieEdit.jsx";

// Auth + perfiles
import Login from "../pages/Login.jsx";
import Profiles from "../pages/Profiles.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import Register from "../pages/Register.jsx";
import CreateProfile from "../pages/CreateProfile.jsx";

// TMDB
import Discover from "../pages/Discover.jsx";
import DiscoverDetail from "../pages/DiscoverDetail.jsx";

// Watchlist
import Watchlist from "../pages/Watchlist.jsx";

// Admin
import AdminDev from "../pages/AdminDev.jsx";

// 404
import NotFound from "../pages/NotFound.jsx";

export default function AppRouter() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protegidas por token (sin perfil) */}
      <Route element={<ProtectedRoute requireProfile={false} />}>
        <Route path="/perfiles" element={<Profiles />} />
        <Route path="/crear-perfil" element={<CreateProfile />} />
      </Route>

      {/* Admin ONLY (no requiere perfil) */}
      <Route element={<ProtectedRoute requireProfile={false} requireRoles={['admin']} />}>
        <Route path="/admin/dev" element={<AdminDev />} />
      </Route>

      {/* Protegidas por token + perfil */}
      <Route element={<ProtectedRoute requireProfile={true} />}>
        {/* Home → Discover (TMDB) */}
        <Route path="/" element={<Navigate to="/discover" replace />} />

        {/* Cartelera local (MongoDB) — RUTA CANÓNICA */}
        <Route path="/items" element={<MovieList />} />
        <Route path="/items/:id" element={<MovieDetail />} />

        {/* Crear/Editar SOLO admin|editor */}
        <Route element={<ProtectedRoute requireRoles={['admin', 'editor']} requireProfile={true} />}>
          <Route path="/items/create" element={<MovieCreate />} />
          <Route path="/items/:id/edit" element={<MovieEdit />} />
        </Route>

        {/* TMDB */}
        <Route path="/discover" element={<Discover />} />
        <Route path="/discover/:id" element={<DiscoverDetail />} />

        {/* Watchlist */}
        <Route path="/watchlist" element={<Watchlist />} />

        {/* --- Alias legacy /movies → redirige a /items --- */}
        <Route path="/movies" element={<Navigate to="/items" replace />} />
        <Route path="/movies/:id" element={<Navigate to="../items/:id" replace />} />
        <Route path="/movies/create" element={<Navigate to="/items/create" replace />} />
        <Route path="/movies/:id/edit" element={<Navigate to="../items/:id/edit" replace />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

