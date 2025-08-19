import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMovies } from "../context/MoviesContext.jsx";
import MovieForm from "../components/MovieForm.jsx";
import { toast } from "react-toastify";

// Regex para validar formatos
const RYMD = /^\d{4}-\d{2}-\d{2}$/;            // YYYY-MM-DD
const RHM  = /^([01]\d|2[0-3]):[0-5]\d$/;      // HH:mm

// Helpers para limpiar payload
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const s = (v) => (typeof v === "string" ? v.trim() : v);
function cleanPayload(p) {
  const yearNum =
    s(p.year) ? Number(String(p.year).replace(/\D/g, "").slice(0, 4)) : undefined;
  const ratingNum =
    s(p.rating) !== "" && p.rating != null ? clamp(Number(p.rating), 0, 10) : undefined;

  const body = {
    title: s(p.title),
    year: Number.isFinite(yearNum) ? yearNum : undefined,
    genre: s(p.genre),
    rating: Number.isFinite(ratingNum) ? ratingNum : undefined,
    posterUrl: s(p.posterUrl),
    overview: s(p.overview),
    director: s(p.director),
    showDate: s(p.showDate), // strings crudos (opcional)
    showTime: s(p.showTime), // strings crudos (opcional)
  };

  // quitar vacíos/undefined
  return Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
}

export default function MovieEdit() {
  const { id } = useParams();
  const { movies, updateMovie } = useMovies();
  const navigate = useNavigate();

  const current = movies.find((m) => m.id === id);
  const [form, setForm] = useState(current || null);

  // si entro directo por URL, espero a que cargue del contexto
  useEffect(() => {
    if (!form && current) setForm(current);
  }, [current, form]);

  if (!current) return <p>No existe la película.</p>;
  if (!form) return <p>Cargando...</p>;

  const onSubmit = async (values) => {
    // ── Validación de schedule ANTES de limpiar ─────────────────────────────
    const sd = (values.showDate || "").trim();
    const st = (values.showTime || "").trim();

    if (sd || st) {
      if (!sd || !st) {
        // incompleto → ignoro ambos para evitar estados a medias
        toast.info("Para mostrar en cartelera completá fecha y hora. Se guardará como PRÓXIMAMENTE.");
        values.showDate = "";
        values.showTime = "";
      } else {
        // ambos presentes → validar formato
        if (!RYMD.test(sd)) {
          toast.error("Fecha inválida. Usá el formato YYYY-MM-DD.");
          return;
        }
        if (!RHM.test(st)) {
          toast.error("Hora inválida. Usá el formato HH:mm.");
          return;
        }
      }
    }

    const payload = cleanPayload(values);

    try {
      await updateMovie(id, payload);
      toast.success(
        payload.showDate && payload.showTime
          ? "Película actualizada con fecha y hora"
          : "Película actualizada (PRÓXIMAMENTE)"
      );
      navigate(`/items/${id}`);
    } catch (e) {
      const msg = e?.response?.data?.message || "No se pudo actualizar la película";
      toast.error(msg);
    }
  };

  return <MovieForm initial={form} onSubmit={onSubmit} submitText="Guardar cambios" />;
}

