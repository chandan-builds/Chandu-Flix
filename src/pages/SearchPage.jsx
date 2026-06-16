import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchMulti, TMDB_IMAGE } from '../tmdb';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || 'all';

  const [results, setResults] = useState([]);
  const [inputValue, setInputValue] = useState(query);
  const [loading, setLoading] = useState(!!query);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!query) return;

    Promise.resolve().then(() => setLoading(true));
    searchMulti(query)
      .then((data) => {
        let items = (data.results || []).filter(
          (r) => r.media_type === 'movie' || r.media_type === 'tv'
        );
        if (typeFilter === 'movie') items = items.filter((r) => r.media_type === 'movie');
        if (typeFilter === 'tv') items = items.filter((r) => r.media_type === 'tv');
        setResults(items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query, typeFilter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const handleCardClick = (item) => {
    if (item.media_type === 'tv') {
      navigate(`/tv/${item.id}`);
    } else {
      navigate(`/movie/${item.id}`);
    }
  };

  return (
    <div className="search-page">
      {/* Search Header */}
      <div className="search-page-header">
        <form className="search-page-form" onSubmit={handleSubmit}>
          <Search size={20} className="search-page-icon" />
          <input
            type="text"
            placeholder="Search movies and TV shows..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="search-page-input"
            autoFocus
          />
        </form>

        {query && (
          <div className="search-tabs">
            <button
              className={`search-tab ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
            >
              All
            </button>
            <button
              className={`search-tab ${typeFilter === 'movie' ? 'active' : ''}`}
              onClick={() => navigate(`/search?q=${encodeURIComponent(query)}&type=movie`)}
            >
              Movies
            </button>
            <button
              className={`search-tab ${typeFilter === 'tv' ? 'active' : ''}`}
              onClick={() => navigate(`/search?q=${encodeURIComponent(query)}&type=tv`)}
            >
              TV Shows
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="search-loading"><div className="loading-spinner" /></div>
      ) : !query ? (
        <div className="search-empty">
          <h2>Browse Content</h2>
          <p>Search for your favorite movies and TV shows</p>
        </div>
      ) : results.length === 0 ? (
        <div className="search-empty">
          <h2>No results for "{query}"</h2>
          <p>Try different keywords</p>
        </div>
      ) : (
        <div className="search-results-grid">
          {results.map((item) => (
            <div
              key={item.id}
              className="search-result-card"
              onClick={() => handleCardClick(item)}
            >
              {(item.poster_path || item.backdrop_path) ? (
                <img
                  src={TMDB_IMAGE.poster(item.poster_path) || TMDB_IMAGE.thumbnail(item.backdrop_path)}
                  alt={item.title || item.name}
                  className="search-card-poster"
                  loading="lazy"
                />
              ) : (
                <div className="search-card-placeholder" />
              )}
              <div className="search-card-info">
                <span className="search-card-title">{item.title || item.name}</span>
                <div className="search-card-meta">
                  <span className="search-card-type">
                    {item.media_type === 'tv' ? 'TV Series' : 'Movie'}
                  </span>
                  {item.vote_average > 0 && (
                    <span className="search-card-rating">★ {item.vote_average.toFixed(1)}</span>
                  )}
                </div>
                {(item.release_date || item.first_air_date) && (
                  <span className="search-card-year">
                    {(item.release_date || item.first_air_date).split('-')[0]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
