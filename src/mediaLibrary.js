export function selectMedia(library, { mediaType, id, season, episode }) {
  const key =
    mediaType === "tv" ? `tv:${id}:${season}:${episode}` : `movie:${id}`;
  const media = library?.[key];
  if (!media || !["mp4", "hls", "webm"].includes(media.type)) return null;
  try {
    if (new URL(media.url).protocol !== "https:") return null;
  } catch {
    return null;
  }
  return {
    ...media,
    subtitles: (Array.isArray(media.subtitles) ? media.subtitles : []).filter(
      (track) => {
        try {
          return (
            new URL(track.url).protocol === "https:" &&
            track.language &&
            track.label
          );
        } catch {
          return false;
        }
      },
    ),
  };
}

export async function findMedia(selection, signal) {
  const response = await fetch("/media-library.json", {
    signal,
    cache: "no-cache",
  });
  if (!response.ok) throw new Error("Video library request failed");
  return selectMedia(await response.json(), selection);
}
