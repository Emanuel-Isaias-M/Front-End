import { Link } from "react-router-dom";
import { useWatchlist } from "../context/WatchlistContext";
import { useAuth } from "../context/AuthContext";

const FALLBACK_POSTER =
  "https://via.placeholder.com/600x900/111315/FFFFFF?text=Sin+Poster";

export default function MovieCard({ movie }) {
  const { currentProfile, user } = useAuth();
  const roles = user?.roles || [];
  const canEdit = roles.includes("admin") || roles.includes("editor");

  const { isInWatchlist, toggle } = useWatchlist();

  const poster = movie.posterUrl || FALLBACK_POSTER;
  const source = movie.source || "local"; // 👈 default local
  const inList = isInWatchlist(movie.id, source);

  const handleToggle = (e) => {
    e.preventDefault(); // por si el card está envuelto en <Link>
    if (!currentProfile) return;
    toggle({
      movieId: movie.id,     // 👈 clave correcta para el backend
      title: movie.title,
      posterUrl: poster,
      year: movie.year,
      rating: movie.rating,
      source,                // 'local' por defecto aquí
    });
  };

  return (
    <article className="rounded-lg overflow-hidden group shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-neutral-900">
      <div className="relative w-full pb-[150%]">
        <img
          src={poster}
          alt={movie.title}
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.src = FALLBACK_POSTER; }}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {movie.genre && (
          <span className="absolute left-2 top-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {movie.genre}
          </span>
        )}
        {/* Botón Mi lista (arriba a la derecha) */}
        <button
          onClick={handleToggle}
          title={inList ? "Quitar de Mi lista" : "Agregar a Mi lista"}
          className="absolute right-2 top-2 text-xs rounded px-2 py-1 bg-white/90 dark:bg-black/70 border dark:border-neutral-700"
        >
          {inList ? "✓ En mi lista" : "+ Mi lista"}
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-red-500 transition-colors">
          {movie.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {movie.year ? `Año ${movie.year} • ` : ""}⭐ {movie.rating ?? 0}
        </p>
        {movie.overview && (
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 line-clamp-2">
            {movie.overview}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Link
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
            to={`/items/${movie.id}`}
          >
            Ver
          </Link>

          {/* Editar solo para admin/editor */}
          {canEdit && (
            <Link
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm transition-colors"
              to={`/items/${movie.id}/edit`}
            >
              Editar
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
