import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings2,
  Captions,
  PictureInPicture2,
  ListVideo,
  SkipForward,
} from "lucide-react";
import { getProgress, saveProgress } from "../watchHistory";
import { TMDB_IMAGE } from "../tmdb";
import "./MediaPlayer.css";

const formatTime = (value) => {
  const seconds = Math.max(0, Math.floor(value || 0));
  const hours = Math.floor(seconds / 3600);
  return `${hours ? hours + ":" : ""}${hours ? String(Math.floor(seconds / 60) % 60).padStart(2, "0") : Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};
const preference = (key, fallback) => {
  try {
    return Number(localStorage.getItem(`chanduflix_${key}`) ?? fallback);
  } catch {
    return fallback;
  }
};

export default function MediaPlayer({
  source,
  id,
  mediaType,
  season,
  episode,
  title,
  poster_path,
  backdrop_path,
  audioOptions = [],
  audioValue = "1",
  onAudioChange,
  episodes = [],
  episodeValue,
  onEpisodeChange,
}) {
  const video = useRef(null),
    shell = useRef(null),
    hlsRef = useRef(null),
    lastSaved = useRef(0);
  const [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [duration, setDuration] = useState(0),
    [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(() =>
      Math.min(1, Math.max(0, preference("volume", 1))),
    ),
    [muted, setMuted] = useState(false),
    [speed, setSpeed] = useState(() => preference("speed", 1));
  const [menu, setMenu] = useState(null),
    [fullscreen, setFullscreen] = useState(false),
    [failure, setFailure] = useState(""),
    [retry, setRetry] = useState(0),
    [notice, setNotice] = useState("");
  const [captions, setCaptions] = useState([]),
    [caption, setCaption] = useState("off"),
    [internalAudio, setInternalAudio] = useState([]),
    [internalAudioValue, setInternalAudioValue] = useState("0");

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let active = true;
    element.volume = Math.min(1, Math.max(0, preference("volume", 1)));
    element.playbackRate = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].includes(
      preference("speed", 1),
    )
      ? preference("speed", 1)
      : 1;
    if (
      source.type === "hls" &&
      !element.canPlayType("application/vnd.apple.mpegurl")
    ) {
      import("hls.js")
        .then(({ default: Hls }) => {
          if (!active) return;
          if (!Hls.isSupported()) {
            setFailure("This browser cannot play this stream.");
            return;
          }
          const hls = new Hls();
          hlsRef.current = hls;
          hls.loadSource(source.url);
          hls.attachMedia(element);
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              hls.stopLoad();
              setFailure("The video could not be loaded. Please try again.");
            }
          });
          hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
            setInternalAudio(
              hls.audioTracks.map((track, index) => ({
                id: String(index),
                name: track.name || track.lang || `Audio ${index + 1}`,
              })),
            );
          });
          hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
            setCaptions(
              hls.subtitleTracks.map((track, index) => ({
                id: `hls-${index}`,
                name: track.name || track.lang || `Subtitles ${index + 1}`,
              })),
            );
          });
        })
        .catch(() => {
          if (active)
            setFailure("The player could not load. Please try again.");
        });
    } else element.src = source.url;
    return () => {
      active = false;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      element.removeAttribute("src");
      element.load();
    };
  }, [source, retry]);
  useEffect(() => {
    const changed = () =>
      setFullscreen(document.fullscreenElement === shell.current);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  const storePreference = (key, value) => {
    try {
      localStorage.setItem(`chanduflix_${key}`, String(value));
    } catch {
      /* Controls still work without storage. */
    }
  };
  const persist = (force = false) => {
    const element = video.current;
    if (!element || !Number.isFinite(element.duration)) return;
    if (!force && Date.now() - lastSaved.current < 5000) return;
    lastSaved.current = Date.now();
    saveProgress({
      id,
      mediaType,
      season,
      episode,
      title,
      poster_path,
      backdrop_path,
      currentTime: element.currentTime,
      duration: element.duration,
    });
  };
  const syncTracks = () => {
    const element = video.current;
    if (!element) return;
    if (!hlsRef.current?.subtitleTracks?.length)
      setCaptions(
        Array.from(element.textTracks).map((track, index) => ({
          id: `native-${index}`,
          name: track.label || track.language || `Subtitles ${index + 1}`,
        })),
      );
    if (element.audioTracks?.length && audioOptions.length < 2)
      setInternalAudio(
        Array.from(element.audioTracks).map((track, index) => ({
          id: String(index),
          name: track.label || track.language || `Audio ${index + 1}`,
        })),
      );
  };
  const loaded = () => {
    const element = video.current;
    const total = Number.isFinite(element.duration) ? element.duration : 0;
    setDuration(total);
    const saved = getProgress(mediaType, id, season, episode);
    if (saved > 0 && saved < total - 10) {
      element.currentTime = saved;
      setTime(saved);
    }
    syncTracks();
  };
  const togglePlay = async () => {
    const element = video.current;
    if (!element) return;
    try {
      if (element.paused) await element.play();
      else element.pause();
      setNotice("");
    } catch {
      setNotice("Press play again when the video is ready.");
    }
  };
  const seek = (value) => {
    const element = video.current;
    if (!element || !Number.isFinite(element.duration)) return;
    element.currentTime = Math.min(element.duration, Math.max(0, value));
    setTime(element.currentTime);
    persist(true);
  };
  const setPlayerVolume = (value) => {
    const next = Math.min(1, Math.max(0, value));
    video.current.volume = next;
    video.current.muted = next === 0;
    setVolume(next);
    setMuted(next === 0);
    storePreference("volume", next);
  };
  const changeSpeed = (value) => {
    video.current.playbackRate = value;
    setSpeed(value);
    storePreference("speed", value);
  };
  const changeCaption = (value) => {
    setCaption(value);
    const hls = hlsRef.current;
    if (hls) {
      hls.subtitleTrack = value.startsWith("hls-")
        ? Number(value.slice(4))
        : -1;
      hls.subtitleDisplay = value !== "off";
    }
    Array.from(video.current.textTracks).forEach((track, index) => {
      track.mode = value === `native-${index}` ? "showing" : "disabled";
    });
  };
  const changeAudio = (value) => {
    persist(true);
    if (useExternalAudio && audioOptions.length && onAudioChange) {
      onAudioChange(value);
      return;
    }
    setInternalAudioValue(value);
    if (hlsRef.current) hlsRef.current.audioTrack = Number(value);
    else if (video.current.audioTracks)
      Array.from(video.current.audioTracks).forEach((track, index) => {
        track.enabled = index === Number(value);
      });
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (shell.current.requestFullscreen)
        await shell.current.requestFullscreen();
      else if (video.current.webkitEnterFullscreen)
        video.current.webkitEnterFullscreen();
      else setNotice("Fullscreen is unavailable in this browser.");
    } catch {
      setNotice("Fullscreen is unavailable in this browser.");
    }
  };
  const togglePip = async () => {
    try {
      if (document.pictureInPictureElement)
        await document.exitPictureInPicture();
      else await video.current.requestPictureInPicture();
      setNotice("");
    } catch {
      setNotice("Picture-in-picture is unavailable for this video.");
    }
  };
  const selectEpisode = (value) => {
    persist(true);
    setMenu(null);
    onEpisodeChange?.(value);
  };
  const currentIndex = episodes.findIndex(
    (item) => String(item.id) === String(episodeValue),
  );
  const nextEpisode = currentIndex >= 0 ? episodes[currentIndex + 1] : null;
  const keyboard = (event) => {
    if (event.key === "Escape") {
      setMenu(null);
      return;
    }
    if (event.target.matches("input,select")) return;
    if (event.target.closest("button")) {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      ) {
        const controls = Array.from(
          shell.current.querySelectorAll(
            "button:not(:disabled),input:not(:disabled),select",
          ),
        );
        const index = controls.indexOf(event.target.closest("button"));
        const direction = ["ArrowRight", "ArrowDown"].includes(event.key)
          ? 1
          : -1;
        controls[
          Math.max(0, Math.min(controls.length - 1, index + direction))
        ]?.focus();
        event.preventDefault();
      }
      return;
    }
    const key = event.key.toLowerCase();
    if (
      [
        " ",
        "k",
        "arrowleft",
        "arrowright",
        "arrowup",
        "arrowdown",
        "m",
        "f",
        "c",
      ].includes(key)
    )
      event.preventDefault();
    if (key === " " || key === "k") togglePlay();
    else if (key === "arrowleft") seek(video.current.currentTime - 10);
    else if (key === "arrowright") seek(video.current.currentTime + 10);
    else if (key === "arrowup") setPlayerVolume(volume + 0.05);
    else if (key === "arrowdown") setPlayerVolume(volume - 0.05);
    else if (key === "m") video.current.muted = !video.current.muted;
    else if (key === "f") toggleFullscreen();
    else if (key === "c")
      changeCaption(
        caption === "off" && captions.length ? captions[0].id : "off",
      );
  };
  const useExternalAudio = audioOptions.length > 1 || !internalAudio.length;
  const availableAudio = useExternalAudio ? audioOptions : internalAudio;
  if (failure)
    return (
      <div className="player-empty" role="alert">
        <h2>Playback unavailable</h2>
        <p>{failure}</p>
        <button
          className="primary-button"
          onClick={() => {
            setFailure("");
            setRetry((value) => value + 1);
          }}
        >
          Try again
        </button>
      </div>
    );
  return (
    <div
      className="native-player enhanced-player"
      ref={shell}
      tabIndex={0}
      onKeyDown={keyboard}
      aria-label={`${title} video player`}
    >
      <div className="video-stage">
        <video
          ref={video}
          playsInline
          crossOrigin="anonymous"
          preload="metadata"
          aria-label={title}
          poster={
            TMDB_IMAGE.backdrop(backdrop_path || poster_path) || undefined
          }
          onClick={togglePlay}
          onLoadedMetadata={loaded}
          onDurationChange={() => {
            const value = video.current?.duration;
            if (Number.isFinite(value)) setDuration(value);
          }}
          onLoadedData={syncTracks}
          onPlay={() => setPlaying(true)}
          onPause={() => {
            setPlaying(false);
            persist(true);
          }}
          onEnded={() => {
            setPlaying(false);
            persist(true);
          }}
          onTimeUpdate={() => {
            setTime(video.current.currentTime);
            persist();
          }}
          onProgress={() => {
            const element = video.current;
            if (element.buffered.length)
              setBuffered(element.buffered.end(element.buffered.length - 1));
          }}
          onVolumeChange={() => {
            setVolume(video.current.volume);
            setMuted(video.current.muted);
          }}
          onError={() =>
            setFailure("The video could not be loaded. Please try again.")
          }
        >
          {(source.subtitles || []).map((track) => (
            <track
              key={track.url}
              kind="subtitles"
              src={track.url}
              srcLang={track.language}
              label={track.label}
              onLoad={syncTracks}
            />
          ))}
        </video>
        {!playing && (
          <button
            className="video-center-play"
            aria-label="Play video"
            onClick={togglePlay}
          >
            <Play size={32} fill="currentColor" />
          </button>
        )}
      </div>
      <div className="player-controls">
        <div className="player-timeline">
          <span>{formatTime(time)}</span>
          <div className="timeline-track">
            <div
              className="timeline-buffer"
              style={{
                width: `${duration ? Math.min(100, (buffered / duration) * 100) : 0}%`,
              }}
            />
            <input
              aria-label="Seek video"
              aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
              type="range"
              min="0"
              max={duration || 1}
              step="0.1"
              value={Math.min(time, duration || 1)}
              disabled={!duration}
              onChange={(event) => seek(Number(event.target.value))}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="player-control-row">
          <div className="player-transport">
            <button
              className="control-button"
              aria-label="Rewind 10 seconds"
              title="Back 10 seconds (←)"
              onClick={() => seek(video.current.currentTime - 10)}
            >
              <RotateCcw size={23} />
              <small>10</small>
            </button>
            <button
              className="control-button primary-control"
              aria-label={playing ? "Pause" : "Play"}
              title="Play / pause (Space)"
              onClick={togglePlay}
            >
              {playing ? (
                <Pause fill="currentColor" size={23} />
              ) : (
                <Play fill="currentColor" size={23} />
              )}
            </button>
            <button
              className="control-button"
              aria-label="Forward 10 seconds"
              title="Forward 10 seconds (→)"
              onClick={() => seek(video.current.currentTime + 10)}
            >
              <RotateCw size={23} />
              <small>10</small>
            </button>
            {nextEpisode && (
              <button
                className="control-button"
                aria-label="Next episode"
                title="Next episode"
                onClick={() => selectEpisode(nextEpisode.id)}
              >
                <SkipForward size={22} />
              </button>
            )}
          </div>
          <div className="player-volume">
            <button
              className="control-button"
              aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
              onClick={() => {
                video.current.muted = !video.current.muted;
              }}
            >
              {muted || volume === 0 ? (
                <VolumeX size={21} />
              ) : (
                <Volume2 size={21} />
              )}
            </button>
            <input
              aria-label="Volume"
              type="range"
              min="0"
              max="1"
              step=".05"
              value={muted ? 0 : volume}
              onChange={(event) => setPlayerVolume(Number(event.target.value))}
            />
          </div>
          <div className="player-tools">
            {episodes.length > 1 && (
              <button
                className={`control-button ${menu === "episodes" ? "selected" : ""}`}
                aria-label="Choose episode"
                aria-expanded={menu === "episodes"}
                onClick={() => setMenu(menu === "episodes" ? null : "episodes")}
              >
                <ListVideo size={22} />
              </button>
            )}
            <button
              className={`control-button ${caption !== "off" ? "selected" : ""}`}
              aria-label="Subtitles"
              aria-expanded={menu === "subtitles"}
              onClick={() => setMenu(menu === "subtitles" ? null : "subtitles")}
            >
              <Captions size={23} />
            </button>
            <button
              className={`control-button speed-control ${menu === "settings" ? "selected" : ""}`}
              aria-label="Player settings"
              aria-expanded={menu === "settings"}
              onClick={() => setMenu(menu === "settings" ? null : "settings")}
            >
              <Settings2 size={21} />
              <span>{speed}×</span>
            </button>
            {document.pictureInPictureEnabled && (
              <button
                className="control-button pip-control"
                aria-label="Picture in picture"
                onClick={togglePip}
              >
                <PictureInPicture2 size={21} />
              </button>
            )}
            <button
              className="control-button"
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
            </button>
          </div>
        </div>
        {menu && (
          <div
            className="player-menu"
            role="region"
            aria-label={
              menu === "episodes"
                ? "Episodes"
                : menu === "subtitles"
                  ? "Subtitle settings"
                  : "Player settings"
            }
          >
            <div className="player-menu-heading">
              <strong>
                {menu === "episodes"
                  ? "Episodes"
                  : menu === "subtitles"
                    ? "Subtitles"
                    : "Playback settings"}
              </strong>
              <button
                className="menu-close"
                aria-label="Close player menu"
                onClick={() => setMenu(null)}
              >
                Done
              </button>
            </div>
            {menu === "episodes" ? (
              <div className="player-episode-list">
                {episodes.map((item) => (
                  <button
                    key={item.id}
                    className={
                      String(item.id) === String(episodeValue) ? "selected" : ""
                    }
                    onClick={() => selectEpisode(item.id)}
                  >
                    <span>Episode {item.title}</span>
                    <span>{item.duration}</span>
                  </button>
                ))}
              </div>
            ) : menu === "subtitles" ? (
              <>
                <label>
                  Subtitle track
                  <select
                    aria-label="Subtitle track"
                    value={caption}
                    onChange={(event) => changeCaption(event.target.value)}
                  >
                    <option value="off">Off</option>
                    {captions.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!captions.length && (
                  <p>No subtitle tracks are available for this source.</p>
                )}
              </>
            ) : (
              <>
                <label>
                  Playback speed
                  <select
                    aria-label="Playback speed"
                    value={speed}
                    onChange={(event) =>
                      changeSpeed(Number(event.target.value))
                    }
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((value) => (
                      <option key={value} value={value}>
                        {value === 1 ? "Normal (1×)" : `${value}×`}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Audio track
                  <select
                    aria-label="Audio track"
                    value={
                      useExternalAudio && audioOptions.length
                        ? String(audioValue)
                        : internalAudioValue
                    }
                    onChange={(event) => changeAudio(event.target.value)}
                  >
                    {availableAudio.length ? (
                      availableAudio.map((track) => (
                        <option key={track.id} value={track.id}>
                          {track.name}
                        </option>
                      ))
                    ) : (
                      <option value="0">Original</option>
                    )}
                  </select>
                </label>
                <label>
                  Subtitles
                  <select
                    aria-label="Subtitles in settings"
                    value={caption}
                    onChange={(event) => changeCaption(event.target.value)}
                  >
                    <option value="off">
                      Off{!captions.length ? " — no tracks available" : ""}
                    </option>
                    {captions.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>
        )}
        {notice && (
          <p className="player-notice" role="status">
            {notice}
          </p>
        )}
      </div>
      <p className="player-caption">
        <span>
          {title}
          {episodes.length > 1
            ? ` · Episode ${episodes.find((item) => String(item.id) === String(episodeValue))?.title || episodeValue}`
            : ""}
        </span>
        <span>
          {formatTime(time)} / {formatTime(duration)}
        </span>
      </p>
    </div>
  );
}
