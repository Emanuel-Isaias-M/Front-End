import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function ProfileCard({ profile, onSelect }) {
  return (
    <button
      onClick={() => onSelect(profile.id)}
      className="flex flex-col items-center gap-2 border rounded-xl p-4 hover:shadow dark:border-neutral-800 dark:bg-neutral-900"
      title={`Entrar con ${profile.name}`}
    >
      <div className="text-5xl">{profile.avatar}</div>
      <div className="font-semibold">{profile.name}</div>
      <div className="text-xs opacity-70">
        {profile.type === "kid" ? "Niño" : profile.type === "standard" ? "Estándar" : "Dueño"}
      </div>
    </button>
  );
}

export default function Profiles() {
  const { profiles, selectProfile } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (id) => {
    selectProfile(id);
    navigate("/items", { replace: true });
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">¿Quién está mirando?</h1>

        <button
          onClick={() => navigate("/crear-perfil")}
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
        >
          Crear nuevo perfil
        </button>
      </div>

      {!profiles || profiles.length === 0 ? (
        <div className="rounded-xl border p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="opacity-80 mb-4">No hay perfiles configurados todavía.</p>
          <button
            onClick={() => navigate("/crear-perfil")}
            className="px-4 py-2 rounded border hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Crear perfil ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </div>
  );
}



