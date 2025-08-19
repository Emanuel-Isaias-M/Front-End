import { useNavigate } from "react-router-dom";
import { useMovies } from "../context/MoviesContext.jsx";
import MovieForm from "../components/MovieForm.jsx";
import { toast } from "react-toastify";

// Form inicial para creación
const initial = {
  title: "",
  year: "",
  genre: "",
  rating: "",
  posterUrl: "",
  overview: "",
  director: "",
  // cartelera opcional
  showDate: "",
  showTime: "",
};

/* Helpers */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const RYMD = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const RHM  = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:mm

function cleanPayload(p) {
  const s = (v) => (typeof v === "string" ? v.trim() : v);

  const yearNum =
    s(p.year) ? Number(String(p.year).replace(/\D/g, "").slice(0, 4)) : undefined;

  const ratingNum =
    s(p.rating) !== "" && p.rating != null
      ? clamp(Number(p.rating), 0, 10)
      : undefined;

  const body = {
    title: s(p.title),
    year: Number.isFinite(yearNum) ? yearNum : undefined,
    genre: s(p.genre),
    rating: Number.isFinite(ratingNum) ? ratingNum : undefined,
    posterUrl: s(p.posterUrl),
    overview: s(p.overview),
    director: s(p.director),
    // showDate/showTime los agregamos solo si vienen válidos (se decide en onSubmit)
    showDate: s(p.showDate),
    showTime: s(p.showTime),
  };

  // quitar vacíos/undefined
  return Object.fromEntries(
    Object.entries(body).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );
}

export default function MovieCreate() {
  const { createMovie } = useMovies();
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    // ── Validación de schedule ANTES de limpiar ─────────────────────────────
    const sd = (values.showDate || "").trim();
    const st = (values.showTime || "").trim();

    if (sd || st) {
      if (!sd || !st) {
        // incompleto → ignoro ambos para evitar estados a medias
        toast.info("Para programar en cartelera completá fecha y hora. Se guardará como PRÓXIMAMENTE.");
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

    // Validaciones mínimas
    if (!payload.title) {
      toast.error("El título es obligatorio");
      return;
    }
    if (payload.year && String(payload.year).length !== 4) {
      toast.error("Año inválido (usa YYYY)");
      return;
    }

    try {
      const createPromise = createMovie(payload);
      const created = await toast.promise(createPromise, {
        pending: "Creando película…",
        success:
          payload.showDate && payload.showTime
            ? "Película creada con fecha y hora"
            : "Película creada (PRÓXIMAMENTE)",
        error: {
          render({ data }) {
            const e = data;
            const status = e?.response?.status;
            if (status === 401) return "Necesitás iniciar sesión.";
            if (status === 403) return "No autorizado para crear.";
            return e?.response?.data?.message || "No se pudo crear la película";
          },
        },
      });

      // Redirección al detalle si el backend devuelve id
      const newId =
        created?.id ||
        created?._id ||
        created?.movie?.id ||
        created?.movie?._id ||
        null;

      navigate(newId ? `/items/${newId}` : "/items");
    } catch {
      // el mensaje ya lo maneja toast.promise.error
    }
  };

  return <MovieForm initial={initial} onSubmit={onSubmit} submitText="Crear" />;
}
