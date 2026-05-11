import React from 'react';
import { Play, Info } from 'lucide-react';
import './Banner.css';

const Banner = ({ movie }) => {
  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  return (
    <header 
      className="banner"
      style={{
        backgroundSize: "cover",
        backgroundImage: `url("${movie.backdrop_path}")`,
        backgroundPosition: "center center",
      }}
    >
      <div className="banner-contents">
        <h1 className="banner-title">
          {movie.title || movie.name || movie.original_name}
        </h1>
        
        <h1 className="banner-description">
          {truncate(movie.overview, 150)}
        </h1>

        <div className="banner-buttons">
          <button className="banner-button play">
            <Play fill="currentColor" size={20} /> Play
          </button>
          <button className="banner-button info">
            <Info size={20} /> More Info
          </button>
        </div>
      </div>
      
      <div className="banner-fadeBottom" />
    </header>
  );
};

export default Banner;
