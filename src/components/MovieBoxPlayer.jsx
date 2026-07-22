import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import { Loader } from 'lucide-react';
import './MovieBoxPlayer.css';

const MovieBoxPlayer = ({
  mediaType = 'movie',
  tmdbId,
  season = 1,
  episode = 1,
  title = '',
  year = '',
  onFallback,
}) => {
  const artRef = useRef();
  const artInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streams, setStreams] = useState([]);
  const [currentStream, setCurrentStream] = useState(null);
  const [subtitles, setSubtitles] = useState([]);

  // ── Mapping & Stream Fetching ──
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setStreams([]);
    setCurrentStream(null);
    setSubtitles([]);

    const loadPlayerResources = async () => {
      try {
        // Step 1: Find movie on MovieBox via title search
        const searchTitle = title || '';
        if (!searchTitle) throw new Error('No title provided for playback search');

        const searchType = mediaType === 'tv' ? 2 : 1;
        const searchRes = await fetch('/moviebox-api/subject/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Lang': 'en'
          },
          body: JSON.stringify({
            keyword: searchTitle,
            page: '1',
            perPage: 10,
            subjectType: searchType
          })
        });

        if (!searchRes.ok) throw new Error(`Search request failed with status ${searchRes.status}`);
        const searchData = await searchRes.json();
        
        if (searchData.code !== 0 || !searchData.data?.items?.length) {
          throw new Error('Not found on MovieBox server');
        }

        const items = searchData.data.items;
        const targetYear = String(year || '');
        
        // Find best match matching title and release year
        let bestMatch = items.find(item => {
          const itemTitle = (item.title || '').toLowerCase();
          const targetTitle = searchTitle.toLowerCase();
          const itemYear = (item.releaseDate || '').split('-')[0];
          return itemTitle === targetTitle && (!year || itemYear === targetYear);
        });

        if (!bestMatch) {
          bestMatch = items.find(item => (item.title || '').toLowerCase() === searchTitle.toLowerCase());
        }
        if (!bestMatch) {
          bestMatch = items[0];
        }

        const { subjectId, detailPath } = bestMatch;
        if (!subjectId || !detailPath) throw new Error('Invalid subject ID or path from server search');

        if (!active) return;

        // Step 2: Fetch playback stream URLs
        const se = mediaType === 'tv' ? season : 0;
        const ep = mediaType === 'tv' ? episode : 0;
        
        const playRes = await fetch(`/moviebox-api/subject/play?subjectId=${subjectId}&se=${se}&ep=${ep}&detailPath=${detailPath}`);
        if (!playRes.ok) throw new Error(`Playback request failed with status ${playRes.status}`);
        const playData = await playRes.json();

        if (playData.code !== 0 || !playData.data) {
          throw new Error('No video stream resources found for this video');
        }

        const playStreams = playData.data.streams || [];
        if (!playStreams.length) throw new Error('No streaming sources available on MovieBox');

        // Sort streams: 1080p, 720p, 480p, 360p
        const sortedStreams = [...playStreams].sort((a, b) => {
          const resA = parseInt(a.resolutions) || 0;
          const resB = parseInt(b.resolutions) || 0;
          return resB - resA;
        });

        if (!active) return;
        setStreams(sortedStreams);
        
        // Choose highest quality by default
        const defaultStream = sortedStreams[0];
        setCurrentStream(defaultStream);

        // Step 3: Fetch subtitles/captions
        try {
          const capRes = await fetch(`/moviebox-api/subject/caption?format=MP4&id=${defaultStream.id}&subjectId=${subjectId}&detailPath=${detailPath}`);
          if (capRes.ok) {
            const capData = await capRes.json();
            if (capData.code === 0 && capData.data?.captions) {
              setSubtitles(capData.data.captions);
            }
          }
        } catch (subErr) {
          console.warn('Subtitles fetch failed (non-critical):', subErr);
        }

        setLoading(false);
      } catch (err) {
        console.error('MovieBox player load failed:', err);
        if (active) {
          setError(err.message || 'Failed to load movie stream');
          setLoading(false);
        }
      }
    };

    loadPlayerResources();

    return () => {
      active = false;
    };
  }, [mediaType, tmdbId, season, episode, title, year]);

  // ── Artplayer Instance Management ──
  useEffect(() => {
    if (loading || error || !currentStream || !artRef.current) return;

    // Convert subtitles to Artplayer track format
    const subtitleTracks = subtitles.map((sub, index) => ({
      default: index === 0, // Auto-select first subtitle
      html: sub.language,
      url: sub.url,
      name: sub.language,
    }));

    // Setup quality switching option in Artplayer
    const qualitySelector = streams.map(s => ({
      default: s.id === currentStream.id,
      html: `${s.resolutions}p (${s.codecName || 'h264'})`,
      url: s.url,
    }));

    const art = new Artplayer({
      container: artRef.current,
      url: currentStream.url,
      title: title,
      poster: '',
      volume: 0.8,
      isLive: false,
      muted: false,
      autoplay: true,
      pip: true,
      autoSize: false,
      autoMini: false,
      screenshot: false,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#e50914',
      subtitle: subtitleTracks.length > 0 ? {
        url: subtitleTracks[0].url,
        type: 'srt',
        style: {
          color: '#fff',
          fontSize: '24px',
          textShadow: '0 0 4px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.9)',
        },
      } : undefined,
      quality: qualitySelector,
      customType: {
        // Handle SRT subtitles natively
        srt: function (video, url, art) {
          art.subtitle.url = url;
        }
      }
    });

    artInstanceRef.current = art;

    // Clean up on component unmount or stream change
    return () => {
      if (art && art.destroy) {
        art.destroy(false);
      }
      artInstanceRef.current = null;
    };
  }, [loading, error, currentStream, subtitles, streams, title]);

  if (loading) {
    return (
      <div className="moviebox-loader">
        <Loader className="moviebox-spinner" size={48} />
        <p>Connecting to secure MovieBox server...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="moviebox-error-card">
        <h3>Server Stream Unavailable</h3>
        <p>{error}</p>
        <div className="error-actions">
          {onFallback && (
            <button className="fallback-btn" onClick={onFallback}>
              Switch to Backup Server
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="moviebox-player-wrapper">
      <div ref={artRef} className="moviebox-artplayer" />
    </div>
  );
};

export default MovieBoxPlayer;
