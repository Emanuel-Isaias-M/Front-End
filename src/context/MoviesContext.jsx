// src/context/MoviesContext.jsx
// CRUD local conectado al backend + paginación y búsqueda (q)
// Ahora: NO hace fetch si no estás autenticado o si no estás en /items

import { createContext, useContext, useEffect, useReducer } from "react";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router-dom";
import api from "../api/axios";

const MoviesContext = createContext();

const initialState = {
  movies: [],
  loading: false,
  error: null,
  q: "",
  page: 1,
  limit: 12, // grilla 4x en desktop
  total: 0,
  pages: 1,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOADING":
      return { ...state, loading: true, error: null };
    case "ERROR":
      return { ...state, loading: false, error: action.payload };
    case "SET_LIST":
      return {
        ...state,
        movies: action.payload.items || [],
        total: action.payload.total || 0,
        page: action.payload.page || 1,
        pages: action.payload.pages || 1,
        loading: false,
        error: null,
      };
    case "SET_Q":
      return { ...state, q: action.payload, page: 1 };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    case "SET_LIMIT":
      return { ...state, limit: action.payload, page: 1 };
    case "ADD":
      return { ...state, movies: [action.payload, ...state.movies], loading: false, total: state.total + 1 };
    case "UPDATE":
      return {
        ...state,
        movies: state.movies.map((m) => (m.id === action.payload.id ? action.payload : m)),
        loading: false,
      };
    case "REMOVE":
      return {
        ...state,
        movies: state.movies.filter((m) => m.id !== action.payload),
        loading: false,
        total: Math.max(0, state.total - 1),
      };
    case "CLEAR":
      return { ...initialState };
    default:
      return state;
  }
}

export function MoviesProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // GET /movies con q, page, limit (solo si auth + estamos en /items)
  const fetchMovies = async () => {
    try {
      dispatch({ type: "LOADING" });
      const { q, page, limit } = state;
      const { data } = await api.get("/movies", { params: { q, page, limit } });
      // backend: { items, total, page, pages }
      dispatch({ type: "SET_LIST", payload: data });
    } catch (e) {
      dispatch({ type: "ERROR", payload: e.response?.data?.message || e.message });
    }
  };

  // Guardas:
  // - si NO hay token, limpio lista y NO llamo a /movies
  // - si hay token PERO no estás en /items*, no llamo
  // *esto evita 401 en /login y llamadas innecesarias en otras páginas
  useEffect(() => {
    const onItems = location.pathname.startsWith("/items");
    if (!isAuthenticated) {
      dispatch({ type: "CLEAR" });
      return;
    }
    if (!onItems) return;

    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, location.pathname, state.q, state.page, state.limit]);

  // Métodos CRUD
  const createMovie = async (payload) => {
    try {
      dispatch({ type: "LOADING" });
      const { data } = await api.post("/movies", payload);
      dispatch({ type: "ADD", payload: data });
      return data;
    } catch (e) {
      dispatch({ type: "ERROR", payload: e.response?.data?.message || e.message });
      throw e;
    }
  };

  const updateMovie = async (id, payload) => {
    try {
      dispatch({ type: "LOADING" });
      const { data } = await api.put(`/movies/${id}`, payload);
      dispatch({ type: "UPDATE", payload: data });
      return data;
    } catch (e) {
      dispatch({ type: "ERROR", payload: e.response?.data?.message || e.message });
      throw e;
    }
  };

  const removeMovie = async (id) => {
    try {
      dispatch({ type: "LOADING" });
      await api.delete(`/movies/${id}`);
      dispatch({ type: "REMOVE", payload: id });
    } catch (e) {
      dispatch({ type: "ERROR", payload: e.response?.data?.message || e.message });
      throw e;
    }
  };

  // setters
  const setQuery = (q) => dispatch({ type: "SET_Q", payload: q });
  const setPage = (p) => dispatch({ type: "SET_PAGE", payload: p });
  const setLimit = (n) => dispatch({ type: "SET_LIMIT", payload: n });

  return (
    <MoviesContext.Provider
      value={{
        ...state,
        fetchMovies,
        createMovie,
        updateMovie,
        removeMovie,
        setQuery,
        setPage,
        setLimit,
      }}
    >
      {children}
    </MoviesContext.Provider>
  );
}

export const useMovies = () => useContext(MoviesContext);



