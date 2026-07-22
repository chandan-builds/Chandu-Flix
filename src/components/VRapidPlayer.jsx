import { useState } from 'react';

const VRapidPlayer = ({ mediaType = 'movie', tmdbId, season = 1, episode = 1, title }) => {
  const [loading, setLoading] = useState(true);
  const [sourceIndex, setSourceIndex] = useState(0);

  const sources = mediaType === 'tv'
    ? [
        `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`,
        `https://vidsrc.vip/embed/tv/${tmdbId}/${season}/${episode}`,
        `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`
      ]
    : [
        `https://vidsrc.cc/v2/embed/movie/${tmdbId}`,
        `https://vidsrc.vip/embed/movie/${tmdbId}`,
        `https://vidsrc.xyz/embed/movie/${tmdbId}`
      ];

  const src = sources[sourceIndex] || sources[0];

  const handleNextSource = () => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((prev) => prev + 1);
    }
  };

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
        title={`vRapid 4K: ${title || 'Video'}`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerPolicy="origin"
        onLoad={() => setLoading(false)}
        onError={handleNextSource}
      />
    </div>
  );
};

export default VRapidPlayer;
