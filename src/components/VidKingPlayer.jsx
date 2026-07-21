import { useEffect } from 'react';
import { createPlayerListener } from '../watchHistory';
import './VidKingPlayer.css';

const VIDKING_BASE = 'https://www.vidking.net/embed';

const VidKingPlayer = ({
  mediaType = 'movie',
  tmdbId,
  season = 1,
  episode = 1,
  color = 'e50914',
  autoPlay = true,
  nextEpisode = true,
  episodeSelector = true,
  progress = 0,
  title = '',
  poster_path = '',
  backdrop_path = '',
}) => {
  // Build embed URL
  const path = mediaType === 'tv'
    ? `tv/${tmdbId}/${season}/${episode}`
    : `movie/${tmdbId}`;

  const params = new URLSearchParams({ color, autoPlay: String(autoPlay) });
  if (mediaType === 'tv') {
    params.set('nextEpisode', String(nextEpisode));
    params.set('episodeSelector', String(episodeSelector));
  }
  if (progress > 0) {
    params.set('progress', String(Math.floor(progress)));
  }

  const src = `${VIDKING_BASE}/${path}?${params.toString()}`;

  useEffect(() => {
    const listener = createPlayerListener({ title, poster_path, backdrop_path });
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [title, poster_path, backdrop_path]);

  return (
    <div className="vidking-player-wrapper">
      <iframe
        key={src}
        src={src}
        title={`Playing: ${title || 'Video'}`}
        className="vidking-iframe"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="origin"
      />
    </div>
  );
};

export default VidKingPlayer;
