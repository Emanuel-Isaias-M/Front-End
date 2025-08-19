// src/components/Footer.jsx
import { useCallback } from "react";
import { Instagram, Facebook, Youtube, Twitter, Film } from "lucide-react";

export default function Footer() {
  const stopNav = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <footer className="mt-10 border-t border-neutral-800/60 bg-neutral-950 text-neutral-300">
      {/* Tira superior tipo “marquesina” */}
      <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600" />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-600/90 shadow-lg shadow-red-700/20">
              <Film className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-wide text-white">
                Nodo Cine
              </p>
              <p className="text-xs text-neutral-400">
                Tu cartelera y exploración de películas
              </p>
            </div>
          </div>

          {/* Redes (sin navegación) */}
          <nav className="flex items-center gap-3">
            <a
              href="#"
              onClick={stopNav}
              title="Instagram"
              className="rounded-full border border-neutral-700/70 p-2 hover:border-red-600 hover:bg-red-600/10 transition"
            >
              <span className="sr-only">Instagram</span>
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="#"
              onClick={stopNav}
              title="Facebook"
              className="rounded-full border border-neutral-700/70 p-2 hover:border-red-600 hover:bg-red-600/10 transition"
            >
              <span className="sr-only">Facebook</span>
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="#"
              onClick={stopNav}
              title="YouTube"
              className="rounded-full border border-neutral-700/70 p-2 hover:border-red-600 hover:bg-red-600/10 transition"
            >
              <span className="sr-only">YouTube</span>
              <Youtube className="h-5 w-5" />
            </a>
            <a
              href="#"
              onClick={stopNav}
              title="X (Twitter)"
              className="rounded-full border border-neutral-700/70 p-2 hover:border-red-600 hover:bg-red-600/10 transition"
            >
              <span className="sr-only">X (Twitter)</span>
              <Twitter className="h-5 w-5" />
            </a>
          </nav>
        </div>

        {/* Copy */}
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-neutral-800/70 pt-4 text-xs text-neutral-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Nodo Cine — <span className="text-neutral-200">Creado por Isaias Morales</span>
          </p>
          <p className="opacity-80">
            Nodo Tecnologico
          </p>
        </div>
      </div>
    </footer>
  );
}
