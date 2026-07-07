import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import './DownloadModal.css';

const DOWNLOAD_BASE = 'https://02moviedownloader.site/api/download';

/**
 * DownloadModal — opens the download verification page in a focused popup.
 * The user just needs to slide the slider once; Turnstile auto-solves
 * in the real browser and download links appear immediately.
 */
const DownloadModal = ({ mediaType, tmdbId, season, episode, title, onClose }) => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const popupRef = useRef(null);

  const getDownloadUrl = useCallback(() => {
    return mediaType === 'tv'
      ? `${DOWNLOAD_BASE}/tv/${tmdbId}/${season}/${episode}`
      : `${DOWNLOAD_BASE}/movie/${tmdbId}`;
  }, [mediaType, tmdbId, season, episode]);

  const openPopup = useCallback(() => {
    const url = getDownloadUrl();
    const w = 520, h = 650;
    const left = Math.max(0, (window.screen.width - w) / 2);
    const top = Math.max(0, (window.screen.height - h) / 2);
    const features = `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`;

    const popup = window.open(url, 'ChanduFlixDownload', features);

    if (!popup || popup.closed) {
      setPopupBlocked(true);
      return;
    }

    popupRef.current = popup;
    setPopupOpen(true);
    setPopupBlocked(false);

    // Monitor popup — close modal when popup closes
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        setPopupOpen(false);
        onClose();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [getDownloadUrl, onClose]);

  // Auto-open popup on mount
  useEffect(() => {
    openPopup();
  }, [openPopup]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Close popup when modal closes
  useEffect(() => {
    return () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleOpenDirect = () => {
    window.open(getDownloadUrl(), '_blank', 'noopener,noreferrer');
    onClose();
  };

  const focusPopup = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
    }
  };

  return (
    <div className="download-modal-overlay" onClick={handleBackdrop}>
      <div className="download-modal">
        <div className="download-modal-header">
          <h3><Download size={20} /> {title || 'Download'}</h3>
          <button className="download-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="download-modal-body">
          {popupBlocked ? (
            <div className="download-error">
              <p>⚠️ Popup was blocked by your browser</p>
              <p style={{ fontSize: '0.85rem', color: '#888', marginTop: 8 }}>
                Please allow popups for this site, or click below to open in a new tab.
              </p>
              <button className="download-retry-btn" onClick={openPopup}>
                Try Again
              </button>
              <button className="download-fallback-btn" onClick={handleOpenDirect}>
                <ExternalLink size={14} /> Open in New Tab
              </button>
            </div>
          ) : popupOpen ? (
            <div className="download-loading">
              <div className="download-loading-spinner" />
              <p>Download page opened in a popup window</p>
              <p style={{ fontSize: '0.85rem', color: '#999', marginTop: 8 }}>
                Slide the slider to verify, then your downloads will appear.
              </p>
              <button className="download-focus-btn" onClick={focusPopup}>
                Focus Popup Window
              </button>
            </div>
          ) : (
            <div className="download-loading">
              <p>Opening download page…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
