import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { TMDB_IMAGE } from '../tmdb';
import './Row.css';

const Row = ({ title, fetchUrl, isLargeRow = false }) => {
  const [movies, setMovies] = useState([]);
  const rowRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(fetchUrl);
        const data = await response.json();
        setMovies(data.results || []);
      } catch (err) {
        console.error(`Failed to fetch ${title}:`, err);
      }
    }
    fetchData();
  }, [fetchUrl, title]);

  const handleScroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleClick = (movie) => {
    // Determine if it's TV or movie
    const mediaType = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    if (mediaType === 'tv') {
      navigate(`/tv/${movie.id}`);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  if (movies.length === 0) return null;

  return (
    <div className="row">
      <h2>{title}</h2>
      <div className="row-wrapper">
        <div className="slider-arrow left" onClick={() => handleScroll('left')}>
          <ChevronLeft size={30} />
        </div>
        
        <div className="row-posters" ref={rowRef}>
          {movies.map((movie) => {
            const imageSrc = isLargeRow
              ? TMDB_IMAGE.poster(movie.poster_path)
              : TMDB_IMAGE.thumbnail(movie.backdrop_path || movie.poster_path);

            if (!imageSrc) return null;

            const displayTitle = movie.title || movie.name || movie.original_name;
            const dateStr = movie.release_date || movie.first_air_date;
            const year = dateStr ? new Date(dateStr).getFullYear() : '';

            return (
              <div
                key={movie.id}
                className={`row-poster-container ${isLargeRow ? 'large' : ''}`}
                onClick={() => handleClick(movie)}
              >
                <img
                  className={`row-poster ${isLargeRow ? 'row-posterLarge' : ''}`}
                  src={imageSrc}
                  alt={displayTitle}
                  loading="lazy"
                />
                <div className="poster-overlay">
                  <div className="overlay-play">
                    <Play fill="white" size={20} />
                  </div>
                  <div className="overlay-content">
                    <h3>{displayTitle}</h3>
                    <div className="overlay-meta">
                      {movie.vote_average > 0 && (
                        <span className="meta-rating">★ {movie.vote_average.toFixed(1)}</span>
                      )}
                      {year && <span className="meta-year">{year}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="slider-arrow right" onClick={() => handleScroll('right')}>
          <ChevronRight size={30} />
        </div>
      </div>
    </div>
  );
};

export default Row;
