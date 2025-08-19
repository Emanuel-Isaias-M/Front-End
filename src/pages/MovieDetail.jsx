// src/pages/MovieDetail.jsx
import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMovies } from "../context/MoviesContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useWatchlist } from "../context/WatchlistContext.jsx";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

const FALLBACK_POSTER = "/poster-fallback.svg";

/* ======================== helpers (LOCAL-SAFE) ======================== */
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Detecta si viene "YYYY-MM-DD"
function isYMD(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Construye Date en **hora local** evitando el bug de UTC
function parseLocalDate(dateYMD) {
  if (!dateYMD) return null;
  if (isYMD(dateYMD)) {
    const [y, m, d] = dateYMD.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const tmp = new Date(dateYMD);
  return isNaN(tmp) ? null : tmp;
}

function parseLocalDateTime(dateYMD, hhmm = "00:00") {
  const base = parseLocalDate(dateYMD);
  if (!base) return null;
  const [hh, mm] = String(hhmm || "00:00").split(":").map(Number);
  base.setHours(hh || 0, mm || 0, 0, 0);
  return base;
}

function labelForDay(date, baseToday = new Date()) {
  if (!date) return null;
  const d = startOfDay(date),
    t = startOfDay(baseToday);
  const tomorrow = new Date(t);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.getTime() === t.getTime()) return "Hoy";
  if (d.getTime() === tomorrow.getTime()) return "Mañana";
  return null;
}

function fmtDate(d) {
  const dd = new Date(d);
  return dd.toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

/* ===================================================================== */

export default function MovieDetail() {
  const { id } = useParams();
  const { movies, removeMovie } = useMovies();
  const { user, currentProfile } = useAuth();
  const { isInWatchlist, toggle } = useWatchlist();

  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const roles = user?.roles || [];
  const canEdit = roles.includes("admin") || roles.includes("editor");
  const canDelete = roles.includes("admin"); // solo admin elimina

  const movie = movies.find((m) => String(m.id) === String(id));
  if (!movie) return <p>No existe la película.</p>;

  const poster = movie.posterUrl || FALLBACK_POSTER;

  // Próxima función (si fecha/hora son futuras) — parser LOCAL
  const when = useMemo(() => {
    if (!movie.showDate || !movie.showTime) return null;
    const w = parseLocalDateTime(movie.showDate, movie.showTime);
    return w && w >= new Date() ? w : null;
  }, [movie.showDate, movie.showTime]);

  /* ================== Watchlist (usa contrato del Context) ================== */
  const contentId = String(movie.id);
  const source = "local"; // catálogo propio
  const inList = isInWatchlist(contentId, source);

  const handleToggleWatchlist = async () => {
    try {
      if (!currentProfile) {
        toast.warn("Elegí un perfil para usar Mi lista.");
        return;
      }
      await toggle({
        id: contentId,
        source,
        title: movie.title || "Sin título",
        posterUrl: poster,
        year: movie.year ? Number(movie.year) : null,
        rating: typeof movie.rating === "number" ? movie.rating : 0,
      });
      toast.success(inList ? "Quitado de tu lista" : "Agregado a tu lista");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 401
          ? "Necesitás iniciar sesión"
          : "No se pudo actualizar tu lista");
      toast.error(msg);
    }
  };

  /* ================================ Delete ================================ */
  const onDelete = async () => {
    if (!canDelete) {
      toast.error("No autorizado: solo un administrador puede eliminar.");
      return;
    }
    const ok = await Swal.fire({
      title: "¿Eliminar?",
      text: `Se eliminará "${movie.title}"`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (!ok.isConfirmed) return;

    try {
      setIsDeleting(true);
      await removeMovie(movie.id);
      toast.success("Eliminado correctamente");
      navigate("/items");
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 403
          ? "No autorizado: solo admin puede eliminar."
          : "No se pudo eliminar, intentá nuevamente.");
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* ===== Hero con ÚNICA imagen (poster) SIN RECORTES =====
           isolate + z-0 => el Navbar (z-30/z-50) siempre queda arriba */}
      <div className="rounded-2xl border overflow-hidden isolate z-0">
        <div className="relative h-[40rem] sm:h-[44rem]">
          {/* Fondo blur para rellenar sin bordes */}
          <div
            className="absolute inset-0 bg-center bg-cover blur-lg scale-110"
            style={{ backgroundImage: `url(${poster})` }}
          />
          {/* Gradiente superior para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          {/* Póster visible entero */}
          <img
            src={poster}
            alt={`Póster de ${movie.title}`}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_POSTER;
            }}
            className="relative z-[1] mx-auto h-full w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)]"
          />

          {/* Información sobre la imagen */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-[2]">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="text-white">
                <div className="inline-flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-red-600 shadow">
                    🎬
                  </span>
                  <h1 className="text-4xl font-extrabold tracking-tight drop-shadow line-clamp-2">
                    {movie.title}
                  </h1>
                </div>
                <p className="text-white/90">
                  {movie.genre} • {movie.year} • ⭐ {movie.rating}
                  {movie.director ? ` • Dir. ${movie.director}` : ""}
                </p>

                {/* Sinopsis breve */}
                {movie.overview && (
                  <p className="mt-3 max-w-3xl text-white/90 line-clamp-3">
                    {movie.overview}
                  </p>
                )}
              </div>

              {/* Badges de función */}
              <div className="flex gap-2 self-start md:self-auto">
                {when ? (
                  <>
                    <span className="text-[11px] uppercase tracking-wider px-3 py-1 rounded bg-green-600 text-white shadow">
                      {labelForDay(when) || fmtDate(when)}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider px-3 py-1 rounded bg-blue-600 text-white shadow">
                      {String(movie.showTime).slice(0, 5)}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] uppercase tracking-wider px-3 py-1 rounded bg-amber-500 text-white shadow">
                    Próximamente
                  </span>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-md shadow ${
                  inList
                    ? "bg-black/70 text-white border border-white/20 hover:bg-black/80"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
                onClick={handleToggleWatchlist}
                title={inList ? "Quitar de mi lista" : "Agregar a mi lista"}
              >
                {inList ? "✓ En mi lista" : "+ Mi lista"}
              </button>

              {canEdit && (
                <Link className="btn-warning" to={`/items/${movie.id}/edit`}>
                  Editar
                </Link>
              )}

              {canDelete && (
                <button
                  className="btn-danger"
                  onClick={onDelete}
                  disabled={isDeleting}
                  title="Eliminar película"
                >
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </button>
              )}

              <Link className="btn-secondary" to="/items">
                Volver
              </Link>
            </div>
          </div>
        </div>

        {/* “Cinta de film” decorativa inferior */}
        <div className="h-3 bg-[radial-gradient(circle,_rgba(0,0,0,0.35)_2px,_transparent_2.5px)] [background-size:16px_8px] [background-position:center]" />
      </div>

      {/* Meta inferior */}
      <div className="rounded-2xl border p-4 bg-white/60 dark:bg-neutral-900/60">
        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          {movie.createdAt && (
            <>
              Agregada el{" "}
              {new Date(movie.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </>
          )}
          {movie.updatedAt && (
            <>
              {" "}
              • Actualizada el{" "}
              {new Date(movie.updatedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
