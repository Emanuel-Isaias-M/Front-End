// src/pages/Watchlist.jsx
import { Link } from "react-router-dom";
import { useWatchlist } from "../context/WatchlistContext";

const FALLBACK_POSTER = "/poster-fallback.svg";

// Normaliza el poster (si viene path de TMDB tipo /abc.jpg lo prefija)
function posterSrc(url) {
  if (!url) return FALLBACK_POSTER;
  const s = String(url).trim();
  if (!s) return FALLBACK_POSTER;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `https://image.tmdb.org/t/p/w500${s}`;
  return s;
}

// Deducción de destino y id para el detalle
function detailLink(movie) {
  const contentId = String(movie.movieId ?? movie.tmdbId ?? movie.id ?? "").trim();
  const isTMDB =
    movie.source === "tmdb" || (/^\d+$/.test(contentId) && movie.source !== "local");
  return {
    href: isTMDB ? `/discover/${contentId}` : `/items/${contentId}`,
    id: contentId,
    isTMDB,
  };
}

export default function Watchlist() {
  const { items, remove } = useWatchlist();

  if (!items.length) {
    return (
      <section className="space-y-4">
        {/* Header cine */}
        <Header title="Mi lista" subtitle="Tus favoritas guardadas" />

        <div className="rounded-2xl border p-10 text-center bg-white/60 dark:bg-neutral-900/60">
          <div className="text-5xl mb-3">🍿</div>
          <h2 className="text-xl font-semibold mb-1">Aún no tenés películas en tu lista</h2>
          <p className="opacity-70">Explorá el catálogo y sumá tus favoritas.</p>
          <Link
            to="/discover"
            className="mt-5 inline-block px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 shadow"
          >
            Explorar películas
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header cine */}
      <Header title="Mi lista" subtitle="Tus favoritas guardadas" />

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {items.map((movie) => {
          const { href, id, isTMDB } = detailLink(movie);
          const poster = posterSrc(movie.posterUrl);
          const year = movie.year ?? "";
          const rating = movie.rating != null ? Number(movie.rating) : null;

          return (
            <article
              key={`${movie.source}-${id}`}
              className="group rounded-2xl border overflow-hidden bg-white/50 dark:bg-neutral-900/60 backdrop-blur hover:shadow-xl transition-shadow"
            >
              <Link to={href} className="block relative">
                {/* Poster 2:3 con overlay */}
                <div className="relative w-full pb-[150%]">
                  <img
                    src={poster}
                    alt={movie.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_POSTER;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Etiquetas y clapper */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white shadow">
                      🎬
                    </span>
                  </div>

                  {/* Botón quitar (no navega) */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      remove(id, isTMDB ? "tmdb" : "local");
                    }}
                    className="absolute top-3 right-3 text-xs rounded px-2 py-1 border bg-black/60 text-white border-white/20 backdrop-blur hover:bg-black/70"
                    title="Quitar de mi lista"
                  >
                    Quitar
                  </button>

                  {/* Título y meta en la base */}
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="relative text-white">
                      <h3 className="font-semibold line-clamp-2 drop-shadow">
                        {movie.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] opacity-90">
                        {year ? `Año ${year}` : ""}
                        {year && rating != null ? " • " : ""}
                        {rating != null ? `⭐ ${rating}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Cinta de film decorativa */}
                  <div className="absolute -bottom-[1px] inset-x-0 h-3 bg-[radial-gradient(circle,_theme(colors.neutral.800)_2px,_transparent_2.5px)] dark:bg-[radial-gradient(circle,_theme(colors.neutral.700)_2px,_transparent_2.5px)] [background-size:16px_8px] [background-position:center]" />
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- subcomponentes ---------------- */

function Header({ title, subtitle }) {
  return (
    <div className="rounded-2xl border overflow-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(100%_60%_at_50%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="bg-gradient-to-r from-[#8B0000] via-red-600 to-orange-500 text-white px-4 py-8 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
              <p className="text-white/90 text-sm">{subtitle}</p>
            </div>
            <div className="text-xs uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/20">
              🍿 Tu cine personal — ¡disfrutá!
            </div>
          </div>
        </div>
        <div className="h-3 bg-[radial-gradient(circle,_rgba(0,0,0,0.35)_2px,_transparent_2.5px)] [background-size:16px_8px] [background-position:center]" />
      </div>
    </div>
  );
}
