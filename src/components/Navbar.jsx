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
      {/* Left: Logo + primary nav */}
      <div className="navbar-left">
        <Link to="/" className="logo-link">
          <h1 className="logo">CHANDUFLIX</h1>
        </Link>
        <div className="navbar-links">
          <Link to="/" className="nav-text-link">Home</Link>
          <Link to="/search?type=tv" className="nav-text-link">TV Shows</Link>
          <Link to="/search?type=movie" className="nav-text-link">Movies</Link>
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
