const API = "https://api.thugtv.online/api/stream";
const SITE_API = "https://thugtv.online/api/stream";
const VELVET_API = "https://srv1.thugtv.online/api/stream/source";
const CHANDU_ORIGIN = "https://chandu-flix.vercel.app";
const VELVET_MEDIA = new Set([
  "https://srv1.thugtv.online",
  "https://thuktv-stream-proxy.rahul-work-joshi.workers.dev",
]);

async function streamJson(url, signal) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
    redirect: "error",
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw Object.assign(new Error(`Stream lookup returned HTTP ${response.status}`), {
      status: response.status,
    });
  }
  return response.json();
}

async function resolveVelvet(path, signal) {
  const result = await streamJson(`${VELVET_API}/${path}`, signal);
  const source = result?.status === "ready" ? result.source : null;
  if (!source?.url || source.type !== "hls") return null;
  const url = new URL(source.url);
  if (!VELVET_MEDIA.has(url.origin) || url.username || url.password) return null;

  const response = await fetch(url, {
    method: "HEAD",
    headers: { Origin: CHANDU_ORIGIN, Referer: `${CHANDU_ORIGIN}/` },
    redirect: "error",
    signal,
  });
  const cors = response.headers.get("access-control-allow-origin");
  if (!response.ok || (cors !== "*" && cors !== CHANDU_ORIGIN)) return null;
  return { ...source, name: "Velvet", label: "Velvet" };
}

async function resolveKnight(path, entries, signal) {
  const knight = entries.find((source) =>
    /^server-direct-(vaplayer|moviebox-edge)(-tv)?$/.test(source?.id),
  );
  if (!knight) return null;
  if (knight.url) return knight;

  const provider = knight.id.includes("vaplayer") ? "vaplayer" : "moviebox-edge";
  const result = await streamJson(`${API}/direct/${provider}/${path}`, signal);
  const source = result?.status === "ready" ? result.source : null;
  return source?.url ? { ...source, name: "Knight", label: "Knight" } : null;
}

async function loadListing(path, imdb) {
  for (const base of [API, SITE_API]) {
    const url = new URL(`${base}/${path}`);
    if (imdb) url.searchParams.set("imdb", imdb);
    try {
      const listing = await streamJson(url, AbortSignal.timeout(4000));
      if (Array.isArray(listing?.sources)) return listing.sources;
      if (listing !== null) throw new Error("Unexpected stream listing");
    } catch (error) {
      if (base === SITE_API) throw error;
    }
  }
  return [];
}

export async function loadThugTvSources(path, imdb) {
  const velvet = resolveVelvet(path, AbortSignal.timeout(4500)).catch(() => null);
  const entries = await loadListing(path, imdb);
  const citadel = entries.filter((source) =>
    /^server-direct-castle(-tv)?$/.test(source?.id) && source.type === "hls",
  );
  const [velvetSource, knightSource] = await Promise.all([
    velvet,
    resolveKnight(path, entries, AbortSignal.timeout(3500)).catch(() => null),
  ]);
  return [...citadel, velvetSource, knightSource].filter(Boolean);
}
