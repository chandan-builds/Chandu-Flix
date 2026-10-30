import { NavLink, Link } from "react-router-dom";
import { Clapperboard, Search, MonitorPlay } from "lucide-react";
import "./Navbar.css";
export default function Navbar() {
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
        <NavLink to="/search" className="mobile-search">
          Search
        </NavLink>
      </div>
      <div className="nav-tools">
        <Link
          to="/search"
          className="nav-search"
          aria-label="Search movies and series"
        >
          <Search size={17} />
          <span>Find your next watch</span>
          <kbd>↵</kbd>
        </Link>
        <span className="cinema-label">
          <MonitorPlay size={17} /> Your cinema
        </span>
      </div>
    </nav>
  );
}
