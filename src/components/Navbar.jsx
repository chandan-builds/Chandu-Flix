import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import SearchBar from './SearchBar';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-left">
        <Link to="/" className="logo-link">
          <h1 className="logo">CHANDU-FLIX</h1>
        </Link>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/search?type=tv">TV Shows</Link></li>
          <li><Link to="/search?type=movie">Movies</Link></li>
          <li><Link to="/search">New & Popular</Link></li>
        </ul>
      </div>
      <div className="navbar-right">
        <SearchBar />
        <span>Kids</span>
        <Bell className="icon" />
        <div className="profile">
          <User className="icon" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
