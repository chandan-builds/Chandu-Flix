import { useEffect, useState } from 'react';
import { saveProgress } from '../watchHistory';
import './PeachifyPlayer.css';

const PEACHIFY_BASE = 'https://peachify.top/embed';

const PeachifyPlayer = ({
  mediaType = 'movie',
  tmdbId,
  season = 1,
  episode = 1,
  color = 'e50914',
  autoPlay = true,
  nextEpisode = true,
  progress = 0,
  title = '',
  poster_path = '',
  backdrop_path = '',
}) => {
  const [loading, setLoading] = useState(true);

  // Build embed URL using Peachify parameters
  const path = mediaType === 'tv'
    ? `tv/${tmdbId}/${season}/${episode}`
    : `movie/${tmdbId}`;

  const params = new URLSearchParams({
    accent: color,
    autoPlay: String(autoPlay),
  });

  if (mediaType === 'tv') {
    params.set('autoNext', String(nextEpisode));
  }

  if (progress > 0) {
    params.set('startAt', String(Math.floor(progress)));
  }

  const src = `${PEACHIFY_BASE}/${path}?${params.toString()}`;

  // Listen for Peachify player events and sync progress
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'https://peachify.top') return;

      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (payload?.type === 'PLAYER_EVENT') {
          const d = payload.data;
          if (d && (d.tmdbId || d.id)) {
            const eventName = d.event;
            if (['timeupdate', 'pause', 'ended', 'seeked'].includes(eventName)) {
              saveProgress({
                id: d.tmdbId || d.id,
                mediaType: d.mediaType || mediaType,
                currentTime: d.currentTime || 0,
                duration: d.duration || 0,
                season: d.season || (mediaType === 'tv' ? season : null),
                episode: d.episode || (mediaType === 'tv' ? episode : null),
                title,
                poster_path,
                backdrop_path,
              });
            }
          }
        }
      } catch {
        // Ignore cross-origin JSON parsing issues
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tmdbId, mediaType, season, episode, title, poster_path, backdrop_path]);

  return (
    <div className="peachify-player-wrapper">
      {loading && (
        <div className="player-loading-overlay">
          <div className="spinner" />
        </div>
      )}
      <iframe
        key={src}
        src={src}
        title={`Playing: ${title || 'Video'}`}
        className="peachify-iframe"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        referrerPolicy="origin"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

export default PeachifyPlayer;
