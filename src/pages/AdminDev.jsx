// src/pages/AdminDev.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Pagination.jsx";

const ALL_ROLES = ["admin", "editor", "viewer"];

function RolePill({ role }) {
  const colors =
    role === "admin"
      ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
      : role === "editor"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
      : "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors}`}>
      {role}
    </span>
  );
}

function RolesEditor({ meId, user, onSaved }) {
  const [roles, setRoles] = useState(user.roles?.length ? user.roles : ["viewer"]);
  const [saving, setSaving] = useState(false);
  const isSelf = meId === user.id;

  // aseguro unicidad y orden estable para mostrar
  const ordered = useMemo(
    () => ALL_ROLES.filter((r) => roles.includes(r)),
    [roles]
  );

  const toggle = (role) => {
    setRoles((prev) => {
      const exists = prev.includes(role);
      let next = exists ? prev.filter((r) => r !== role) : [...prev, role];

      // nunca dejamos a alguien sin ningún rol
      if (next.length === 0) next = ["viewer"];

      // no permitir que te quites admin a vos mismo (seguro)
      if (isSelf && prev.includes("admin") && role === "admin") return prev;

      return next;
    });
  };

  const save = async () => {
    try {
      setSaving(true);

      // Aseguramos que 'viewer' siempre esté presente
      const payload = Array.from(new Set([...roles, "viewer"]));

      const { data } = await api.post(`/admin/users/${user.id}/roles`, {
        roles: payload,
      });
      toast.success("Roles actualizados");
      onSaved?.(user.id, data.roles);
    } catch (e) {
      const msg = e?.response?.data?.message || "Error al actualizar roles";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-3">
        {ALL_ROLES.map((r) => {
          const disabled =
            (r === "admin" && isSelf && roles.includes("admin")) // no podés sacarte admin a vos
              ? true
              : false;

          return (
            <label key={r} className="inline-flex items-center gap-2 select-none">
              <input
                type="checkbox"
                className="accent-blue-600"
                checked={roles.includes(r)}
                onChange={() => toggle(r)}
                disabled={disabled}
              />
              <span className="capitalize opacity-90">{r}</span>
            </label>
          );
        })}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>

      {/* Vista rápida de cómo queda */}
      <div className="ml-auto flex gap-1">
        {ordered.map((r) => (
          <RolePill key={r} role={r} />
        ))}
      </div>
    </div>
  );
}

export default function AdminDev() {
  const { user: me } = useAuth();
  const meId = me?.id;

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErr(null);
      const { data } = await api.get("/admin/users", {
        params: { q: q || undefined, page, limit },
      });
      setItems(data.items || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
      setItems([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const updateLocalRoles = (id, newRoles) => {
    setItems((prev) => prev.map((u) => (u.id === id ? { ...u, roles: newRoles } : u)));
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Panel Admin</h1>
          <p className="text-sm opacity-80">Gestión de usuarios y roles</p>
        </div>

        <form onSubmit={onSearch} className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="rounded border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
          />
          <button className="px-3 py-2 rounded border dark:border-neutral-700">Buscar</button>
        </form>
      </header>

      {err && (
        <div className="mb-4 rounded border border-red-300/60 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3 text-sm">
          {err}
        </div>
      )}

      <div className="rounded-xl border dark:border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th className="text-left p-3 border-b dark:border-neutral-800">Usuario</th>
              <th className="text-left p-3 border-b dark:border-neutral-800">Email</th>
              <th className="text-left p-3 border-b dark:border-neutral-800">Roles</th>
              <th className="text-right p-3 border-b dark:border-neutral-800">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center opacity-70">
                  Cargando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center opacity-70">
                  Sin resultados
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-900/60">
                  <td className="p-3 align-top">
                    <div className="font-medium">
                      {u.name} {u.id === meId && <span className="text-xs opacity-60">(vos)</span>}
                    </div>
                    <div className="mt-1 flex gap-1">
                      {(u.roles || ["viewer"]).map((r) => (
                        <RolePill key={r} role={r} />
                      ))}
                    </div>
                  </td>
                  <td className="p-3 align-top">
                    <span className="opacity-90">{u.email}</span>
                  </td>
                  <td className="p-3 align-top">
                    <RolesEditor meId={meId} user={u} onSaved={updateLocalRoles} />
                  </td>
                  <td className="p-3 align-top text-right">
                    {/* espacio para futuras acciones (ban, reset pwd, etc.) */}
                    <span className="opacity-40 text-xs">—</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={totalPages} onChange={setPage} />

      <div className="mt-2 text-xs opacity-70">{total} usuario(s) en total</div>
    </div>
  );
}
