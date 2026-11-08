import { useEffect, useRef } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { Clapperboard, Search } from "lucide-react";
import "./Navbar.css";
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchInput = useRef(null);
  const query = new URLSearchParams(location.search).get("q") || "";
  useEffect(() => {
    const shortcut = (event) => {
      const typing = event.target instanceof HTMLElement && (event.target.matches("input, textarea, select") || event.target.isContentEditable);
      if ((event.key === "/" && !typing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault(); searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const search = (event) => {
    event.preventDefault();
    const term = String(new FormData(event.currentTarget).get("q") || "").trim();
    if (term.length >= 2 && term.length <= 120) navigate(`/search?${new URLSearchParams({ q: term })}`);
  };
  return (
    <nav className="site-nav" aria-label="Main navigation">
      <Link to="/" className="brand" aria-label="ChanduFlix home">
        <span className="brand-mark">
          <Clapperboard size={22} />
        </span>
        CHANDU<span>FLIX</span>
      </Link>
      <div className="main-links">
        <NavLink to="/" end>
          Discover
        </NavLink>
        <NavLink to="/movies">Movies</NavLink>
        <NavLink to="/tv-shows">Series</NavLink>
        <NavLink to="/library">Library</NavLink>
      </div>
      <div className="nav-tools">
        <form className="nav-search" role="search" onSubmit={search}>
          <input key={location.pathname + location.search} ref={searchInput} name="q" type="search" aria-label="Search movies and series" placeholder="Search movies, series, anime…" defaultValue={query} minLength={2} maxLength={120} required />
          <button type="submit" aria-label="Search"><Search size={18} /></button>
        </form>
      </div>
    </nav>
  );
}
