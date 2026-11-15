import { catalogRequest } from "./boxoffice.js";
import { playbackRequest } from "./playback.js";

const normalizedTitle = (value) => value.normalize("NFKC")
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

export function matchBoxOfficeTitle(records, { title, year, type, season }) {
  const expected = normalizedTitle(title);
  if (!expected || !/^[0-9]{4}$/.test(year)) return null;

  const matches = records.filter((record) => {
    if (record.media_type !== type) return false;
    const date = type === "tv" ? record.first_air_date : record.release_date;
    if (date?.slice(0, 4) !== year) return false;
    const candidate = normalizedTitle(record.title);
    return type === "tv"
      ? candidate === `${expected} season ${season}`
      : candidate === expected;
  });
  return matches.length === 1 ? matches[0] : null;
}

export async function resolveBoxOfficeSource(selection, sdkUrl) {
  if (!sdkUrl || !selection.title || selection.title.length > 120 ||
      !/^[0-9]{4}$/.test(selection.year || "")) return null;

  const { results } = await catalogRequest(new URLSearchParams({
    view: "search",
    type: selection.type,
    q: selection.title,
  }));
  const match = matchBoxOfficeTitle(results || [], selection);
  if (!match) return null;

  const playback = await playbackRequest(new URLSearchParams({ id: match.id }), sdkUrl);
  if (!matchBoxOfficeTitle([playback.title], selection)) return null;
  const episode = selection.type === "tv"
    ? playback.episodes.find(({ id }) => id === Number(selection.episode))
    : playback.episodes.length === 1 ? playback.episodes[0] : null;
  return episode?.source ? { ...episode.source, name: "BoxOffice" } : null;
}
