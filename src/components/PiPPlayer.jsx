import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize2, GripHorizontal } from 'lucide-react';
import './PiPPlayer.css';

const PiPPlayer = ({ children, isPlaying }) => {
  const [isPiP, setIsPiP] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const sentinelRef = useRef(null);
  const pipRef = useRef(null);
  const scrollIdRef = useRef(null);

  // Reset dismissed state when isPlaying changes (new video starts)
  useEffect(() => {
    if (isPlaying) {
      setIsDismissed(false);
      setPosition({ x: null, y: null });
    }
  }, [isPlaying]);

  // IntersectionObserver: watch when the player placeholder leaves viewport
  useEffect(() => {
    if (!isPlaying || isDismissed) return;

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
  }, [isPlaying, isDismissed]);

  // Close PiP
  const handleClose = useCallback(() => {
    setIsPiP(false);
    setIsDismissed(true);
  }, []);

  // Expand back to inline
  const handleExpand = useCallback(() => {
    setIsPiP(false);
    setIsDismissed(false);
    sentinelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // ── Drag logic (mouse) ──
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.pip-btn')) return; // Don't drag when clicking buttons
    e.preventDefault();
    const pip = pipRef.current;
    if (!pip) return;

    const rect = pip.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
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

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ── Drag logic (touch) ──
  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('.pip-btn')) return;
    const pip = pipRef.current;
    if (!pip) return;

    const rect = pip.getBoundingClientRect();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
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

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach global mouse/touch move/up listeners while dragging
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

  const showPiP = isPiP && !isDismissed;

  const pipStyle = {};
  if (showPiP && position.x !== null) {
    pipStyle.left = `${position.x}px`;
    pipStyle.top = `${position.y}px`;
    pipStyle.right = 'auto';
    pipStyle.bottom = 'auto';
  }

  return (
    <>
      {/* Sentinel: stays in the flow to detect scroll position */}
      <div ref={sentinelRef} className="pip-sentinel" />

      {/* Player container: inline or floating */}
      <div
        ref={pipRef}
        className={`pip-container ${showPiP ? 'pip-floating' : 'pip-inline'} ${isDragging ? 'pip-dragging' : ''}`}
        style={pipStyle}
        onMouseDown={showPiP ? handleMouseDown : undefined}
        onTouchStart={showPiP ? handleTouchStart : undefined}
      >
        {/* PiP controls overlay */}
        {showPiP && (
          <div className="pip-controls">
            <div className="pip-drag-handle">
              <GripHorizontal size={16} />
            </div>
            <div className="pip-actions">
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
        <div className="pip-player-content">
          {children}
        </div>
      </div>
    </>
  );
};

export default PiPPlayer;
