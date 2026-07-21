import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Play, Star, Loader, SlidersHorizontal } from 'lucide-react';
import { discoverMovies, discoverTV, TMDB_IMAGE, MOVIE_GENRES, TV_GENRES } from '../tmdb';
import './BrowsePage.css';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'primary_release_date.desc', label: 'Newest First' },
  { value: 'primary_release_date.asc', label: 'Oldest First' },
];

const BrowsePage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const isTV = location.pathname === '/tv-shows';
  const mediaType = isTV ? 'tv' : 'movie';

  const activeGenre = searchParams.get('genre') || '';
  const activeRegion = searchParams.get('region') || '';
  const activeSort = searchParams.get('sort') || 'popularity.desc';

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const genres = isTV ? TV_GENRES : MOVIE_GENRES;

  const fetchContent = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const fetchFn = isTV ? discoverTV : discoverMovies;
      const data = await fetchFn({
        genre: activeGenre,
        region: activeRegion,
        sortBy: activeSort,
        page: pageNum,
      });

      const results = data.results || [];
      setItems(prev => append ? [...prev, ...results] : results);
      setTotalPages(data.total_pages || 1);
      setPage(pageNum);
    } catch (err) {
      console.error('Browse fetch failed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isTV, activeGenre, activeRegion, activeSort]);

  useEffect(() => {
    fetchContent(1, false);
    window.scrollTo(0, 0);
  }, [fetchContent]);

  const handleGenreClick = (genreId) => {
    const newParams = new URLSearchParams(searchParams);
    if (genreId === activeGenre || genreId === '') {
      newParams.delete('genre');
    } else {
      newParams.set('genre', String(genreId));
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (sortValue) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sortValue);
    setSearchParams(newParams);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchContent(page + 1, true);
    }
  };

  const handleCardClick = (item) => {
    if (isTV) {
      navigate(`/tv/${item.id}`);
    } else {
      navigate(`/movie/${item.id}`);
    }
  };

  return (
    <div className="browse-page">
      <div className="browse-header">
        <h1 className="browse-title">
          <span className="browse-title-accent" />
          {isTV ? 'TV Shows' : 'Movies'}
        </h1>

        <div className="browse-sort">
          <SlidersHorizontal size={16} />
          <select
            value={activeSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="browse-sort-select"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Genre Filter Chips */}
      <div className="browse-genres">
        <button
          className={`browse-genre-chip ${!activeGenre ? 'active' : ''}`}
          onClick={() => handleGenreClick('')}
        >
          All
        </button>
        {genres.map((genre) => (
          <button
            key={genre.id}
            className={`browse-genre-chip ${String(genre.id) === activeGenre ? 'active' : ''}`}
            onClick={() => handleGenreClick(String(genre.id))}
          >
            {genre.name}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="browse-loading">
          <div className="loading-spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="browse-empty">
          <p>No {isTV ? 'TV shows' : 'movies'} found for this filter.</p>
        </div>
      ) : (
        <>
          <div className="browse-grid">
            {items.map((item) => {
              const title = item.title || item.name;
              const date = item.release_date || item.first_air_date || '';
              const year = date ? new Date(date).getFullYear() : '';
              const posterSrc = TMDB_IMAGE.poster(item.poster_path);

              if (!posterSrc) return null;

              return (
                <div
                  key={item.id}
                  className="browse-card"
                  onClick={() => handleCardClick(item)}
                >
                  <div className="browse-card-img-wrap">
                    <img
                      src={posterSrc}
                      alt={title}
                      className="browse-card-img"
                      loading="lazy"
                    />
                    <div className="browse-card-overlay">
                      <div className="browse-card-play">
                        <Play size={24} fill="white" />
                      </div>
                    </div>
                    {item.vote_average > 0 && (
                      <div className="browse-card-rating">
                        <Star size={10} fill="#FFD700" stroke="#FFD700" />
                        <span>{item.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="browse-card-info">
                    <span className="browse-card-title">{title}</span>
                    {year && <span className="browse-card-year">{year}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {page < totalPages && (
            <div className="browse-load-more">
              <button
                className="browse-load-more-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader size={16} className="spin-icon" /> Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </button>
              <span className="browse-page-info">
                Page {page} of {totalPages}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BrowsePage;
