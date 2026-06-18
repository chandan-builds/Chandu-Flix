import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Info, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import requests, { TMDB_IMAGE } from '../tmdb';
import './Banner.css';

const Banner = () => {
  const [movies, setMovies] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  const fetchBanner = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(requests.fetchTrending);
      const data = await response.json();
      const results = data.results || [];
      setMovies(results.slice(0, 5));
      if (results.length === 0) setError(true);
    } catch (err) {
      console.error("Failed to fetch banner:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanner();
  }, []);

  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollOffset(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-slide effect that resets when manually navigated
  useEffect(() => {
    if (movies.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % movies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [movies, activeIndex]);

  if (loading) {
    return (
      <header className="banner banner-loading">
        <div className="banner-loading-content">
          <div className="banner-skeleton-title" />
          <div className="banner-skeleton-meta" />
          <div className="banner-skeleton-desc" />
          <div className="banner-skeleton-desc short" />
          <div className="banner-skeleton-buttons">
            <div className="banner-skeleton-btn" />
            <div className="banner-skeleton-btn" />
          </div>
        </div>
      </header>
    );
  }

  if (error || movies.length === 0) {
    return (
      <header className="banner banner-error">
        <div className="banner-error-content">
          <h2>Unable to load content</h2>
          <p>Please check your internet connection and try again.</p>
          <button className="banner-retry-btn" onClick={fetchBanner}>
            <RefreshCw size={18} /> Retry
          </button>
        </div>
      </header>
    );
  }

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % movies.length);
  };

  return (
    <header className="banner">
      {movies.map((movie, index) => {
        const isActive = index === activeIndex;
        const handleNavigation = () => {
          const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
          navigate(`/${mediaType}/${movie.id}`);
        };

        return (
          <div 
            key={movie.id} 
            className={`banner-slide ${isActive ? 'active' : ''}`}
          >
            <div 
              className="banner-background"
              style={{
                backgroundImage: `url("${TMDB_IMAGE.backdrop(movie.backdrop_path)}")`,
                transform: `translateY(${scrollOffset * 0.35}px) scale(${1 + scrollOffset * 0.0004})`,
                opacity: Math.max(0, 1 - scrollOffset * 0.0018)
              }}
            />
            <div 
              className="banner-contents"
              style={{
                transform: `translateY(${scrollOffset * 0.15}px)`,
                opacity: Math.max(0, 1 - scrollOffset * 0.0025)
              }}
            >
              <h1 className="banner-title">
                {movie.title || movie.name || movie.original_name}
              </h1>
              
              <div className="banner-meta">
                {movie.vote_average > 0 && (
                  <span className="banner-rating">★ {movie.vote_average.toFixed(1)}</span>
                )}
                {movie.release_date && (
                  <span className="banner-year">{movie.release_date.split('-')[0]}</span>
                )}
                {movie.first_air_date && !movie.release_date && (
                  <span className="banner-year">{movie.first_air_date.split('-')[0]}</span>
                )}
                {movie.media_type && (
                  <span className="banner-type">{movie.media_type === 'tv' ? 'TV Series' : 'Movie'}</span>
                )}
              </div>

              <p className="banner-description">
                {truncate(movie.overview, 200)}
              </p>

              <div className="banner-buttons">
                <button className="banner-button play" onClick={handleNavigation}>
                  <Play fill="currentColor" size={20} /> Play
                </button>
                <button className="banner-button info" onClick={handleNavigation}>
                  <Info size={20} /> More Info
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Slide Navigation Controls */}
      <button className="banner-arrow left" onClick={handlePrev} aria-label="Previous Slide">
        <ChevronLeft size={32} />
      </button>
      <button className="banner-arrow right" onClick={handleNext} aria-label="Next Slide">
        <ChevronRight size={32} />
      </button>

      {/* Slide Indicators */}
      <div className="banner-dots">
        {movies.map((_, index) => (
          <div
            key={index}
            className={`banner-dot ${index === activeIndex ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex(index);
            }}
          />
        ))}
      </div>
      
      <div className="banner-fadeBottom" />
    </header>
  );
};

export default Banner;
