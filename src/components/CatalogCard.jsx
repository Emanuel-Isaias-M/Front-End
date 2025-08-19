// src/components/CatalogCard.jsx
import { Link } from "react-router-dom";
import { useWatchlist } from "../context/WatchlistContext";
import { useAuth } from "../context/AuthContext";

const FALLBACK_POSTER =
  "/poster-fallback.svg";

export default function CatalogCard({ movie }) {
  const { currentProfile } = useAuth();
  const { isInWatchlist, toggle } = useWatchlist();

  // Detectamos si es TMDB (Discover) o local
  const isTMDB =
    movie.source === "tmdb" ||
    typeof movie.id === "number" ||
    movie.tmdbId != null;

  // Usamos SIEMPRE un "id" (como antes) para que el Context lo transforme a movieId
  const contentId = isTMDB
    ? String(movie.tmdbId ?? movie.id ?? "")
    : String(movie.id ?? movie.movieId ?? "");

  const source = isTMDB ? "tmdb" : "local";

  const title = movie.title ?? "Sin título";
  const year =
    movie.year || (movie.release_date ? movie.release_date.slice(0, 4) : "");
  const rating =
    typeof movie.rating === "number"
      ? Number(movie.rating.toFixed ? movie.rating.toFixed(1) : movie.rating)
      : typeof movie.vote_average === "number"
      ? Number(movie.vote_average.toFixed(1))
      : 0;

  const posterUrl =
    movie.posterUrl
      ? movie.posterUrl
      : movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : FALLBACK_POSTER;

  // Tu isInWatchlist necesita (id, source)
  const inList = isInWatchlist(contentId, source);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentProfile) return;

    // 🔑 Volvemos al contrato viejo del Context:
    // le mandamos { id, source, ... } y él arma movieId internamente
    await toggle({
      id: contentId,
      source,
      title,
      posterUrl,
      year: year ? Number(year) : null,
      rating,
    });
  };

  const detailHref = isTMDB ? `/discover/${contentId}` : `/items/${contentId}`;

  return (
    <article className="rounded-lg overflow-hidden bg-neutral-900/0 shadow-lg hover:shadow-xl transition">
      <Link to={detailHref} className="block relative w-full pb-[150%] group">
        <img
          src={posterUrl || FALLBACK_POSTER}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_POSTER;
          }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <button
          onClick={handleToggle}
          title={inList ? "Quitar de Mi lista" : "Agregar a Mi lista"}
          className={`absolute top-2 right-2 text-xs rounded px-2 py-1 border backdrop-blur
            ${inList ? "bg-black/60 text-white border-white/20" : "bg-white/90 text-black border-black/10"}`}
          aria-pressed={inList}
        >
          {inList ? "✓ En mi lista" : "+ Mi lista"}
        </button>

        <div className="absolute inset-x-0 bottom-0 p-2">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative text-white">
            <h3 className="text-sm font-semibold line-clamp-2 drop-shadow">{title}</h3>
            <p className="mt-1 text-[11px] opacity-90">
              {year ? `Año ${year} • ` : ""}⭐ {rating}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
