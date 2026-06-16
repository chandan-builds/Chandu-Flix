import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, Star, Clock, Calendar } from 'lucide-react';
import { fetchMovieDetails, TMDB_IMAGE } from '../tmdb';
import { getProgress } from '../watchHistory';
import VidKingPlayer from '../components/VidKingPlayer';
import PeachifyPlayer from '../components/PeachifyPlayer';
import PlayerSelector from '../components/PlayerSelector';
import './MoviePage.css';

const MoviePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayer, setActivePlayer] = useState('peachify');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    fetchMovieDetails(id)
      .then((data) => {
        setMovie(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="movie-page">
        <div className="movie-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!movie || movie.success === false) {
    return (
      <div className="movie-page">
        <div className="movie-error">
          <h2>Movie not found</h2>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const savedProgress = getProgress('movie', id);
  const genres = movie.genres?.map((g) => g.name).join(', ');
  const year = movie.release_date?.split('-')[0];
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  const cast = movie.credits?.cast?.slice(0, 8) || [];
  const similar = movie.similar?.results?.slice(0, 12) || [];

  return (
    <div className="movie-page">
      {/* Back button */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={22} /> Back
      </button>

      {/* Player or Hero */}
      {isPlaying ? (
        <div className="player-section">
          {activePlayer === 'peachify' ? (
            <PeachifyPlayer
              mediaType="movie"
              tmdbId={id}
              progress={savedProgress}
              title={movie.title}
              poster_path={movie.poster_path}
              backdrop_path={movie.backdrop_path}
            />
          ) : (
            <VidKingPlayer
              mediaType="movie"
              tmdbId={id}
              progress={savedProgress}
              title={movie.title}
              poster_path={movie.poster_path}
              backdrop_path={movie.backdrop_path}
            />
          )}
          <PlayerSelector onPlayerChange={setActivePlayer} />
        </div>
      ) : (
        <div
          className="movie-hero"
          style={{
            backgroundImage: `url(${TMDB_IMAGE.backdrop(movie.backdrop_path)})`,
          }}
        >
          <div className="movie-hero-overlay">
            <div className="movie-hero-content">
              <h1 className="movie-title">{movie.title}</h1>

              <div className="movie-meta">
                {movie.vote_average > 0 && (
                  <span className="meta-badge rating">
                    <Star size={14} fill="currentColor" /> {movie.vote_average.toFixed(1)}
                  </span>
                )}
                {year && (
                  <span className="meta-badge">
                    <Calendar size={14} /> {year}
                  </span>
                )}
                {runtime && (
                  <span className="meta-badge">
                    <Clock size={14} /> {runtime}
                  </span>
                )}
              </div>

              {genres && <p className="movie-genres">{genres}</p>}

              <p className="movie-overview">{movie.overview}</p>

              <div className="movie-actions">
                <button className="play-btn" onClick={() => setIsPlaying(true)}>
                  <Play size={20} fill="currentColor" />
                  {savedProgress > 0 ? 'Resume' : 'Play'}
                </button>
              </div>
            </div>
          </div>
          <div className="movie-hero-fade" />
        </div>
      )}

      {/* Details section */}
      <div className="movie-details-section">
        {/* Cast */}
        {cast.length > 0 && (
          <div className="movie-cast">
            <h3>Cast</h3>
            <div className="cast-grid">
              {cast.map((person) => (
                <div key={person.id} className="cast-card">
                  {person.profile_path ? (
                    <img
                      src={TMDB_IMAGE.profile(person.profile_path)}
                      alt={person.name}
                      className="cast-photo"
                      loading="lazy"
                    />
                  ) : (
                    <div className="cast-photo-placeholder" />
                  )}
                  <span className="cast-name">{person.name}</span>
                  <span className="cast-character">{person.character}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Movies */}
        {similar.length > 0 && (
          <div className="similar-section">
            <h3>More Like This</h3>
            <div className="similar-grid">
              {similar.map((item) => (
                <div
                  key={item.id}
                  className="similar-card"
                  onClick={() => navigate(`/movie/${item.id}`)}
                >
                  <img
                    src={TMDB_IMAGE.thumbnail(item.backdrop_path || item.poster_path)}
                    alt={item.title}
                    className="similar-poster"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="similar-info">
                    <span className="similar-title">{item.title}</span>
                    {item.vote_average > 0 && (
                      <span className="similar-rating">★ {item.vote_average.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviePage;
