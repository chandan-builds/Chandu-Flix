import { useState } from 'react';

const SuperEmbedPlayer = ({ mediaType = 'movie', tmdbId, season = 1, episode = 1, title }) => {
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams({ video_id: tmdbId, tmdb: '1' });
  if (mediaType === 'tv') {
    params.set('s', String(season));
    params.set('e', String(episode));
  }

  const src = `https://multiembed.mov/?${params.toString()}`;

  return (
    <div className="peachify-player-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && (
        <div className="player-loading-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #333', borderTopColor: '#e50914', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      <iframe
        key={src}
        src={src}
        title={`Playing: ${title || 'Video'}`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        referrerPolicy="origin"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

export default SuperEmbedPlayer;
