// src/api/axios.js
// Cliente Axios para tu backend con:
// - Authorization: Bearer <accessToken>
// - Refresh automático si el access expira (401) y reintento del request original
// - Limpieza + redirect a /login si el refresh falla
// - Manejo coordinado para evitar múltiples refresh en paralelo

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

/* ============== Tokens (access / refresh) ============== */
const ACCESS_KEY = "nc_access";
const REFRESH_KEY = "nc_refresh";

// compat con llaves viejas por si las usabas antes
const LEGACY_KEYS = ["token", "access_token", "jwt"];
function readLegacyAccess() {
  for (const k of LEGACY_KEYS) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

function getAccess() {
  return localStorage.getItem(ACCESS_KEY) || readLegacyAccess();
}
function getRefresh() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access, refresh) {
  if (typeof access === "string") localStorage.setItem(ACCESS_KEY, access);
  if (typeof refresh === "string") localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  LEGACY_KEYS.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

/* =================== Interceptor REQUEST =================== */
api.interceptors.request.use((config) => {
  // evita adjuntar Authorization en endpoints públicos si quisieras (opcional)
  // const isPublic = config.url?.startsWith("/tmdb/");
  const token = getAccess();
  if (token /* && !isPublic */) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ====== Interceptor RESPONSE con refresh coordinado ====== */
let isRefreshing = false;
let waiters = [];

// uso axios "crudo" para evitar loops de interceptors durante el refresh
async function refreshAccess() {
  try {
    const rt = getRefresh();
    if (!rt) return null;
    const { data } = await axios.post(
      `${import.meta.env.VITE_API_BASE}/auth/refresh`,
      { refreshToken: rt },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );
    if (data?.accessToken) {
      setTokens(data.accessToken); // actualizo solo el access
      window.dispatchEvent(new CustomEvent("auth:refreshed"));
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

// Notifica a todos los que esperaban el refresh
function flushWaiters(newAccess) {
  const list = waiters;
  waiters = [];
  list.forEach((cb) => {
    try { cb(newAccess); } catch {}
  });
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error.config || {};

    // No intentes refresh sobre el mismo refresh/login/register
    const url = (original.baseURL || api.defaults.baseURL || "") + (original.url || "");
    const isAuthPath = /\/auth\/(login|register|refresh)/.test(url);

    if (status === 401 && !original._retry && !isAuthPath) {
      original._retry = true;

      // Encolá el reintento del request actual (incluye el primero)
      const retryPromise = new Promise((resolve, reject) => {
        const retry = async (newAccess) => {
          if (!newAccess) {
            // refresh falló → limpio sesión y redirijo
            clearTokens();
            window.dispatchEvent(new Event("auth:logout"));
            if (!location.pathname.startsWith("/login")) {
              window.location.replace("/login");
            }
            return reject(error);
          }
          try {
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${newAccess}`;
            if (!original.baseURL) original.baseURL = api.defaults.baseURL;
            const res = await axios(original); // hago el request "crudo"
            resolve(res);
          } catch (e) {
            reject(e);
          }
        };
        waiters.push(retry);
      });

      // Si no hay refresh en curso, lo inicio
      if (!isRefreshing) {
        isRefreshing = true;
        const newAccess = await refreshAccess();
        isRefreshing = false;
        flushWaiters(newAccess);
      }

      return retryPromise;
    }

    return Promise.reject(error);
  }
);

export default api;
