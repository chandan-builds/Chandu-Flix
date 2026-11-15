import { normalizeMedia } from "../src/mediaLibrary.js";
import { loadThugTvSources } from "./thugtvSources.js";
import { configuredSDK } from "./playback.js";
import { resolveBoxOfficeSource } from "./boxofficeSources.js";

const validId = (value) => /^[1-9]\d{0,9}$/.test(value || "");
const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
};

export async function resolveSources(query, provider = process.env.STREAM_PROVIDER_URL) {
  const type = query.get("type");
  const id = query.get("id");
  const season = query.get("season");
  const episode = query.get("episode");
  if (!["movie", "tv"].includes(type) || !validId(id) ||
      (type === "tv" && (!validId(season) || !validId(episode)))) {
    throw Object.assign(new Error("Invalid title or episode"), { status: 400 });
  }
  const path = type === "tv" ? `tv/${id}/${season}/${episode}` : `movie/${id}`;
  const imdb = query.get("imdb");
  const imdbId = /^tt\d+$/.test(imdb || "") ? imdb : null;
  if (!provider) {
    const boxOffice = await resolveBoxOfficeSource({
      type,
      season,
      episode,
      title: query.get("title")?.trim(),
      year: query.get("year"),
    }, configuredSDK()).catch(() => null);
    if (boxOffice) return [boxOffice];
  }

  const sources = provider
    ? await loadConfiguredSources(provider, path, imdbId)
    : await loadThugTvSources(path, imdbId);

  const embedOrigins = new Set((process.env.STREAM_EMBED_ORIGINS || "")
    .split(",")
    .map((value) => safeUrl(value.trim()))
    .filter(Boolean)
    .map((value) => new URL(value).origin));
  if (!Array.isArray(sources)) throw new Error("Invalid stream provider response");
  return sources.slice(0, 30).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const url = safeUrl(item.url);
    if (!url) return [];
    const name = String(item.label || item.name || `Server ${index + 1}`).slice(0, 80);
    if (item.type === "embed") {
      return embedOrigins.has(new URL(url).origin) ? [{ type: "embed", url, name }] : [];
    }
    const source = normalizeMedia({
      type: item.format === "mp4" ? "mp4" : item.type,
      url,
      subtitles: Array.isArray(item.subtitles) ? item.subtitles.slice(0, 50).map((track) => ({
        url: safeUrl(track?.url),
        language: track?.language || track?.lang,
        label: track?.label,
      })) : [],
    });
    if (!source) return [];

    const variants = Array.isArray(item.qualityVariants) ? item.qualityVariants.slice(0, 8) : [];
    return [
      { ...source, name, quality: String(item.quality || "").slice(0, 16) },
      ...variants.flatMap((variant) => {
        const variantUrl = safeUrl(variant?.url);
        return variantUrl && variantUrl !== url
          ? [{ ...source, url: variantUrl, name, quality: String(variant?.label || "").slice(0, 16) }]
          : [];
      }),
    ];
  }).filter((source, index, list) => list.findIndex((other) => other.url === source.url) === index);
}

async function loadConfiguredSources(provider, path, imdb) {
  const url = new URL(provider);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid provider URL");
  url.pathname = `${url.pathname.replace(/\/$/, "")}/${path}`;
  if (imdb) url.searchParams.set("imdb", imdb);
  const token = process.env.STREAM_PROVIDER_TOKEN;
  const response = await fetch(url, {
    headers: { Accept: "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    signal: AbortSignal.timeout(8000),
    redirect: "error",
  });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error("Stream provider unavailable");
  const { sources } = await response.json();
  return sources;
}

export async function sourceRequest(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "private, no-store");
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      throw Object.assign(new Error("Method not allowed"), { status: 405 });
    }
    const sources = await resolveSources(new URL(req.url, "http://localhost").searchParams);
    res.end(JSON.stringify({ sources }));
  } catch (error) {
    res.statusCode = error.status || 502;
    res.end(JSON.stringify({ error: error.status ? error.message : "Stream provider unavailable" }));
  }
}
