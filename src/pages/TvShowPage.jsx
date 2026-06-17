import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Play } from 'lucide-react';
import { fetchTvDetails, fetchTvSeason, TMDB_IMAGE } from '../tmdb';
import { getProgress } from '../watchHistory';
import VidKingPlayer from '../components/VidKingPlayer';
import PeachifyPlayer from '../components/PeachifyPlayer';
import VidsrcPlayer from '../components/VidsrcPlayer';
import PlayerSelector from '../components/PlayerSelector';
import './TvShowPage.css';

const TvShowPage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayer, setActivePlayer] = useState('peachify');

  const selectedSeason = parseInt(searchParams.get('season')) || 1;
  const selectedEpisode = parseInt(searchParams.get('episode')) || 1;

  // Fetch show details
  useEffect(() => {
    window.scrollTo(0, 0);

    fetchTvDetails(id)
      .then((data) => {
        setShow(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Fetch season data when season changes
  useEffect(() => {
    if (!show) return;
    fetchTvSeason(id, selectedSeason)
      .then((data) => setSeasonData(data))
      .catch(() => setSeasonData(null));
  }, [id, selectedSeason, show]);

  // Available seasons (filter out specials with season_number 0)
  const seasons = useMemo(() => {
    if (!show?.seasons) return [];
    return show.seasons.filter((s) => s.season_number > 0);
  }, [show]);

  const episodes = seasonData?.episodes || [];
  const currentEpisode = episodes.find((ep) => ep.episode_number === selectedEpisode) || episodes[0];
  const savedProgress = getProgress('tv', id, selectedSeason, selectedEpisode);

  const handleSeasonChange = (seasonNum) => {
    setSearchParams({ season: seasonNum, episode: 1 });
    setIsPlaying(false);
  };

  const handleEpisodeClick = (episodeNum) => {
    setSearchParams({ season: selectedSeason, episode: episodeNum });
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlay = () => {
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="tv-page">
        <div className="tv-loading"><div className="loading-spinner" /></div>
      </div>
    );
  }

  if (!show || show.success === false) {
    return (
      <div className="tv-page">
        <div className="tv-error">
          <h2>Show not found</h2>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  const year = show.first_air_date?.split('-')[0];
  const genres = show.genres?.map((g) => g.name).join(', ');
  const similar = show.similar?.results?.slice(0, 12) || [];

  return (
    <div className="tv-page">
      {/* Back button */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <ArrowLeft size={22} /> Back
      </button>

      {/* Player or Hero */}
      {isPlaying ? (
        <div className="player-section">
          {activePlayer === 'peachify' ? (
            <PeachifyPlayer
              mediaType="tv"
              tmdbId={id}
              season={selectedSeason}
              episode={selectedEpisode}
              progress={savedProgress}
              title={`${show.name} - S${selectedSeason}E${selectedEpisode}`}
              poster_path={show.poster_path}
              backdrop_path={currentEpisode?.still_path || show.backdrop_path}
            />
          ) : activePlayer === 'vidking' ? (
            <VidKingPlayer
              mediaType="tv"
              tmdbId={id}
              season={selectedSeason}
              episode={selectedEpisode}
              progress={savedProgress}
              title={`${show.name} - S${selectedSeason}E${selectedEpisode}`}
              poster_path={show.poster_path}
              backdrop_path={currentEpisode?.still_path || show.backdrop_path}
            />
          ) : (
            <VidsrcPlayer
              mediaType="tv"
              tmdbId={id}
              season={selectedSeason}
              episode={selectedEpisode}
              title={`${show.name} - S${selectedSeason}E${selectedEpisode}`}
            />
          )}
          <div className="now-playing-info">
            <h3>
              S{selectedSeason} E{selectedEpisode}
              {currentEpisode?.name && ` — ${currentEpisode.name}`}
            </h3>
          </div>
          <PlayerSelector onPlayerChange={setActivePlayer} />
        </div>
      ) : (
        <div
          className="tv-hero"
          style={{
            backgroundImage: `url(${TMDB_IMAGE.backdrop(show.backdrop_path)})`,
          }}
        >
          <div className="tv-hero-overlay">
            <div className="tv-hero-content">
              <h1 className="tv-title">{show.name}</h1>

              <div className="tv-meta">
                {show.vote_average > 0 && (
                  <span className="meta-badge rating">
                    <Star size={14} fill="currentColor" /> {show.vote_average.toFixed(1)}
                  </span>
                )}
                {year && (
                  <span className="meta-badge"><Calendar size={14} /> {year}</span>
                )}
                {show.number_of_seasons && (
                  <span className="meta-badge">
                    {show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {genres && <p className="tv-genres">{genres}</p>}
              <p className="tv-overview">{show.overview}</p>

              <button className="play-btn" onClick={handlePlay}>
                <Play size={20} fill="currentColor" />
                {savedProgress > 0 ? 'Resume' : 'Play S1 E1'}
              </button>
            </div>
          </div>
          <div className="tv-hero-fade" />
        </div>
      )}

      {/* Season / Episode Section */}
      <div className="tv-content-section">
        {/* Season Selector */}
        <div className="season-selector">
          <h2>Episodes</h2>
          <select
            value={selectedSeason}
            onChange={(e) => handleSeasonChange(Number(e.target.value))}
            className="season-dropdown"
          >
            {seasons.map((s) => (
              <option key={s.season_number} value={s.season_number}>
                Season {s.season_number}
              </option>
            ))}
          </select>
        </div>

        {/* Episode Grid */}
        <div className="episode-grid">
          {episodes.map((ep) => {
            const isActive = ep.episode_number === selectedEpisode && isPlaying;
            return (
              <div
                key={ep.id}
                className={`episode-card ${isActive ? 'active' : ''}`}
                onClick={() => handleEpisodeClick(ep.episode_number)}
              >
                <div className="episode-thumb-wrapper">
                  {ep.still_path ? (
                    <img
                      src={TMDB_IMAGE.thumbnail(ep.still_path)}
                      alt={ep.name}
                      className="episode-thumb"
                      loading="lazy"
                    />
                  ) : (
                    <div className="episode-thumb-placeholder" />
                  )}
                  <div className="episode-play-overlay">
                    <Play size={28} fill="white" />
                  </div>
                  {ep.runtime && (
                    <span className="episode-duration">{ep.runtime}m</span>
                  )}
                </div>
                <div className="episode-info">
                  <span className="episode-number">E{ep.episode_number}</span>
                  <span className="episode-name">{ep.name}</span>
                  {ep.overview && (
                    <p className="episode-desc">{ep.overview}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Similar Shows */}
        {similar.length > 0 && (
          <div className="similar-section">
            <h3>More Like This</h3>
            <div className="similar-grid">
              {similar.map((item) => (
                <div
                  key={item.id}
                  className="similar-card"
                  onClick={() => navigate(`/tv/${item.id}`)}
                >
                  <img
                    src={TMDB_IMAGE.thumbnail(item.backdrop_path || item.poster_path)}
                    alt={item.name}
                    className="similar-poster"
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="similar-info">
                    <span className="similar-title">{item.name}</span>
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

export default TvShowPage;
