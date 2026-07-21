import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import SearchBar from './SearchBar';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      {/* Left: Logo + primary nav */}
      <div className="navbar-left">
        <Link to="/" className="logo-link">
          <h1 className="logo">CHANDUFLIX</h1>
        </Link>
        <div className="navbar-links">
          <Link to="/" className={`nav-text-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          <Link to="/movies" className={`nav-text-link ${isActive('/movies') ? 'active' : ''}`}>Movies</Link>
          <Link to="/tv-shows" className={`nav-text-link ${isActive('/tv-shows') ? 'active' : ''}`}>TV Shows</Link>
          <Link to="/search" className={`nav-text-link ${isActive('/search') ? 'active' : ''}`}>Search</Link>
        </div>
      </div>

      {/* Right: Search + Profile */}
      <div className="navbar-right">
        <SearchBar triggerMode="icon" />
        <div className="profile">
          <User size={18} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
