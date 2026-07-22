import { useState, useRef, useEffect, useCallback } from 'react';
import { Minimize2, Tv, RefreshCw } from 'lucide-react';
import './PlayerWrapper.css';

const PlayerWrapper = ({ children, title = '', isPipActive, setIsPipActive }) => {
  const [isInAppPip, setIsInAppPip] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const pipWindowRef = useRef(null);

  const exitPip = useCallback(() => {
    if (pipWindowRef.current) {
      try {
        pipWindowRef.current.close();
      } catch (err) {
        if (containerRef.current && contentRef.current) {
          containerRef.current.appendChild(contentRef.current);
        }
      }
      pipWindowRef.current = null;
    }
    setIsPipActive(false);
    setIsInAppPip(false);
  }, [setIsPipActive]);

  const enterPip = useCallback(async () => {
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 854,
          height: 480,
        });

        pipWindowRef.current = pipWindow;

        // Copy document stylesheets into PiP window
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = styleSheet.type;
            link.media = styleSheet.media;
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        });

        pipWindow.document.title = title ? `${title} - Chandu-Flix` : 'Chandu-Flix Player';
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.backgroundColor = '#0b0d12';
        pipWindow.document.body.style.overflow = 'hidden';

        // Move player content into PiP window
        if (contentRef.current) {
          pipWindow.document.body.appendChild(contentRef.current);
        }

        setIsPipActive(true);
        setIsInAppPip(false);

        // Restore content on pagehide
        pipWindow.addEventListener('pagehide', () => {
          if (containerRef.current && contentRef.current) {
            containerRef.current.appendChild(contentRef.current);
          }
          setIsPipActive(false);
          pipWindowRef.current = null;
        });

        return;
      } catch (err) {
        console.warn('Document Picture-in-Picture failed, using in-app floating mode:', err);
      }
    }

    // In-app fallback
    setIsPipActive(true);
    setIsInAppPip(true);
  }, [title, setIsPipActive]);

  // Handle external triggers or sync if isPipActive changes externally
  useEffect(() => {
    if (isPipActive && !pipWindowRef.current && !isInAppPip) {
      enterPip();
    } else if (!isPipActive && (pipWindowRef.current || isInAppPip)) {
      exitPip();
    }
  }, [isPipActive, enterPip, exitPip, isInAppPip]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        try {
          pipWindowRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`player-wrapper-container ${isInAppPip ? 'in-app-pip-active' : ''}`}
    >
      {/* Active player content container */}
      <div ref={contentRef} className="player-content-holder">
        {children}
      </div>

      {/* Placeholder shown on main page when Document PiP is active */}
      {isPipActive && !isInAppPip && (
        <div className="pip-placeholder">
          <div className="pip-placeholder-content">
            <div className="pip-icon-pulse">
              <Tv size={44} />
            </div>
            <h3>Playing in Picture-in-Picture</h3>
            {title && <p className="pip-title-sub">{title}</p>}
            <button className="pip-restore-btn" onClick={exitPip}>
              <RefreshCw size={16} /> Exit PiP & Restore
            </button>
          </div>
        </div>
      )}

      {/* Floating controls header for In-App PiP mode */}
      {isInAppPip && (
        <div className="in-app-pip-header">
          <span className="in-app-pip-title">{title || 'Playing Video'}</span>
          <button className="in-app-pip-close" onClick={exitPip} title="Exit Picture in Picture">
            <Minimize2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerWrapper;
