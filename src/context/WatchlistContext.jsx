// src/context/WatchlistContext.jsx
// Watchlist conectada al backend (por perfil):
// - GET /watchlist?profileId=...
// - POST /watchlist (toggle/add)  -> SIEMPRE mandamos movieId (string), como antes
// - DELETE /watchlist/:movieId?profileId=...&source=...

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "../api/axios";

const WatchlistContext = createContext(null);

// helpers
const toStr = (v) => (v == null ? "" : String(v).trim());
const isNumeric = (s) => /^[0-9]+$/.test(String(s));

export function WatchlistProvider({ children }) {
  const { currentProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Backend -> UI
  // El backend devuelve items con movieId (para local y también para TMDB en tu implementación anterior)
  const fromBackend = (arr) =>
    (arr || []).map((i) => ({
      id: toStr(i.movieId),
      source: i.source || (isNumeric(i.movieId) ? "tmdb" : "local"),
      title: i.title ?? "",
      posterUrl: i.posterUrl || "",
      year: i.year ?? "",
      rating: i.rating ?? 0,
    }));

  // Acepta:
  // - local: { movieId } o { id (ObjectId) }
  // - tmdb:  { tmdbId } o { id (number) }
  // Y SIEMPRE normaliza a { movieId: string } para el backend.
  const normalizeIn = (movie) => {
    if (!movie) return null;

    // id de entrada posible
    const candidate =
      movie.movieId ?? movie.id ?? movie.tmdbId ?? movie.tmdb_id ?? "";

    const movieId = toStr(candidate);
    if (!movieId) return null;

    // origen (si no viene, lo inferimos)
    const source =
      (movie.source || (isNumeric(movieId) ? "tmdb" : "local")).trim();

    const title = movie.title || movie.name || "";
    const posterUrl =
      movie.posterUrl ||
      movie.poster_path ||
      "";
    const year =
      movie.year ??
      (movie.release_date ? Number(String(movie.release_date).slice(0, 4)) : null);
    const rating = movie.rating ?? movie.vote_average ?? null;

    return { movieId, source, title, posterUrl, year, rating };
  };

  // Carga inicial / cambio de perfil
  useEffect(() => {
    if (!currentProfile?.id) {
      setItems([]);
      setError(null);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/watchlist", {
          params: { profileId: currentProfile.id },
        });
        setItems(fromBackend(data.items));
      } catch (e) {
        setError(e?.response?.data?.message || e.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentProfile?.id]);

  const isInWatchlist = (movieId, source = "tmdb") =>
    items.some((m) => m.id === toStr(movieId) && m.source === source);

  const toggle = async (movie) => {
    if (!currentProfile?.id) throw new Error("Seleccioná un perfil primero.");
    const norm = normalizeIn(movie);
    if (!norm?.movieId) throw new Error("movieId requerido.");

    const payload = {
      profileId: currentProfile.id,
      movieId: norm.movieId,  // <- SIEMPRE movieId (string)
      source: norm.source,     // "local" o "tmdb"
      title: norm.title,
      posterUrl: norm.posterUrl,
      // opcionales: si tu backend es quisquilloso, podés comentar year/rating
      year: norm.year ?? null,
      rating: norm.rating ?? null,
    };

    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post("/watchlist", payload); // toggle
      setItems(fromBackend(data.items));
      return data;
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const add = async (movie) => {
    if (!currentProfile?.id) throw new Error("Seleccioná un perfil primero.");
    const norm = normalizeIn(movie);
    if (!norm?.movieId) throw new Error("movieId requerido.");

    const payload = {
      profileId: currentProfile.id,
      movieId: norm.movieId,  // <- SIEMPRE movieId
      source: norm.source,
      title: norm.title,
      posterUrl: norm.posterUrl,
      year: norm.year ?? null,
      rating: norm.rating ?? null,
    };

    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post("/watchlist", payload, {
        params: { mode: "add" },
      });
      setItems(fromBackend(data.items));
      return data;
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (movieId, source) => {
    if (!currentProfile?.id) throw new Error("Seleccioná un perfil primero.");
    const idStr = toStr(movieId);
    if (!idStr) throw new Error("movieId requerido.");
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.delete(`/watchlist/${encodeURIComponent(idStr)}`, {
        params: { profileId: currentProfile.id, ...(source ? { source } : {}) },
      });
      setItems(fromBackend(data.items));
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      add,
      remove,
      toggle,
      isInWatchlist,
    }),
    [items, loading, error]
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export const useWatchlist = () => useContext(WatchlistContext);
