import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getPopular,
  searchMovies,
  getByYear,
  getKidFantasyAnimation,
  searchKidFantasyAnimation,
} from "../services/tmdb.service";
import CatalogCard from "../components/CatalogCard";
import Pagination from "../components/Pagination";

const GENRES = [
  { id: 28, name: "Acción" },
  { id: 35, name: "Comedia" },
  { id: 12, name: "Aventura" },
  { id: 16, name: "Animación" },
  { id: 14, name: "Fantasía" },       // 👈 AÑADIDO
  { id: 10751, name: "Familiar" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Terror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Ciencia Ficción" },
  { id: 53, name: "Thriller" },
];

function getGenreIds(movie) {
  if (Array.isArray(movie?.genre_ids)) return movie.genre_ids;
  if (typeof movie?.genre === "string" && movie.genre.startsWith("#")) {
    const n = Number(movie.genre.slice(1));
    return Number.isFinite(n) ? [n] : [];
  }
  return [];
}
function getYear(m) {
  if (typeof m?.year === "number") return String(m.year);
  if (typeof m?.release_date === "string" && m.release_date.length >= 4)
    return m.release_date.slice(0, 4);
  return "";
}
function isYYYY(v) {
  return /^\d{4}$/.test((v || "").trim());
}

export default function Discover() {
  const { currentProfile } = useAuth();
  const isKid = currentProfile?.type === "kid";
  const [params, setParams] = useSearchParams();

  const qParam = (params.get("q") || "").trim();
  const pageParam = Number(params.get("page") || 1);
  const yearParam = (params.get("year") || "").slice(0, 4).replace(/\D/g, "");
  const genreParam = params.get("genre") || "";

  const [search, setSearch] = useState(qParam);
  const [year, setYear] = useState(yearParam);

  const [data, setData] = useState({ results: [], page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    setSearch(qParam);
  }, [qParam]);
  useEffect(() => {
    setYear(yearParam);
  }, [yearParam]);

  // Fetch: popular / search / discover(year) (con ramas especiales para niños)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        let res;

        if (isKid) {
          if (yearParam && !qParam) {
            // Niño + AÑO → discover con with_genres=16,14 (20 reales por página)
            res = await getByYear(yearParam, pageParam, true);
          } else if (qParam) {
            // Niño + búsqueda → acumula hasta 20 Animación/Fantasía
            res = await searchKidFantasyAnimation(qParam, pageParam);
          } else {
            // Niño sin filtros → feed solo Animación/Fantasía (20 reales por página)
            res = await getKidFantasyAnimation(pageParam);
          }
        } else {
          if (yearParam && !qParam) {
            res = await getByYear(yearParam, pageParam, false);
          } else if (qParam) {
            res = await searchMovies(qParam, pageParam);
          } else {
            res = await getPopular(pageParam);
          }
        }

        if (!alive) return;
        setData(res);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        if (!alive) return;
        const status = e?.response?.status;
        setErr(
          status === 401
            ? "TMDB 401: Token inválido o faltante."
            : status === 429
            ? "TMDB 429: Límite de peticiones."
            : "No se pudo cargar catálogo."
        );
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [qParam, pageParam, yearParam, isKid]);

  // Filtros client-side: chip de género y (si hay qParam) filtro por año
  const filtered = useMemo(() => {
    let arr = data.results || [];

    if (genreParam) {
      const gid = Number(genreParam);
      if (Number.isFinite(gid)) {
        arr = arr.filter((m) => getGenreIds(m).includes(gid));
      }
    }

    // Si buscamos por título y además hay año, filtramos localmente por año
    if (qParam && yearParam && isYYYY(yearParam)) {
      arr = arr.filter((m) => getYear(m) === yearParam);
    }

    return arr;
  }, [data.results, genreParam, qParam, yearParam]);

  // Paginación
  const handlePage = (p) => {
    const next = new URLSearchParams(params);
    if (p > 1) next.set("page", String(p));
    else next.delete("page");
    setParams(next, { replace: false });
  };

  // Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    const term = (search || "").trim();
    const y = (year || "").trim().replace(/\D/g, "").slice(0, 4);

    // Si escribiste un YYYY en el buscador y no cargaste el campo Año, lo tomamos como año.
    if (!y && isYYYY(term)) {
      next.set("year", term);
      next.delete("q");
    } else {
      if (term) next.set("q", term);
      else next.delete("q");

      if (y) next.set("year", y);
      else next.delete("year");

      if (y && !term) next.delete("q");
    }

    next.delete("page");
    setParams(next, { replace: false });
  };

  const clearAll = () => {
    const next = new URLSearchParams(params);
    next.delete("q");
    next.delete("page");
    next.delete("year");
    next.delete("genre");
    setParams(next, { replace: false });
    setSearch("");
    setYear("");
  };

  const toggleGenre = (id) => {
    const next = new URLSearchParams(params);
    const current = next.get("genre");
    if (current && Number(current) === id) next.delete("genre");
    else next.set("genre", String(id));
    next.delete("page");
    setParams(next, { replace: false });
  };

  const activeGenreId = Number(genreParam) || null;

  // Chips visibles: si es niño, solo Animación (16) y Fantasía (14)
  const visibleGenres = isKid
    ? GENRES.filter((g) => g.id === 16 || g.id === 14)
    : GENRES;

  return (
    <section className="space-y-4">
      {/* Título + buscador */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          {yearParam && !qParam
            ? `Películas de ${yearParam}`
            : qParam
            ? `Resultados para “${qParam}”`
            : isKid
            ? "Animación y Fantasía"
            : "Películas populares"}
        </h1>

        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título… o escribí un año (p.ej. 2018)"
            className="rounded border px-3 py-2 bg-white text-neutral-900 border-neutral-300 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder-neutral-500"
            aria-label="Buscar películas por título o año"
          />
          <input
            value={year}
            onChange={(e) =>
              setYear(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputMode="numeric"
            pattern="\d{4}"
            placeholder="Año"
            className="w-24 rounded border px-3 py-2 bg-white text-neutral-900 border-neutral-300 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:placeholder-neutral-500"
            aria-label="Filtrar por año (YYYY)"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Buscar
          </button>
          {(qParam || yearParam || genreParam) && (
            <button
              type="button"
              onClick={clearAll}
              className="px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              title="Limpiar filtros"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Chips de géneros */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm opacity-70 mr-1">Explorar por género:</span>
        {visibleGenres.map((g) => {
          const active = activeGenreId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGenre(g.id)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                active
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
              }`}
              aria-pressed={active}
            >
              {g.name}
            </button>
          );
        })}
      </div>

      {/* Atajo a tu portada /items */}
      <div className="flex items-center justify-between">
        <span className="text-sm opacity-70">
          {qParam || yearParam || genreParam
            ? "Resultados filtrados"
            : isKid
            ? "Catálogo niños (TMDB)"
            : "Tendencias del día (TMDB)"}
        </span>
        <Link to="/items" className="text-sm underline opacity-80">
          Ir a Nodo-Cine
        </Link>
      </div>

      {loading && <p>Cargando…</p>}
      {err && <p className="text-red-600">{err}</p>}

      {!loading && !err && (
        filtered.length === 0 ? (
          <p>No hay resultados.</p>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
              {filtered.map((m) => (
                <CatalogCard key={m.id} movie={{ ...m, source: "tmdb" }} />
              ))}
            </div>

            <Pagination
              page={data.page}
              total={Math.min(data.total_pages || 1, 500)}
              onChange={handlePage}
            />
          </>
        )
      )}
    </section>
  );
}