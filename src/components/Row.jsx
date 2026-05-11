import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Row.css';

const Row = ({ title, items, isLargeRow = false }) => {
  const rowRef = useRef(null);

  const handleScroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="row">
      <h2>{title}</h2>
      <div className="row-wrapper">
        <div className="slider-arrow left" onClick={() => handleScroll('left')}>
          <ChevronLeft size={40} />
        </div>
        
        <div className="row-posters" ref={rowRef}>
          {items.map((movie) => (
            <div key={movie.id} className={`row-poster-container ${isLargeRow ? 'large' : ''}`}>
              <img
                className={`row-poster ${isLargeRow ? 'row-posterLarge' : ''}`}
                src={movie.backdrop}
                alt={movie.title}
              />
              <div className="poster-info">
                <h3>{movie.title}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="slider-arrow right" onClick={() => handleScroll('right')}>
          <ChevronRight size={40} />
        </div>
      </div>
    </div>
  );
};

export default Row;
