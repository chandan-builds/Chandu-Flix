import { useState } from 'react';

const VidLinkPlayer = ({ mediaType = 'movie', tmdbId, season = 1, episode = 1, title }) => {
  const [loading, setLoading] = useState(true);

  // Build the VidLink URL with customized color matching Chandu-Flix theme
  const src = mediaType === 'tv'
    ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=e50914&secondaryColor=111318`
    : `https://vidlink.pro/movie/${tmdbId}?primaryColor=e50914&secondaryColor=111318`;

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
        referrerPolicy="origin"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

export default VidLinkPlayer;
