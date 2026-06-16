/**
 * Watch History — localStorage-based progress tracking
 * Works with VidKing's postMessage events
 */

const STORAGE_KEY = "chanduflix_watch_history";

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Build a unique key per content item */
function buildKey(mediaType, id, season, episode) {
  if (mediaType === "tv") return `tv_${id}_s${season}_e${episode}`;
  return `movie_${id}`;
}

/** Save / update watch progress */
export function saveProgress({ id, mediaType, currentTime, duration, season, episode, title, poster_path, backdrop_path }) {
  const all = getAll();
  const key = buildKey(mediaType, id, season, episode);
  const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  all[key] = {
    id,
    mediaType,
    currentTime: Math.floor(currentTime),
    duration: Math.floor(duration),
    percentage: Math.round(percentage * 10) / 10,
    season: season || null,
    episode: episode || null,
    title: title || all[key]?.title || "",
    poster_path: poster_path || all[key]?.poster_path || "",
    backdrop_path: backdrop_path || all[key]?.backdrop_path || "",
    updatedAt: Date.now(),
  };

  saveAll(all);
}

/** Get saved progress for a specific item (returns seconds or 0) */
export function getProgress(mediaType, id, season, episode) {
  const all = getAll();
  const key = buildKey(mediaType, id, season, episode);
  return all[key]?.currentTime || 0;
}

/** Get the N most recently watched items, sorted by time */
export function getRecentlyWatched(limit = 20) {
  const all = getAll();
  return Object.values(all)
    .filter((item) => item.percentage < 95) // exclude fully watched
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}

/** Get all items that are between 2% and 95% complete (for "Continue Watching") */
export function getContinueWatching(limit = 15) {
  const all = getAll();
  return Object.values(all)
    .filter((item) => item.percentage >= 2 && item.percentage < 95)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}

/**
 * Attach this listener once at the app level to capture VidKing postMessage events.
 * It saves progress automatically whenever the player sends a timeupdate/pause/seeked event.
 *
 * Call with optional metadata (title, poster_path) so we can display items in Continue Watching.
 */
export function createPlayerListener(metadata = {}) {
  return function handleMessage(event) {
    try {
      const message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      if (message?.type !== "PLAYER_EVENT") return;

      const d = message.data;
      if (!d || !d.id) return;

      // Only save on meaningful events
      if (["timeupdate", "pause", "seeked", "ended"].includes(d.event)) {
        saveProgress({
          id: d.id,
          mediaType: d.mediaType || "movie",
          currentTime: d.currentTime || 0,
          duration: d.duration || 0,
          season: d.season,
          episode: d.episode,
          ...metadata,
        });
      }
    } catch {
      // Ignore non-JSON messages from other iframes
    }
  };
}
