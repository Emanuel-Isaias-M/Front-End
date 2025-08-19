// src/pages/MovieList.jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMovies } from "../context/MoviesContext.jsx";
import { useWatchlist } from "../context/WatchlistContext.jsx";
import { toast } from "react-toastify";

/* helpers */
const FALLBACK_POSTER = "https://via.placeholder.com/600x900/111315/FFFFFF?text=Sin+Poster";

function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

// ✅ Construye la fecha en LOCAL (evita el bug de -1 día)
function parseLocalDateTime(dateLike, hhmm = "00:00") {
  if (!dateLike) return null;
  const [H, M] = String(hhmm || "00:00").slice(0,5).split(":").map(Number);

  if (typeof dateLike === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateLike)) {
    const [y, m, d] = dateLike.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1, H || 0, M || 0, 0, 0);
  }

  const base = new Date(dateLike);
  if (isNaN(base)) return null;
  base.setHours(H || 0, M || 0, 0, 0);
  return base;
}

function labelForDay(date, baseToday = new Date()) {
  if (!date) return null;
  const d = startOfDay(date), t = startOfDay(baseToday);
  const tomorrow = new Date(t); tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.getTime() === t.getTime()) return "Hoy";
  if (d.getTime() === tomorrow.getTime()) return "Mañana";
  return null;
}
function fmtDate(d) {
  const dd = new Date(d);
  return dd.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short" });
}

export default function MovieList() {
  const { movies, loading, error } = useMovies();
  const { add, isInWatchlist } = useWatchlist();

  const cards = useMemo(() => {
    const now = new Date();
    const list = (movies || []).map((m) => {
      const when = m.showDate && m.showTime ? parseLocalDateTime(m.showDate, m.showTime) : null;
      const isFuture = when ? when >= now : false;
      return { movie: m, when: isFuture ? when : null };
    });

    list.sort((a, b) => {
      if (a.when && b.when) return a.when - b.when;
      if (a.when && !b.when) return -1;
      if (!a.when && b.when) return 1;
      return a.movie.title.localeCompare(b.movie.title);
    });

    return list;
  }, [movies]);

  const onAdd = async (movie) => {
    try {
      await add({ ...movie, source: "local" });
      toast.success("Agregada a tu lista");
    } catch (e) {
      toast.error(e?.message || "No se pudo agregar a tu lista");
    }
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <Header title="Cartelera" subtitle="Funciones programadas y próximas" />
        <SkeletonGrid />
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4">
        <Header title="Cartelera" subtitle="Funciones programadas y próximas" />
        <div className="rounded-lg border p-6 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
          <p className="text-red-700 dark:text-red-300">{String(error)}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Header title="Cartelera" subtitle="Funciones programadas y próximas" />

      {cards.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ movie, when }) => {
            const poster =
              movie?.posterUrl && movie.posterUrl.trim() !== "" ? movie.posterUrl : FALLBACK_POSTER;

            const inList = isInWatchlist(movie.id, "local");

            return (
              <article
                key={movie.id}
                className="group rounded-2xl border overflow-hidden bg-white/50 dark:bg-neutral-900/60 backdrop-blur hover:shadow-xl transition-shadow"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10" />
                  <img
                    src={poster}
                    alt={movie.title}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white shadow">
                      🎬
                    </span>
                    <h3 className="text-white font-semibold drop-shadow line-clamp-1">
                      {movie.title}
                    </h3>
                  </div>

                  <div className="absolute top-3 right-3 z-20">
                    {when ? (
                      <div className="flex gap-2">
                        <span className="text-[11px] uppercase tracking-wide px-2 py-1 rounded bg-green-600 text-white shadow">
                          {labelForDay(when) || fmtDate(when)}
                        </span>
                        <span className="text-[11px] uppercase tracking-wide px-2 py-1 rounded bg-blue-600 text-white shadow">
                          {String(movie.showTime).slice(0, 5)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] uppercase tracking-wide px-2 py-1 rounded bg-amber-500 text-white shadow">
                        Próximamente
                      </span>
                    )}
                  </div>

                  <div className="absolute -bottom-[1px] inset-x-0 h-3 bg-[radial-gradient(circle,_theme(colors.neutral.800)_2px,_transparent_2.5px)] dark:bg-[radial-gradient(circle,_theme(colors.neutral.700)_2px,_transparent_2.5px)] [background-size:16px_8px] [background-position:center]" />
                </div>

                <div className="p-4">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 flex flex-wrap items-center gap-2">
                    <span>{movie.genre}</span>
                    <span className="opacity-40">•</span>
                    <span>{movie.year}</span>
                    <span className="opacity-40">•</span>
                    <span>⭐ {movie.rating}</span>
                  </p>

                  <p className="mt-2 text-sm text-neutral-800 dark:text-neutral-200 line-clamp-3">
                    {movie.overview}
                  </p>

                  <div className="my-4 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    <div className="flex-1 border-t border-dashed border-neutral-200 dark:border-neutral-700" />
                    <span className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      className="px-3 py-2 rounded-md border dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      to={`/items/${movie.id}`}
                      title="Ver detalle"
                    >
                      Ver detalle
                    </Link>

                    {inList ? (
                      <button
                        className="px-4 py-2 rounded-md border border-green-600 text-green-700 dark:text-green-300 bg-green-600/10 cursor-default"
                        disabled
                        title="Ya está en tu lista"
                      >
                        ✓ En mi lista
                      </button>
                    ) : (
                      <button
                        className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 shadow"
                        onClick={() => onAdd(movie)}
                        title="Agregar a mi lista"
                      >
                        Agregar a mi lista
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* subcomponents (Header, SkeletonGrid, EmptyState) se quedan igual */


/* subcomponents */
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
              🍿 Bienvenido a Nodo-Cine — ¡disfrutá la función!
            </div>
          </div>
        </div>
        <div className="h-3 bg-[radial-gradient(circle,_rgba(0,0,0,0.35)_2px,_transparent_2.5px)] [background-size:16px_8px] [background-position:center]" />
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border overflow-hidden">
          <div className="h-64 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
            <div className="my-3 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex-1 border-t border-dashed border-neutral-200 dark:border-neutral-800" />
              <span className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            </div>
            <div className="h-9 w-full bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border p-8 text-center bg-white/60 dark:bg-neutral-900/60">
      <div className="text-4xl mb-2">🍿</div>
      <p className="mb-1 text-lg font-semibold">No hay películas cargadas.</p>
      <p className="opacity-70 text-sm">
        Las que no tengan función aparecerán como <strong>PRÓXIMAMENTE</strong>.
      </p>
    </div>
  );
}
