import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import SearchBar from './SearchBar';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      {/* Left: Logo */}
      <div className="navbar-left">
        <Link to="/" className="logo-link">
          <span className="logo-icon">C</span>
          <h1 className="logo">Chandu-Flix</h1>
        </Link>
      </div>

      {/* Center: Search Pill (desktop only) */}
      <div className="navbar-center">
        <SearchBar triggerMode="pill" />
      </div>

      {/* Right: Search Icon (mobile) + Profile */}
      <div className="navbar-right">
        <div className="navbar-mobile-search">
          <SearchBar triggerMode="icon" />
        </div>
        <Link to="/search?type=movie" className="nav-text-link">Movies</Link>
        <Link to="/search?type=tv" className="nav-text-link">TV Shows</Link>
        <div className="profile">
          <User size={18} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
