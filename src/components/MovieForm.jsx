import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link } from "react-router-dom";

const FALLBACK_POSTER = "/poster-fallback.svg";
const urlRegex = /^https?:\/\/[^\s]+$/i;

/* ============== Helpers seguros (sin Date para la fecha) ============== */
function toYMD(v) {
  if (!v) return "";
  if (typeof v === "string") {
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;            // ya está OK
    const m = s.match(/^(\d{2})[\/.-](\d{2})[\/.-](\d{4})$/); // DD/MM/YYYY
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
  }
  // Si por alguna razón llega un Date, formateo en UTC para no “retroceder”
  if (v instanceof Date && !isNaN(v)) {
    const y = v.getUTCFullYear();
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    const d = String(v.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
}

function toHHmm(v) {
  if (!v) return "";
  const s = String(v).trim();
  // acepta "HH:mm" o "HH:mm:ss" (corta a 5)
  if (/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(s)) return s.slice(0, 5);
  return "";
}

/* ======================= Validación ======================= */
const schema = yup.object({
  title: yup.string().trim().min(2, "Mínimo 2 caracteres").required("Requerido"),
  year: yup
    .number()
    .typeError("Debe ser un número")
    .integer("Debe ser entero")
    .min(1900, "Año ≥ 1900")
    .max(new Date().getFullYear() + 1, `Año ≤ ${new Date().getFullYear() + 1}`)
    .required("Requerido"),
  genre: yup.string().trim().required("Requerido"),
  rating: yup
    .number()
    .typeError("Debe ser un número")
    .min(0, "Mínimo 0")
    .max(10, "Máximo 10")
    .required("Requerido"),
  posterUrl: yup
    .string()
    .nullable()
    .transform((v) => (v?.trim() === "" ? null : v.trim()))
    .test("valid-url", "URL válida (http/https)", (val) => !val || urlRegex.test(val)),
  overview: yup.string().trim().max(600, "Máximo 600 caracteres").nullable(),
  director: yup
    .string()
    .nullable()
    .transform((v) => (v?.trim() === "" ? null : v.trim()))
    .test("min-2", "Mínimo 2 caracteres", (val) => !val || val.trim().length >= 2),

  // Campos opcionales para cartelera
  showDate: yup
    .string()
    .nullable()
    .transform((v) => (v?.trim() === "" ? null : v.trim()))
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)")
    .notRequired(),
  showTime: yup
    .string()
    .nullable()
    .transform((v) => (v?.trim() === "" ? null : v.trim()))
    .matches(/^\d{2}:\d{2}$/, "Hora inválida (HH:mm)")
    .notRequired(),
});

export default function MovieForm({ initial, onSubmit, submitText = "Guardar" }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setFocus,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      year: "",
      genre: "",
      rating: "",
      posterUrl: "",
      overview: "",
      director: "",
      showDate: "",
      showTime: "",
      ...initial,
    },
  });

  /* Reseteo inicial normalizando fecha/hora SIN usar Date */
  useEffect(() => {
    if (initial) {
      reset({
        title: initial.title ?? "",
        year: initial.year ?? "",
        genre: initial.genre ?? "",
        rating: initial.rating ?? "",
        posterUrl: initial.posterUrl ?? "",
        overview: initial.overview ?? "",
        director: initial.director ?? "",
        showDate: toYMD(initial.showDate),     // ✅ seguro
        showTime: toHHmm(initial.showTime),    // ✅ "HH:mm"
      });
    }
  }, [initial, reset]);

  /* Autofocus */
  useEffect(() => {
    setFocus("title");
  }, [setFocus]);

  /* Preview del póster */
  const posterUrl = watch("posterUrl");
  const previewSrc = useMemo(() => {
    const s = (posterUrl || "").trim();
    return s ? s : FALLBACK_POSTER;
  }, [posterUrl]);

  /* Hint si cargan solo fecha u hora */
  const showDate = watch("showDate");
  const showTime = watch("showTime");
  const showtimeHint =
    (showDate && !showTime) || (!showDate && showTime)
      ? "Para mostrar en cartelera completá fecha y hora (ambas)."
      : "";

  /* Submit: normalizo tipos y OMITO campos vacíos */
  const submit = async (values) => {
    const payload = {
      ...values,
      title: values.title.trim(),
      genre: values.genre.trim(),
      posterUrl: values.posterUrl?.trim() || "",
      overview: values.overview?.trim() || "",
      director: values.director?.trim() || "",
      year: Number(values.year),
      rating: Number(values.rating),
      showDate: values.showDate ? toYMD(values.showDate) : undefined, // "" → omitido
      showTime: values.showTime ? toHHmm(values.showTime) : undefined, // "" → omitido
    };

    // Si uno de los dos está vacío, omití ambos para evitar estados “a medias”
    if (!payload.showDate || !payload.showTime) {
      delete payload.showDate;
      delete payload.showTime;
    }

    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className="rounded-lg border bg-white dark:bg-neutral-900 dark:border-neutral-800 shadow-card max-w-5xl mx-auto"
    >
      {/* Grid principal: formulario + preview */}
      <div className="grid gap-6 p-4 md:p-6 md:grid-cols-2">
        {/* Columna izquierda: campos */}
        <div className="grid gap-4">
          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Título <span className="text-red-600">*</span>
            </label>
            <input
              id="title"
              className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-950 dark:border-neutral-700"
              placeholder="Ej: Inception"
              {...register("title")}
              aria-invalid={!!errors.title}
              aria-describedby="title-help"
              autoFocus
            />
            {errors.title && (
              <p id="title-help" className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Año y Género */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="year" className="block text-sm font-medium mb-1">
                Año <span className="text-red-600">*</span>
              </label>
              <input
                id="year"
                type="number"
                inputMode="numeric"
                min={1900}
                max={new Date().getFullYear() + 1}
                className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-950 dark:border-neutral-700"
                placeholder="2010"
                {...register("year")}
                aria-invalid={!!errors.year}
                aria-describedby="year-help"
              />
              {errors.year && (
                <p id="year-help" className="mt-1 text-sm text-red-600">
                  {errors.year.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="genre" className="block text-sm font-medium mb-1">
                Género <span className="text-red-600">*</span>
              </label>
              <input
                id="genre"
                className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-950 dark:border-neutral-700"
                placeholder="Sci-Fi"
                list="genres-sugeridos"
                {...register("genre")}
                aria-invalid={!!errors.genre}
                aria-describedby="genre-help"
              />
              <datalist id="genres-sugeridos">
                <option value="Acción" />
                <option value="Aventura" />
                <option value="Animación" />
                <option value="Comedia" />
                <option value="Drama" />
                <option value="Crimen" />
                <option value="Documental" />
                <option value="Fantasía" />
                <option value="Terror" />
                <option value="Romance" />
                <option value="Sci-Fi" />
                <option value="Thriller" />
              </datalist>
              {errors.genre && (
                <p id="genre-help" className="mt-1 text-sm text-red-600">
                  {errors.genre.message}
                </p>
              )}
            </div>
          </div>

          {/* Rating y Director */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rating" className="block text-sm font-medium mb-1">
                Rating (0–10) <span className="text-red-600">*</span>
              </label>
              <input
                id="rating"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="10"
                className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-950 dark:border-neutral-700"
                placeholder="8.5"
                {...register("rating")}
                aria-invalid={!!errors.rating}
                aria-describedby="rating-help"
              />
              {errors.rating && (
                <p id="rating-help" className="mt-1 text-sm text-red-600">
                  {errors.rating.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="director" className="block text-sm font-medium mb-1">
                Director (opcional)
              </label>
              <input
                id="director"
                className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-950 dark:border-neutral-700"
                placeholder="Christopher Nolan"
                {...register("director")}
                aria-invalid={!!errors.director}
                aria-describedby="director-help"
              />
              {errors.director && (
                <p id="director-help" className="mt-1 text-sm text-red-600">
                  {errors.director.message}
                </p>
              )}
            </div>
          </div>

          {/* Poster URL */}
          <div>
            <label htmlFor="posterUrl" className="block text-sm font-medium mb-1">
              Poster (URL)
            </label>
            <input
              id="posterUrl"
              className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-950 dark:border-neutral-700"
              placeholder="https://…"
              {...register("posterUrl")}
              aria-invalid={!!errors.posterUrl}
              aria-describedby="posterUrl-help"
            />
            {errors.posterUrl && (
              <p id="posterUrl-help" className="mt-1 text-sm text-red-600">
                {errors.posterUrl.message}
              </p>
            )}
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Consejo: usá imágenes 2:3 (p. ej. 600×900). Si falla, mostramos un
              placeholder.
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="overview" className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              id="overview"
              rows={4}
              maxLength={600}
              className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-950 dark:border-neutral-700"
              {...register("overview")}
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">
                {errors.overview ? (
                  <span className="text-red-600">{errors.overview.message}</span>
                ) : (
                  "Máx. 600 caracteres"
                )}
              </span>
              <span className="text-neutral-500 dark:text-neutral-400">
                {(watch("overview") || "").length}/600
              </span>
            </div>
          </div>

          {/* Programar en cartelera (opcional) */}
          <fieldset className="rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">Programar en cartelera (opcional)</legend>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="showDate">
                  Fecha (YYYY-MM-DD)
                </label>
                <input
                  id="showDate"
                  type="date"
                  {...register("showDate")}
                  className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-950 dark:border-neutral-700"
                  aria-invalid={!!errors.showDate}
                  aria-describedby="showDate-help"
                />
                {errors.showDate && (
                  <p id="showDate-help" className="mt-1 text-sm text-red-600">
                    {errors.showDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="showTime">
                  Hora (HH:mm)
                </label>
                <input
                  id="showTime"
                  type="time"
                  {...register("showTime")}
                  className="w-full rounded border px-3 py-2 bg-white dark:bg-neutral-950 dark:border-neutral-700"
                  aria-invalid={!!errors.showTime}
                  aria-describedby="showTime-help"
                />
                {errors.showTime && (
                  <p id="showTime-help" className="mt-1 text-sm text-red-600">
                    {errors.showTime.message}
                  </p>
                )}
              </div>
              <div className="flex items-end">
                {showtimeHint && <p className="text-xs text-amber-600">{showtimeHint}</p>}
              </div>
            </div>
            <p className="mt-2 text-xs opacity-70">
              Si completás <strong>fecha</strong> y <strong>hora</strong>, se guardará en la película y se mostrará
              en la cartelera. Si lo dejás vacío, aparecerá <strong>PRÓXIMAMENTE</strong>.
            </p>
          </fieldset>
        </div>

        {/* Columna derecha: preview del póster */}
        <aside className="md:pl-4">
          <div className="rounded-lg border bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-800 overflow-hidden">
            <div className="relative w-full pb-[150%]">
              <img
                src={previewSrc}
                alt={watch("title") || "Póster"}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_POSTER;
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                {watch("title") || "Título"}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {watch("year") || "Año"} • {watch("genre") || "Género"}
                {watch("rating") !== "" ? ` • ⭐ ${watch("rating")}` : ""}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Vista previa (2:3). Se actualiza con la URL del póster.
          </p>
        </aside>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3 px-4 pb-4 md:px-6 md:pb-6">
        <button className="btn-primary px-4 py-2 rounded disabled:opacity-60" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Guardando..." : submitText}
        </button>
        <Link to="/items" className="btn-secondary px-4 py-2 rounded">
          Cancelar
        </Link>
        {!isDirty && <span className="text-sm text-neutral-500">Sin cambios</span>}
      </div>
    </form>
  );
}
