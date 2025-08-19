// src/api/tmdb.js
// Usa tu backend como proxy (/api/tmdb/*). No pegamos directo a TMDB.
import api from "./axios";

const DEFAULT_LANG = import.meta.env.VITE_TMDB_LANG || "es-AR";
const DEFAULT_REGION = import.meta.env.VITE_TMDB_REGION || "AR";

const tmdb = {
  popular: (params = {}) =>
    api
      .get("/tmdb/popular", {
        params: { language: DEFAULT_LANG, region: DEFAULT_REGION, ...params },
      })
      .then((r) => r.data),

  search: (q, params = {}) =>
    api
      .get("/tmdb/search", {
        params: { q, language: DEFAULT_LANG, region: DEFAULT_REGION, ...params },
      })
      .then((r) => r.data),

  movie: (id, params = {}) =>
    api
      .get(`/tmdb/movie/${id}`, {
        params: { language: DEFAULT_LANG, region: DEFAULT_REGION, ...params },
      })
      .then((r) => r.data),

  // 👇 nuevo: discover (para búsquedas por año y/o filtros server-side)
  discover: (params = {}) =>
    api
      .get("/tmdb/discover", {
        params: { language: DEFAULT_LANG, region: DEFAULT_REGION, include_adult: false, ...params },
      })
      .then((r) => r.data),
};

export const imgUrl = (path, size = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

// Aseguramos info útil para filtros (genre_ids, release_date)
export const toMovieCard = (m) => ({
  id: m.id,
  title: m.title || m.name || "Sin título",
  year: m.release_date ? Number(m.release_date.slice(0, 4)) : "",
  rating: typeof m.vote_average === "number" ? Number(m.vote_average.toFixed(1)) : 0,
  overview: m.overview || "",
  posterUrl: imgUrl(m.poster_path, "w500"),
  posterLargeUrl: imgUrl(m.poster_path, "w780"),
  genre: Array.isArray(m.genre_ids) && m.genre_ids.length ? `#${m.genre_ids[0]}` : "",
  adult: Boolean(m.adult),
  // 👇 importantes para filtrado en Discover
  genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids : [],
  release_date: m.release_date || "",
});

export { tmdb };
export default tmdb;
