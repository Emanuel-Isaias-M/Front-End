// src/services/tmdb.service.js
// Usa el wrapper de backend (/api/tmdb/*). No pegamos directo a TMDB.
import tmdb, { toMovieCard } from "../api/tmdb";

const lang = import.meta.env.VITE_TMDB_LANG || "es-AR";
const region = import.meta.env.VITE_TMDB_REGION || "AR";

export async function getPopular(page = 1) {
  const data = await tmdb.popular({ page, language: lang, region });
  return {
    page: data.page,
    total_pages: data.total_pages,
    results: (data.results || []).map(toMovieCard),
  };
}

export async function searchMovies(query, page = 1) {
  const data = await tmdb.search(query, { page, language: lang, region });
  return {
    page: data.page,
    total_pages: data.total_pages,
    results: (data.results || []).map(toMovieCard),
  };
}

/**
 * Year real (20 por página) vía /tmdb/discover.
 * Si kid=true, limitamos estrictamente a Animación(16) y Fantasía(14).
 */
export async function getByYear(year, page = 1, kid = false) {
  const params = {
    page,
    language: lang,
    region,
    year, // primary_release_year
  };

  if (kid) {
    params.with_genres = "16,14"; // solo Animación y Fantasía
    params.certification_country = "US"; // opcional: acotar por rating
    params.certification_lte = "PG";
  }

  const data = await tmdb.discover(params);
  return {
    page: data.page,
    total_pages: data.total_pages,
    results: (data.results || []).map(toMovieCard),
  };
}

/** Feed para niños (sin búsqueda): SOLO Fantasía+Animación, 20 reales por página */
export async function getKidFantasyAnimation(page = 1) {
  const data = await tmdb.discover({
    page,
    language: lang,
    region,
    with_genres: "16,14",
    include_adult: false,
    certification_country: "US",
    certification_lte: "PG",
  });
  return {
    page: data.page,
    total_pages: data.total_pages,
    results: (data.results || []).map(toMovieCard),
  };
}

/**
 * Búsqueda por título en modo niño:
 * - llamamos /tmdb/search y acumulamos HASTA 20 que pertenezcan a 16 o 14
 * - si esa página no tiene suficientes, avanzamos páginas de TMDB hasta completar 20 o agotar
 */
export async function searchKidFantasyAnimation(query, page = 1) {
  const ALLOWED = new Set([16, 14]);
  const perPage = 20;
  let collected = [];
  let tmdbPage = page; // empezamos en la página pedida
  let total_pages = 1;

  while (collected.length < perPage) {
    const data = await tmdb.search(query, { page: tmdbPage, language: lang, region });
    total_pages = data.total_pages || 1;

    const chunk = (data.results || [])
      .map(toMovieCard)
      .filter((m) => Array.isArray(m.genre_ids) && m.genre_ids.some((id) => ALLOWED.has(id)));

    collected.push(...chunk);

    if (tmdbPage >= total_pages) break; // no hay más
    if ((data.results || []).length === 0) break; // no trae más
    if (chunk.length === 0 && (data.results || []).length === 0) break;

    tmdbPage++;
  }

  return {
    page,
    total_pages, // de TMDB (no es "filtrado", pero sirve para paginar)
    results: collected.slice(0, perPage),
  };
}

export async function getMovieDetail(id) {
  const data = await tmdb.movie(id, { language: lang, region });
  return { raw: data, card: toMovieCard(data) };
}

// Opcional: como aún no hay endpoint de providers en el backend, devolvemos null
export async function getWatchProviders(_id) {
  return null;
}
