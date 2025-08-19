// App.jsx
import { useEffect, useState } from "react";
import AppRouter from "./router/AppRouter.jsx";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import { WatchlistProvider } from "./context/WatchlistContext";
import { MoviesProvider } from "./context/MoviesContext";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer";

export default function App() {
  // Detecta dark/light desde <html class="dark"> o prefers-color-scheme
  const [toastTheme, setToastTheme] = useState(() => {
    if (typeof document === "undefined") return "light";
    const htmlDark = document.documentElement.classList.contains("dark");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return htmlDark || prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const update = () => {
      const htmlDark = document.documentElement.classList.contains("dark");
      const prefersDark = mq?.matches;
      setToastTheme(htmlDark || prefersDark ? "dark" : "light");
    };
    mq?.addEventListener?.("change", update);
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      mq?.removeEventListener?.("change", update);
      obs.disconnect();
    };
  }, []);

  return (
    <AuthProvider>
      <MoviesProvider>
        <WatchlistProvider>
          <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
            <Navbar />
            <main className="container py-6">
              <AppRouter />
            </main>
            <Footer />
            <ToastContainer
              theme={toastTheme}
              position="top-right"
              autoClose={1800}
              newestOnTop
              pauseOnHover
              closeOnClick
              draggable
              limit={3}
            />
          </div>
        </WatchlistProvider>
      </MoviesProvider>
    </AuthProvider>
  );
}
