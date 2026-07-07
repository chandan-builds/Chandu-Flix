import { useState } from 'react';
import { Download } from 'lucide-react';
import DownloadModal from './DownloadModal';
import './DownloadButton.css';

/**
 * DownloadButton – opens a modal that auto-fetches download links.
 *
 * Props:
 *   mediaType  – 'movie' | 'tv'
 *   tmdbId     – TMDB numeric ID (string or number)
 *   season     – season number  (TV only)
 *   episode    – episode number (TV only)
 *   variant    – 'full' (default button) | 'icon' (small circle icon)
 *   label      – custom button text (variant="full" only)
 *   title      – content title for the modal header
 */
const DownloadButton = ({
  mediaType = 'movie',
  tmdbId,
  season,
  episode,
  variant = 'full',
  label,
  title,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation(); // prevent parent card clicks
    setShowModal(true);
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          className="episode-download-btn"
          onClick={handleClick}
          title="Download this episode"
          aria-label="Download episode"
        >
          <Download size={16} />
        </button>
      ) : (
        <button className="download-btn" onClick={handleClick}>
          <Download size={18} />
          <span>{label || 'Download'}</span>
        </button>
      )}

      {showModal && (
        <DownloadModal
          mediaType={mediaType}
          tmdbId={tmdbId}
          season={season}
          episode={episode}
          title={title}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default DownloadButton;
