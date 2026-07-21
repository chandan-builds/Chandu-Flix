import { useState } from 'react';

const VidsrcPlayer = ({ mediaType = 'movie', tmdbId, season, episode, title }) => {
  const [loading, setLoading] = useState(true);
  
  const src = mediaType === 'tv'
    ? `https://vidsrc.net/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
    : `https://vidsrc.net/embed/movie?tmdb=${tmdbId}`;

  return (
    <div className="peachify-player-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && (
        <div className="player-loading-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #333', borderTopColor: '#e50914', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      <iframe
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

export default VidsrcPlayer;
