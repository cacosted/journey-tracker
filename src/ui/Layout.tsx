import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { ThemeToggle } from "./ThemeToggle";

export function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (location.pathname.startsWith("/run/")) return <div className="app"><Outlet /></div>;
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="logo" aria-label="Journey Tracker, inicio"><span className="journey">JOURNEY</span><span className="tracker">TRACKER</span></Link>
        <span className="spacer" />
        <div className="topbar-actions"><ThemeToggle /></div>
      </header>
      <main className="page"><Outlet /></main>
      <footer className="footer">
        <p>Datos de <a href="https://pokeapi.co">PokéAPI</a> y <a href="https://github.com/domtronn/nuzlocke.data">nuzlocke.data</a>. Journey Tracker es un proyecto de fans sin afiliación con Nintendo, Creatures, GAME FREAK ni The Pokémon Company.</p>
      </footer>
    </div>
  );
}
