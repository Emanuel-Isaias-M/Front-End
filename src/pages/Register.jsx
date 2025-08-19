// src/pages/Register.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";

const schema = yup.object({
  name: yup.string().trim().min(2, "Mínimo 2 caracteres").required("Nombre requerido"),
  email: yup.string().email("Email inválido").required("Email requerido"),
  password: yup.string().min(6, "Mínimo 6 caracteres").required("Contraseña requerida"),
});

export default function Register() {
  const { isAuthenticated, register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
    setError,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (isAuthenticated) navigate("/perfiles", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  const onSubmit = async (values) => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        toast.error("Estás sin conexión. Verificá tu internet.");
        return;
      }
      await registerAuth(values); // POST /auth/register
      toast.success("Cuenta creada con éxito. Iniciá sesión para continuar.");
      navigate("/login", { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      const apiMsg = error?.response?.data?.message;
      const fieldErrors = error?.response?.data?.errors;

      // Si el backend envía errores por campo, reflejarlos en el form
      if (fieldErrors && typeof fieldErrors === "object") {
        Object.entries(fieldErrors).forEach(([k, v]) =>
          setError(k, { type: "server", message: String(v) })
        );
      }

      if (error?.code === "ERR_NETWORK") {
        toast.error("No se pudo conectar con el servidor. Intentá más tarde.");
      } else if (status === 409) {
        toast.error(apiMsg || "El email ya está registrado.");
      } else if (status === 400) {
        toast.error(apiMsg || "Datos inválidos. Revisá el formulario.");
      } else if (status >= 500) {
        toast.error("Error del servidor. Intentá nuevamente más tarde.");
      } else {
        toast.error(apiMsg || "No se pudo crear la cuenta. Intentá nuevamente.");
      }
    }
  };

  const pwd = watch("password", "");
  const pwdMsg =
    !pwd ? "" : pwd.length < 6 ? "La contraseña es muy corta." : "Contraseña válida.";

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors">
      {/* Bloque explicativo (tipo Netflix) */}
      <section className="mb-6 w-full max-w-lg rounded-xl border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
        <h2 className="text-lg font-semibold mb-2">🎬 Creá tu cuenta</h2>
        <p className="text-sm opacity-90">Con tu cuenta vas a poder:</p>
        <ul className="mt-2 list-disc pl-5 text-sm opacity-90 space-y-1">
          <li>Elegir y gestionar tus <strong>perfiles</strong>.</li>
          <li>Armar y mantener <strong>Mi lista</strong> por perfil.</li>
          <li>Administrar tu <strong>cartelera</strong> en /items.</li>
        </ul>
      </section>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>

        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input
            className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder-neutral-500"
            placeholder="Tu nombre"
            {...register("name")}
            aria-invalid={!!errors.name}
            disabled={isSubmitting}
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500/60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder-neutral-500"
            type="email"
            placeholder="tu@email.com"
            {...register("email")}
            aria-invalid={!!errors.email}
            disabled={isSubmitting}
          />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
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
              disabled={isSubmitting}
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
          {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
          {!errors.password && pwd && (
            <p className={`text-xs mt-1 ${pwd.length < 6 ? "text-amber-600" : "text-green-600"}`}>
              {pwdMsg}
            </p>
          )}
        </div>

        <button
          disabled={isSubmitting}
          className="w-full rounded bg-red-600 px-4 py-2 font-medium text-white shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/60 disabled:opacity-60"
        >
          {isSubmitting ? "Creando..." : "Crear cuenta"}
        </button>

        <p className="text-sm text-center opacity-80">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="underline">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
