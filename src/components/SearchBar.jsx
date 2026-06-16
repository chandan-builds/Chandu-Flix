import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { searchMulti, TMDB_IMAGE } from '../tmdb';
import './SearchBar.css';

const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchMulti(value.trim());
        const filtered = (data.results || [])
          .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
          .slice(0, 8);
        setResults(filtered);
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 400);
  };

  const handleResultClick = (item) => {
    const path = item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;
    navigate(path);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
      setResults([]);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      setResults([]);
    }
  };

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      {!isOpen ? (
        <Search className="icon search-icon" onClick={() => setIsOpen(true)} />
      ) : (
        <div className="search-input-container">
          <Search size={16} className="search-input-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Titles, people, genres"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search-input"
          />
          <X
            size={16}
            className="search-close"
            onClick={() => {
              setIsOpen(false);
              setQuery('');
              setResults([]);
            }}
          />
        </div>
      )}

      {results.length > 0 && (
        <div className="search-dropdown">
          {results.map((item) => (
            <div
              key={item.id}
              className="search-result-item"
              onClick={() => handleResultClick(item)}
            >
              <img
                src={TMDB_IMAGE.thumbnail(item.poster_path)}
                alt=""
                className="search-result-poster"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="search-result-info">
                <span className="search-result-title">
                  {item.title || item.name}
                </span>
                <span className="search-result-meta">
                  {item.media_type === 'tv' ? 'TV Series' : 'Movie'}
                  {item.release_date && ` · ${item.release_date.split('-')[0]}`}
                  {item.first_air_date && ` · ${item.first_air_date.split('-')[0]}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
