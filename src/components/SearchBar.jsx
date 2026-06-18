import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, X, Star, ArrowRight } from 'lucide-react';
import { searchMulti, TMDB_IMAGE } from '../tmdb';
import './SearchBar.css';

const SearchBar = ({ triggerMode = 'icon' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Slight delay for animation
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(t);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Keyboard shortcut: Ctrl+K / ⌘+K to open
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
  }, []);

  const handleSearch = (value) => {
    setQuery(value);
    setSelectedIndex(-1);
    clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchMulti(value.trim());
        const filtered = (data.results || [])
          .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
          .slice(0, 6);
        setResults(filtered);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleResultClick = (item) => {
    const path = item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`;
    navigate(path);
    closeModal();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleResultClick(results[selectedIndex]);
      } else if (query.trim().length >= 2) {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        closeModal();
      }
    }
  };

  return (
    <>
      {/* Trigger — either pill button or icon */}
      {triggerMode === 'pill' ? (
        <button className="search-trigger-pill" onClick={() => setIsOpen(true)}>
          <Search size={15} />
          <span>Search movies or TV shows...</span>
          <kbd className="search-shortcut">⌘K</kbd>
        </button>
      ) : (
        <Search
          className="search-trigger-icon"
          size={20}
          onClick={() => setIsOpen(true)}
        />
      )}

      {/* Command Palette Modal — rendered via portal to document.body */}
      {isOpen && createPortal(
        <div
          className="search-overlay"
          onMouseDown={closeModal}
          onTouchStart={closeModal}
        >
          <div
            className="search-modal"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="search-modal-input-wrap">
              <Search size={18} className="search-modal-icon" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search movies or TV shows..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="search-modal-input"
                autoComplete="off"
              />
              <button
                className="search-modal-close"
                onClick={closeModal}
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>

            {/* Results */}
            {query.trim().length < 2 && !isSearching && results.length === 0 && (
              <div className="search-modal-empty">
                <p>Search for movies or TV shows...</p>
              </div>
            )}

            {isSearching && results.length === 0 && (
              <div className="search-modal-empty">
                <div className="search-spinner" />
                <p>Searching...</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="search-modal-results">
                <span className="search-results-label">Results</span>
                {results.map((item, index) => {
                  const title = item.title || item.name;
                  const date = item.release_date || item.first_air_date || '';
                  const rating = item.vote_average;

                  return (
                    <div
                      key={item.id}
                      className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleResultClick(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <img
                        src={TMDB_IMAGE.poster(item.poster_path)}
                        alt={title}
                        className="search-result-poster"
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="search-result-info">
                        <span className="search-result-title">{title}</span>
                        <span className="search-result-meta">
                          {rating > 0 && (
                            <>
                              <Star size={12} fill="#dc2626" stroke="#dc2626" />
                              <span>{rating.toFixed(1)}</span>
                            </>
                          )}
                          {date && <span>{date}</span>}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <button
                  className="search-view-all"
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                    closeModal();
                  }}
                >
                  View all results
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SearchBar;
