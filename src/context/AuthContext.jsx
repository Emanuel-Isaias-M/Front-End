// src/context/AuthContext.jsx
// Conectado al backend real:
// - /auth/login, /auth/register, /auth/me
// - /profiles (CRUD)
// - Tokens via setTokens/clearTokens (axios con refresh automático)

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { setTokens, clearTokens } from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("nc_user");
    return raw ? JSON.parse(raw) : null;
  });

  const [profiles, setProfiles] = useState(() => {
    const raw = localStorage.getItem("nc_profiles");
    return raw ? JSON.parse(raw) : [];
  });

  const [currentProfile, setCurrentProfile] = useState(() => {
    const raw = localStorage.getItem("nc_current_profile");
    return raw ? JSON.parse(raw) : null;
  });

  const [loadingSession, setLoadingSession] = useState(true);

  // helpers persistencia
  function persistUser(u) {
    if (u) localStorage.setItem("nc_user", JSON.stringify(u));
    else localStorage.removeItem("nc_user");
  }
  function persistProfiles(list) {
    if (list?.length) localStorage.setItem("nc_profiles", JSON.stringify(list));
    else localStorage.removeItem("nc_profiles");
  }
  function persistCurrentProfile(p) {
    if (p) localStorage.setItem("nc_current_profile", JSON.stringify(p));
    else localStorage.removeItem("nc_current_profile");
  }

  // Hidratar sesión si hay tokens válidos
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
        persistUser(data);

        const res = await api.get("/profiles", { params: { page: 1, limit: 50 } });
        setProfiles(res.data.items || []);
        persistProfiles(res.data.items || []);

        if (currentProfile && !res.data.items?.some(p => p.id === currentProfile.id)) {
          setCurrentProfile(null);
          persistCurrentProfile(null);
        }
      } catch {
        clearTokens();
        setUser(null); persistUser(null);
        setProfiles([]); persistProfiles([]);
        setCurrentProfile(null); persistCurrentProfile(null);
      } finally {
        setLoadingSession(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Logout forzado desde axios
  useEffect(() => {
    const onForcedLogout = () => logout();
    window.addEventListener("auth:logout", onForcedLogout);
    return () => window.removeEventListener("auth:logout", onForcedLogout);
  }, []);

  // Auth
  const login = async ({ email, password }) => {
    if (!email || !password) throw new Error("Completá email y contraseña.");
    const { data } = await api.post("/auth/login", { email, password });
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user); persistUser(data.user);

    const res = await api.get("/profiles", { params: { page: 1, limit: 50 } });
    setProfiles(res.data.items || []); persistProfiles(res.data.items || []);

    setCurrentProfile(null); persistCurrentProfile(null);
    return true;
  };

const register = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new Error("Completá todos los campos.");
  }

  // Solo registrar, sin guardar tokens ni usuario
  await api.post("/auth/register", { name, email, password });

  // Limpiar cualquier sesión previa
  clearTokens();
  setUser(null); persistUser(null);
  setProfiles([]); persistProfiles([]);
  setCurrentProfile(null); persistCurrentProfile(null);

  // Retornar true para que el componente sepa que terminó bien
  return true;
};


  const logout = () => {
    clearTokens();
    setUser(null); persistUser(null);
    setProfiles([]); persistProfiles([]);
    setCurrentProfile(null); persistCurrentProfile(null);
    // opcional: api.post("/auth/logout");
  };

  // Perfiles
  const selectProfile = (profileId) => {
    const found = profiles.find((p) => p.id === profileId) || null;
    setCurrentProfile(found);
    persistCurrentProfile(found);
  };

  const addProfile = async (profile) => {
    const { data } = await api.post("/profiles", profile);
    setProfiles((prev) => {
      const next = [...prev, data];
      persistProfiles(next);
      return next;
    });
    return data;
  };
  const createProfile = addProfile;

  const updateProfile = async (id, patch) => {
    const { data } = await api.put(`/profiles/${id}`, patch);
    setProfiles((prev) => {
      const next = prev.map((p) => (p.id === id ? data : p));
      persistProfiles(next);
      return next;
    });
    if (currentProfile?.id === id) {
      setCurrentProfile(data);
      persistCurrentProfile(data);
    }
    return data;
  };

  const deleteProfile = async (id) => {
    await api.delete(`/profiles/${id}`);
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persistProfiles(next);
      return next;
    });
    if (currentProfile?.id === id) {
      setCurrentProfile(null);
      persistCurrentProfile(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      profiles,
      currentProfile,
      loadingSession,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      selectProfile,
      addProfile,
      createProfile,
      updateProfile,
      deleteProfile,
    }),
    [user, profiles, currentProfile, loadingSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
