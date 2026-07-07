import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getContinueWatching } from '../watchHistory';
import { TMDB_IMAGE } from '../tmdb';
import './ContinueWatching.css';

const ContinueWatching = () => {
  const items = getContinueWatching();
  const rowRef = useRef(null);
  const navigate = useNavigate();

  if (items.length === 0) return null;

  const handleScroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleClick = (item) => {
    if (item.mediaType === 'tv') {
      navigate(`/tv/${item.id}?season=${item.season || 1}&episode=${item.episode || 1}`);
    } else {
      navigate(`/movie/${item.id}`);
    }
  };

  return (
    <div className="continue-watching-row">
      <h2>Continue Watching</h2>
      <div className="cw-wrapper">
        <div className="slider-arrow left" onClick={() => handleScroll('left')}>
          <ChevronLeft size={28} />
        </div>

        <div className="cw-posters" ref={rowRef}>
          {items.map((item, index) => {
            const imgSrc = TMDB_IMAGE.thumbnail(item.backdrop_path || item.poster_path);
            return (
              <div
                key={`${item.id}-${item.season}-${item.episode}-${index}`}
                className="cw-card"
                onClick={() => handleClick(item)}
              >
                {imgSrc && (
                  <img
                    src={imgSrc}
                    alt={item.title}
                    className="cw-poster"
                    loading="lazy"
                  />
                )}
                <div className="cw-progress-bar">
                  <div
                    className="cw-progress-fill"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
                <div className="cw-info">
                  <span className="cw-title">{item.title}</span>
                  {item.mediaType === 'tv' && item.season && (
                    <span className="cw-episode">S{item.season} E{item.episode}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="slider-arrow right" onClick={() => handleScroll('right')}>
          <ChevronRight size={28} />
        </div>
      </div>
    </div>
  );
};

export default ContinueWatching;
