import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize2, GripHorizontal, PictureInPicture2, ExternalLink } from 'lucide-react';
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
  const placeholderRef = useRef(null);
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

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 480,
        height: 270,
      });

      pipWindowRef.current = pipWindow;

      // Copy stylesheets
      [...document.styleSheets].forEach((sheet) => {
        try {
          if (sheet.href) {
            const link = pipWindow.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            pipWindow.document.head.appendChild(link);
          } else if (sheet.cssRules) {
            const style = pipWindow.document.createElement('style');
            [...sheet.cssRules].forEach((rule) => {
              style.appendChild(pipWindow.document.createTextNode(rule.cssText));
            });
            pipWindow.document.head.appendChild(style);
          }
        } catch {
          // Skip cross-origin stylesheets
        }
      });

      // PiP window styles
      const pipStyles = pipWindow.document.createElement('style');
      pipStyles.textContent = `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          width: 100%; height: 100%;
          overflow: hidden;
          background: #000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .pip-native-wrapper {
          width: 100%; height: 100%;
          position: relative;
          background: #000;
        }
        .pip-native-wrapper .peachify-player-wrapper,
        .pip-native-wrapper .vidking-player-wrapper {
          padding-bottom: 0 !important;
          height: 100% !important;
          width: 100% !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .pip-native-wrapper iframe {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        .pip-native-wrapper .player-loading-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: #000; z-index: 5;
        }
        .pip-native-wrapper .spinner {
          width: 40px; height: 40px;
          border: 4px solid rgba(229, 9, 20, 0.2);
          border-top-color: #e50914;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `;
      pipWindow.document.head.appendChild(pipStyles);

      // Placeholder in main page
      const placeholder = document.createElement('div');
      placeholder.className = 'pip-native-placeholder';
      placeholderRef.current = placeholder;
      playerContentRef.current.parentNode.insertBefore(placeholder, playerContentRef.current);

      // Move player DOM into PiP window
      const wrapper = pipWindow.document.createElement('div');
      wrapper.className = 'pip-native-wrapper';
      pipWindow.document.body.appendChild(wrapper);
      wrapper.appendChild(playerContentRef.current);

      setIsNativePiP(true);
      setIsPiP(false);

      pipWindow.addEventListener('pagehide', () => {
        if (placeholderRef.current && playerContentRef.current) {
          placeholderRef.current.parentNode.insertBefore(
            playerContentRef.current,
            placeholderRef.current
          );
          placeholderRef.current.remove();
          placeholderRef.current = null;
        }
        pipWindowRef.current = null;
        setIsNativePiP(false);
      });
    } catch (err) {
      console.warn('Document PiP failed:', err);
    }
  }, [supportsDocPiP]);

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

    const popupFeatures = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=no',
      'toolbar=no',
      'menubar=no',
      'location=no',
      'status=no',
    ].join(',');

    // Build a minimal HTML page with the player iframe
    const popupTitle = title || 'Chandu-Flix Player';
    const popupHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${popupTitle.replace(/</g, '&lt;')} — PiP</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%; height: 100%;
      overflow: hidden;
      background: #000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
      position: absolute;
      top: 0; left: 0;
    }
    .loading {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: #000; color: #aaa; gap: 12px;
      z-index: 5;
    }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid rgba(229, 9, 20, 0.2);
      border-top-color: #e50914;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .loading p { font-size: 0.85rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loading" id="loader">
    <div class="spinner"></div>
    <p>Loading player…</p>
  </div>
  <iframe
    src="${src.replace(/"/g, '&quot;')}"
    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
    allowfullscreen
    referrerpolicy="origin"
    onload="document.getElementById('loader').style.display='none'"
  ></iframe>
</body>
</html>`;

    // Close any existing popup
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      popupWindowRef.current.close();
    }

    // Open popup with about:blank, then write HTML to it
    const popup = window.open('about:blank', 'ChanduFlixPiP', popupFeatures);
    if (!popup) {
      alert('Popup blocked! Please allow popups for this site to use PiP.');
      return;
    }

    popup.document.open();
    popup.document.write(popupHTML);
    popup.document.close();

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
      // Clean up Document PiP
      if (pipWindowRef.current) {
        if (placeholderRef.current && playerContentRef.current) {
          placeholderRef.current.parentNode?.insertBefore(
            playerContentRef.current,
            placeholderRef.current
          );
          placeholderRef.current.remove();
        }
        pipWindowRef.current.close();
        pipWindowRef.current = null;
        placeholderRef.current = null;
      }
      // Clean up Popup PiP
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

      {/* Inline PiP buttons (below the player, always visible) */}
      {!showPiP && !isExternalPiP && (
        <div className="pip-inline-controls">
          {supportsDocPiP ? (
            <button
              className="pip-inline-btn"
              onClick={enterNativePiP}
              title="Always-on-top PiP window (stays across all apps)"
              aria-label="Enter picture-in-picture mode"
            >
              <PictureInPicture2 size={16} />
              <span>PiP</span>
            </button>
          ) : (
            <button
              className="pip-inline-btn"
              onClick={enterPopupPiP}
              title="Open in popup window (stays across tabs & apps)"
              aria-label="Open player in popup window"
            >
              <ExternalLink size={16} />
              <span>Pop Out</span>
            </button>
          )}

          {/* Always show popup option as a secondary choice on Chromium too */}
          {supportsDocPiP && (
            <button
              className="pip-inline-btn pip-inline-btn-secondary"
              onClick={enterPopupPiP}
              title="Open in popup window (works in all browsers)"
              aria-label="Open player in popup window"
            >
              <ExternalLink size={16} />
              <span>Pop Out</span>
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default PiPPlayer;
