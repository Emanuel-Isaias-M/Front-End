// src/pages/DiscoverDetail.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMovieDetail, getWatchProviders } from "../services/tmdb.service";
import { imgUrl } from "../api/tmdb";

export default function DiscoverDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const d = await getMovieDetail(id);
        const p = await getWatchProviders(id);
        if (!alive) return;
        setDetail(d);
        setProviders(p);
      } catch {
        if (!alive) return;
        setErr("No se pudo cargar el detalle.");
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <p>Cargando…</p>;
  if (err) return <p className="text-red-600">{err}</p>;
  if (!detail) return null;

  const { raw, card } = detail;
  const poster = imgUrl(raw.poster_path, "w500") || imgUrl(raw.backdrop_path, "w780");

  const flatrate = providers?.flatrate || [];
  const rent = providers?.rent || [];
  const buy = providers?.buy || [];

  return (
    <article className="grid gap-6 lg:grid-cols-3">
      {/* Poster */}
      <div className="lg:col-span-1 rounded overflow-hidden border dark:border-neutral-800">
        {poster ? (
          <img src={poster} alt={card.title} className="w-full object-cover" />
        ) : (
          <div className="aspect-[2/3] bg-neutral-200 dark:bg-neutral-800" />
        )}
      </div>

      {/* Info */}
      <div className="lg:col-span-2 space-y-3">
        <h1 className="text-3xl font-bold">{card.title}</h1>
        <p className="text-sm opacity-80">
          {card.year} • ⭐ {card.rating} {raw.runtime ? `• ${raw.runtime} min` : ""}
        </p>
        {raw.genres?.length > 0 && (
          <p className="text-sm opacity-80">{raw.genres.map(g => g.name).join(" · ")}</p>
        )}
        <p className="mt-2">{card.overview || "Sin descripción."}</p>

        {/* Providers AR */}
        <section className="mt-4 space-y-2">
          <h2 className="font-semibold">Dónde ver (AR)</h2>
          {!providers ? (
            <p className="opacity-70">No hay información de proveedores.</p>
          ) : (
            <div className="space-y-3">
              <ProviderRow title="Suscripción" items={flatrate} />
              <ProviderRow title="Alquiler" items={rent} />
              <ProviderRow title="Compra" items={buy} />
              {flatrate.length + rent.length + buy.length === 0 && (
                <p className="opacity-70">No disponible en proveedores locales.</p>
              )}
            </div>
          )}
        </section>

        <div className="pt-2">
          <Link to="/discover" className="underline">← Volver</Link>
        </div>
      </div>
    </article>
  );
}

function ProviderRow({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="flex gap-2 flex-wrap">
        {items.map((p) => (
          <div
            key={p.provider_id}
            className="flex items-center gap-2 rounded border px-2 py-1 dark:border-neutral-800"
            title={p.provider_name}
          >
            {p.logo_path && (
              <img
                src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                alt={p.provider_name}
                className="h-6 w-6 object-contain rounded"
              />
            )}
            <span className="text-sm">{p.provider_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
