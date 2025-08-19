// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const schema = yup.object({
  email: yup.string().email("Email inválido").required("Email requerido"),
  password: yup
    .string()
    .min(4, "Mínimo 4 caracteres")
    .required("Contraseña requerida"),
});

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);

  // Tema del ToastContainer (light/dark) según html.dark o prefers-color-scheme
  const [toastTheme, setToastTheme] = useState(() =>
    typeof document !== "undefined" &&
    (document.documentElement.classList.contains("dark") ||
      window.matchMedia?.("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light"
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const update = () => {
      const htmlDark = document.documentElement.classList.contains("dark");
      const prefersDark = mq?.matches;
      setToastTheme(htmlDark || prefersDark ? "dark" : "light");
    };
    mq?.addEventListener?.("change", update);
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      mq?.removeEventListener?.("change", update);
      obs.disconnect();
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (isAuthenticated) navigate("/perfiles", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setFocus("email");
    // Mensaje tipo Netflix
    toast.info(
      "Iniciá sesión para acceder a perfiles, Mi lista y tu cartelera.",
      { toastId: "login-info" }
    );
  }, [setFocus]);

  const onSubmit = async (values) => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        toast.error("Estás sin conexión. Verificá tu internet.");
        return;
      }
      await login(values);
      toast.success("Sesión iniciada correctamente");
      navigate("/perfiles", { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      const apiMsg = error?.response?.data?.message;

      if (error?.code === "ERR_NETWORK") {
        toast.error("No se pudo conectar con el servidor. Intentá más tarde.");
        return;
      }
      if (status === 401) {
        toast.error(apiMsg || "Credenciales inválidas.");
      } else if (status === 403) {
        toast.error(apiMsg || "No tenés permisos para acceder.");
      } else if (status === 429) {
        toast.warn("Demasiados intentos. Esperá e intentá nuevamente.");
      } else if (status >= 500) {
        toast.error("Error del servidor. Intentá más tarde.");
      } else {
        toast.error(apiMsg || "Error al iniciar sesión. Verificá tus datos.");
      }
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors">
      {/* Bloque explicativo tipo Netflix */}
      <section className="mb-6 w-full max-w-lg rounded-xl border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
        <h2 className="text-lg font-semibold mb-2">🎬 Continuá donde dejaste</h2>
        <p className="text-sm opacity-90">
          Iniciá sesión para:
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm opacity-90 space-y-1">
          <li>Elegir tu <strong>perfil</strong> y ver recomendaciones.</li>
          <li>Gestionar tu <strong>Mi lista</strong> y seguir tus películas.</li>
          <li>Acceder a la <strong>cartelera</strong> y administrar tu contenido.</li>
        </ul>
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder-neutral-500"
            type="email"
            placeholder="tu@email.com"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Contraseña</label>
          <div className="relative">
            <input
              className="w-full rounded border border-neutral-300 bg-white px-3 py-2 pr-16 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder-neutral-500"
              type={showPwd ? "text" : "password"}
              placeholder="••••••"
              {...register("password")}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
              aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPwd ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          disabled={isSubmitting}
          className="w-full rounded bg-red-600 px-4 py-2 font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/60 disabled:opacity-60"
        >
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>

        <p className="text-sm text-center opacity-80">
          ¿No tenés cuenta?{" "}
          <Link to="/register" className="underline">
            Crear cuenta
          </Link>
        </p>
      </form>

      {/* Si ya tenés un ToastContainer global, podés quitar este y usar la misma lógica de theme */}
      <ToastContainer position="bottom-right" theme={toastTheme} pauseOnHover newestOnTop />
    </div>
  );
}
