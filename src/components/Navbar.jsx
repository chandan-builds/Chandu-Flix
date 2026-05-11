import React, { useState, useEffect } from 'react';
import { Search, Bell, User } from 'lucide-react';
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
        <h1 className="logo">CHANDU-FLIX</h1>
        <ul className="nav-links">
          <li>Home</li>
          <li>TV Shows</li>
          <li>Movies</li>
          <li>New & Popular</li>
          <li>My List</li>
        </ul>
      </div>
      <div className="navbar-right">
        <Search className="icon" />
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
