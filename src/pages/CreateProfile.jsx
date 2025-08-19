import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AVATARS = ["😀","🦊","🐼","🐸","🐯","👩‍🚀","🧙‍♂️","🦄","🎮","🍿","🐶","🐱","🐵","🦁","🐨","🐷"];

const schema = yup.object({
  name: yup.string().trim().min(2, "Mínimo 2 caracteres").required("Nombre requerido"),
  type: yup.mixed().oneOf(["owner", "standard", "kid"], "Tipo inválido").required(),
  avatar: yup.string().trim().min(1, "Elegí un avatar").required("Elegí un avatar"),
});

export default function CreateProfile() {
  const { isAuthenticated, createProfile, addProfile } = useAuth();
  const saveProfile = createProfile || addProfile; // usa lo que tengas en tu AuthContext
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "", type: "standard", avatar: "" },
    mode: "onBlur",
  });

  const selectedAvatar = watch("avatar");

  useEffect(() => { setFocus("name"); }, [setFocus]);

  const onSelectAvatar = (emoji) => setValue("avatar", emoji, { shouldValidate: true });

  const onSubmit = async (values) => {
    // payload mínimo; el backend generará _id y demás
    const payload = {
      name: values.name.trim(),
      type: values.type,        // "owner" | "standard" | "kid"
      avatar: values.avatar,    // emoji
    };

    if (!saveProfile) {
      // Si aún no implementaste el método en el AuthContext, no rompemos el flujo:
      console.warn("Falta createProfile/addProfile en AuthContext. Simulando alta.");
    } else {
      await saveProfile(payload);
    }
    navigate("/perfiles", { replace: true });
  };

  if (!isAuthenticated) {
    // Si no hay sesión, redirigimos a login
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Crear nuevo perfil</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-xl border p-5 dark:border-neutral-800 dark:bg-neutral-900">

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del perfil</label>
          <input
            className="w-full rounded border px-3 py-2 dark:bg-neutral-950 dark:border-neutral-700"
            placeholder="Ej: Isaias, Peques, Invitado…"
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de perfil</label>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2">
              <input type="radio" value="owner" {...register("type")} />
              <span>Dueño</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" value="standard" {...register("type")} />
              <span>Estándar</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" value="kid" {...register("type")} />
              <span>Niño</span>
            </label>
          </div>
          {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>}
          <p className="text-xs mt-1 opacity-80">
            El perfil <strong>Niño</strong> tendrá restricciones de contenido por edad.
          </p>
        </div>

        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium mb-2">Elegí un avatar</label>
          <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
            {AVATARS.map((emo) => (
              <button
                key={emo}
                type="button"
                onClick={() => onSelectAvatar(emo)}
                className={`aspect-square rounded-lg border flex items-center justify-center text-2xl
                  ${selectedAvatar === emo
                    ? "bg-brand-500 text-white border-brand-600"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:border-neutral-700"}`}
                title={emo}
                aria-pressed={selectedAvatar === emo}
              >
                {emo}
              </button>
            ))}
          </div>
          <input type="hidden" {...register("avatar")} />
          {errors.avatar && <p className="text-sm text-red-600 mt-2">{errors.avatar.message}</p>}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <button disabled={isSubmitting} className="btn-primary px-4 py-2 rounded disabled:opacity-60" type="submit">
            {isSubmitting ? "Creando..." : "Crear perfil"}
          </button>
          <Link to="/perfiles" className="btn-secondary px-4 py-2 rounded">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
