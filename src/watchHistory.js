/**
 * Watch History — localStorage-based progress tracking
 * Native video progress, stored on this device
 */

const STORAGE_KEY = "chanduflix_watch_history";

function getAll() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? stored
      : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* Playback works when storage is unavailable. */
  }
}

/** Build a unique key per content item */
function buildKey(mediaType, id, season, episode) {
  if (mediaType === "tv") return `tv_${id}_s${season}_e${episode}`;
  return `movie_${id}`;
}

/** Save / update watch progress */
export function saveProgress({
  id,
  mediaType,
  currentTime,
  duration,
  season,
  episode,
  title,
  poster_path,
  backdrop_path,
}) {
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
