import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize2, GripHorizontal, PictureInPicture2 } from 'lucide-react';
import './PiPPlayer.css';

/**
 * PiPPlayer — Triple-mode Picture-in-Picture wrapper.
 *
 * Mode 1 (Document PiP): Uses the Document Picture-in-Picture API to pop the player
 *   into an OS-level always-on-top window. Stays visible across tabs & apps.
 *   Supported in Chromium 116+ (Chrome, Brave, Edge, Opera).
 *
 * Mode 2 (Popup Window): Opens the player iframe in a standalone popup window.
 *   Works in ALL browsers (Firefox, Safari, etc.). The window persists across
 *   tab switches and app switches since it's a separate OS-level window.
 *
 * Mode 3 (Scroll Float): In-page floating mini-player when user scrolls past.
 *   Draggable, with expand/close controls. Always available as fallback.
 */
const PiPPlayer = ({ children, isPlaying, iframeSrc, title }) => {
  // ── Scroll-based (fallback) PiP state ──
  const [isPiP, setIsPiP] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // ── Native Document PiP state ──
  const [isNativePiP, setIsNativePiP] = useState(false);
  // ── Popup window PiP state ──
  const [isPopupPiP, setIsPopupPiP] = useState(false);

  const supportsDocPiP = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  const sentinelRef = useRef(null);
  const pipRef = useRef(null);
  const playerContentRef = useRef(null);
  const pipWindowRef = useRef(null);
  const popupWindowRef = useRef(null);
  const popupCheckInterval = useRef(null);

  // ── Reset state when playback starts ──
  useEffect(() => {
    if (isPlaying) {
      setIsDismissed(false);
      setPosition({ x: null, y: null });
    }
  }, [isPlaying]);

  // ── IntersectionObserver: scroll-based PiP ──
  useEffect(() => {
    if (!isPlaying || isDismissed || isNativePiP || isPopupPiP) return;

    // Disable scroll-based floating PiP on mobile screens
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsPiP(false);
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPiP(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isPlaying, isDismissed, isNativePiP, isPopupPiP]);

  // ═══════════════════════════════════════
  //  Mode 1: Document PiP (Chromium 116+)
  // ═══════════════════════════════════════
  const enterNativePiP = useCallback(async () => {
    if (!supportsDocPiP || !playerContentRef.current) return;

    // Grab the iframe src from the currently rendered player
    let src = iframeSrc;
    if (!src) {
      const iframe = playerContentRef.current.querySelector('iframe');
      if (iframe) src = iframe.src;
    }
    if (!src) return;

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 480,
        height: 270,
      });

      pipWindowRef.current = pipWindow;

      // Minimal styles for the PiP window — just fullscreen iframe
      const pipStyles = pipWindow.document.createElement('style');
      pipStyles.textContent = `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          width: 100%; height: 100%;
          overflow: hidden;
          background: #000;
        }
        iframe {
          width: 100%; height: 100%;
          border: none;
          position: absolute;
          top: 0; left: 0;
        }
        .pip-loader {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: #000; z-index: 5;
        }
        .pip-spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(229, 9, 20, 0.2);
          border-top-color: #e50914;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `;
      pipWindow.document.head.appendChild(pipStyles);

      // Add a loading spinner
      const loader = pipWindow.document.createElement('div');
      loader.className = 'pip-loader';
      loader.innerHTML = '<div class="pip-spinner"></div>';
      pipWindow.document.body.appendChild(loader);

      // Create a fresh iframe in the PiP window (don't move DOM — that breaks cross-origin iframes)
      const pipIframe = pipWindow.document.createElement('iframe');
      pipIframe.src = src;
      pipIframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      pipIframe.allowFullscreen = true;
      pipIframe.referrerPolicy = 'origin';
      pipIframe.onload = () => { loader.style.display = 'none'; };
      pipWindow.document.body.appendChild(pipIframe);

      setIsNativePiP(true);
      setIsPiP(false);

      // When the PiP window closes, restore state
      pipWindow.addEventListener('pagehide', () => {
        pipWindowRef.current = null;
        setIsNativePiP(false);
      });
    } catch (err) {
      console.warn('Document PiP failed:', err);
    }
  }, [supportsDocPiP, iframeSrc]);

  const exitNativePiP = useCallback(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
    }
  }, []);

  // ═══════════════════════════════════════
  //  Mode 2: Popup Window (ALL browsers)
  // ═══════════════════════════════════════
  const enterPopupPiP = useCallback(() => {
    // Find the iframe src from the rendered player
    let src = iframeSrc;
    if (!src && playerContentRef.current) {
      const iframe = playerContentRef.current.querySelector('iframe');
      if (iframe) src = iframe.src;
    }
    if (!src) return;

    // Calculate position: bottom-right of the screen
    const width = 520;
    const height = 300;
    const left = window.screen.width - width - 30;
    const top = window.screen.height - height - 100;

    // Use 'popup=yes' to get a minimal chrome window (no tab bar, no bookmarks bar)
    const popupFeatures = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'popup=yes',
    ].join(',');

    // Build URL to pip.html with the player src as a query param
    const popupTitle = title || 'Chandu-Flix Player';
    const pipUrl = new URL('/pip.html', window.location.origin);
    pipUrl.searchParams.set('src', src);
    pipUrl.searchParams.set('title', popupTitle);

    // Close any existing popup
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.close();
    }

    // Open the pip.html page — shows clean URL, no about:blank
    const popup = window.open(pipUrl.href, 'ChanduFlixPiP', popupFeatures);
    if (!popup) {
      alert('Popup blocked! Please allow popups for this site to use PiP.');
      return;
    }

    popupWindowRef.current = popup;
    setIsPopupPiP(true);
    setIsPiP(false);

    // Poll to detect when popup is closed
    if (popupCheckInterval.current) clearInterval(popupCheckInterval.current);
    popupCheckInterval.current = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(popupCheckInterval.current);
        popupCheckInterval.current = null;
        popupWindowRef.current = null;
        setIsPopupPiP(false);
      }
    }, 500);
  }, [iframeSrc, title]);

  const exitPopupPiP = useCallback(() => {
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.close();
    }
    popupWindowRef.current = null;
    setIsPopupPiP(false);
    if (popupCheckInterval.current) {
      clearInterval(popupCheckInterval.current);
      popupCheckInterval.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
        pipWindowRef.current = null;
      }
      if (popupWindowRef.current && !popupWindowRef.current.closed) {
        popupWindowRef.current.close();
      }
      if (popupCheckInterval.current) {
        clearInterval(popupCheckInterval.current);
      }
    };
  }, []);

  // ── Scroll-based PiP: Close ──
  const handleClose = useCallback(() => {
    setIsPiP(false);
    setIsDismissed(true);
  }, []);

  // ── Scroll-based PiP: Expand ──
  const handleExpand = useCallback(() => {
    setIsPiP(false);
    setIsDismissed(false);
    sentinelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // ── Drag logic (mouse) ──
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.pip-btn')) return;
    e.preventDefault();
    const pip = pipRef.current;
    if (!pip) return;

    const rect = pip.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const pip = pipRef.current;
      if (!pip) return;

      const maxX = window.innerWidth - pip.offsetWidth;
      const maxY = window.innerHeight - pip.offsetHeight;
      setPosition({
        x: Math.max(0, Math.min(e.clientX - dragStart.x, maxX)),
        y: Math.max(0, Math.min(e.clientY - dragStart.y, maxY)),
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // ── Drag logic (touch) ──
  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('.pip-btn')) return;
    const pip = pipRef.current;
    if (!pip) return;

    const rect = pip.getBoundingClientRect();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const pip = pipRef.current;
      if (!pip) return;

      const touch = e.touches[0];
      const maxX = window.innerWidth - pip.offsetWidth;
      const maxY = window.innerHeight - pip.offsetHeight;
      setPosition({
        x: Math.max(0, Math.min(touch.clientX - dragStart.x, maxX)),
        y: Math.max(0, Math.min(touch.clientY - dragStart.y, maxY)),
      });
    },
    [isDragging, dragStart]
  );

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  // ── Global drag listeners ──
  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  if (!isPlaying) return null;

  const isExternalPiP = isNativePiP || isPopupPiP;
  const showPiP = isPiP && !isDismissed && !isExternalPiP;

  const pipStyle = {};
  if (showPiP && position.x !== null) {
    pipStyle.left = `${position.x}px`;
    pipStyle.top = `${position.y}px`;
    pipStyle.right = 'auto';
    pipStyle.bottom = 'auto';
  }

  return (
    <>
      {/* Sentinel: stays in flow to detect scroll position */}
      <div ref={sentinelRef} className="pip-sentinel" />

      {/* Layout placeholder: prevents collapse of page content when player floats */}
      {showPiP && (
        <div className="pip-placeholder" style={{ width: '100%', aspectRatio: '16/9' }} />
      )}

      {/* Player container: inline or floating */}
      <div
        ref={pipRef}
        className={`pip-container ${showPiP ? 'pip-floating' : 'pip-inline'} ${isDragging ? 'pip-dragging' : ''} ${isExternalPiP ? 'pip-native-active' : ''}`}
        style={pipStyle}
        onMouseDown={showPiP ? handleMouseDown : undefined}
        onTouchStart={showPiP ? handleTouchStart : undefined}
      >
        {/* Scroll-based PiP controls overlay */}
        {showPiP && (
          <div className="pip-controls">
            <div className="pip-drag-handle">
              <GripHorizontal size={16} />
            </div>
            <div className="pip-actions">
              {/* Pop-out: Document PiP or Popup fallback */}
              <button
                className="pip-btn pip-native-btn"
                onClick={supportsDocPiP ? enterNativePiP : enterPopupPiP}
                title="Pop out (stays on top across apps)"
                aria-label="Pop out player"
              >
                <PictureInPicture2 size={14} />
              </button>
              <button
                className="pip-btn pip-expand-btn"
                onClick={handleExpand}
                title="Back to player"
                aria-label="Expand player"
              >
                <Maximize2 size={14} />
              </button>
              <button
                className="pip-btn pip-close-btn"
                onClick={handleClose}
                title="Close mini player"
                aria-label="Close mini player"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Actual player content */}
        <div ref={playerContentRef} className="pip-player-content">
          {children}
        </div>

        {/* External PiP placeholder message */}
        {isExternalPiP && (
          <div className="pip-native-placeholder-msg">
            <PictureInPicture2 size={36} />
            <p>Playing in Picture-in-Picture</p>
            <span>
              {isNativePiP
                ? 'Floating on top of all apps'
                : 'Playing in a separate window — you can switch apps freely'}
            </span>
            <button
              className="pip-return-btn"
              onClick={isNativePiP ? exitNativePiP : exitPopupPiP}
            >
              Return to Page
            </button>
          </div>
        )}
      </div>

      {/* Inline PiP button (below the player) */}
      {!showPiP && !isExternalPiP && (
        <div className="pip-inline-controls">
          <button
            className="pip-inline-btn"
            onClick={supportsDocPiP ? enterNativePiP : enterPopupPiP}
            title={supportsDocPiP
              ? 'Borderless PiP — floats on top of all apps'
              : 'Open in popup window (stays across tabs & apps)'}
            aria-label="Enter picture-in-picture mode"
          >
            <PictureInPicture2 size={16} />
            <span>PiP</span>
          </button>
        </div>
      )}
    </>
  );
};

export default PiPPlayer;
