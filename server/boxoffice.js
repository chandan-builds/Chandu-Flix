import { createHash, createDecipheriv, randomBytes } from "node:crypto";

// Compatibility with the APK's read-only catalog protocol. No user tokens or
// native playback proofs are collected, fabricated, or accepted by this client.
const signPrefix = "47Q8tBqO4YqrMHf4";
const responseKey = "0123456789123456";
const responseIV = "2015030120123456";
const origin = "https://moviein.ajfysu.com";

export async function readCatalog(route, fields = {}, session = {}) {
  const device = session.device || randomBytes(8).toString("hex");
  const timestamp = session.timestamp || String(Date.now());
  const signature = createHash("md5")
    .update(signPrefix + device + timestamp)
    .digest("hex")
    .toUpperCase();
  const response = await fetch(origin + route, {
    method: "POST",
    signal: AbortSignal.timeout(12000),
    headers: {
      app_id: "moviein",
      package_name: "com.velvetreel.shorttv",
      version: "40000",
      sys_platform: "2",
      mob_mfr: "generic",
      mobmodel: "catalog-client",
      sysrelease: "15",
      device_id: device,
      androidid: device,
      channel_code: "63",
      cur_time: timestamp,
      token: session.token || "",
      sign: signature,
      is_vvv: "0",
      is_language: "en",
      is_display: "0",
      app_language: "en",
      en_al: "0",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(fields),
  });
  if (!response.ok)
    throw new Error(`Catalog upstream returned ${response.status}`);
  const text = await response.text();
  const decoder = createDecipheriv(
    "aes-128-cbc",
    Buffer.from(responseKey),
    Buffer.from(responseIV),
  );
  const decoded = Buffer.concat([
    decoder.update(Buffer.from(text, "base64")),
    decoder.final(),
  ]).toString("utf8");
  const payload = JSON.parse(decoded);
  if (payload.code !== 10000)
    throw new Error("Catalog upstream rejected the request");
  return payload.result;
}

export function normalizeTitle(item) {
  const mediaType = [2, 3, 4].includes(Number(item.type_pid)) ? "tv" : "movie";
  const id = Number(item.vod_id || item.id);
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const image =
    typeof item.vod_pic === "string" && item.vod_pic.startsWith("https://")
      ? item.vod_pic
      : null;
  const name = item.vod_name || item.name || "Untitled";
  return {
    id: `bo-${id}`,
    sourceId: id,
    provider: "boxoffice",
    media_type: mediaType,
    title: name,
    name,
    poster_path: image,
    backdrop_path: image,
    vote_average: Number(item.vod_douban_score) || 0,
    release_date:
      mediaType === "movie" && item.vod_year
        ? `${item.vod_year}-01-01`
        : undefined,
    first_air_date:
      mediaType === "tv" && item.vod_year
        ? `${item.vod_year}-01-01`
        : undefined,
    overview: String(item.vod_blurb || item.vod_content || "").replace(
      /<[^>]*>/g,
      "",
    ),
    language: item.audio_language_tag || "",
    episodeCount: Number(item.vod_total) || 0,
  };
}

export async function catalogRequest(query) {
  const view = query.get("view") || "popular";
  if (view === "categories")
    return { categories: await readCatalog("/api/type/get_list") };
  if (!["popular", "search", "browse"].includes(view))
    return { status: 400, error: "Unsupported catalog view" };
  const term = (query.get("q") || "").trim();
  if (view === "search" && (term.length < 2 || term.length > 120))
    return {
      status: 400,
      error: "Search must contain between 2 and 120 characters",
    };
  const page = Math.max(
    1,
    Math.min(100, Number.parseInt(query.get("page")) || 1),
  );
  const mediaType = query.get("type") === "tv" ? "2" : "1";
  const genreMap = {
    28: "Adventure",
    12: "Adventure",
    35: "Comedy",
    18: "Drama",
    27: "Horror",
    80: "Crime",
    878: "Science Fiction",
    16: "Animation",
    10749: "Romance",
    99: "Documentary",
    10752: "War",
    10751: "Family",
  };
  const selectedGenre = query.get("genre") || "";
  const genre = genreMap[selectedGenre] || selectedGenre;
  const sort = query.get("sort") || "";
  if (genre.length > 60 || !["", "Latest", "Top today"].includes(sort))
    return { status: 400, error: "Invalid catalog filter" };
  let records;
  if (view === "search")
    records = await readCatalog(
      "/api/search/result",
      {
        kw: term,
        pn: String(page),
        ...(query.get("type") ? { type_pid: mediaType } : {}),
      },
      await guestSession(),
    );
  else if (view === "browse")
    records = await readCatalog(
      "/api/search/screen",
      {
        type_id: mediaType,
        type: genre,
        area: "",
        year: "",
        sort,
        pn: String(page),
      },
      await guestSession(),
    );
  else records = await readCatalog("/api/search/hot_search");
  const results = (Array.isArray(records) ? records : [])
    .map(normalizeTitle)
    .filter(Boolean);
  return {
    results: [...new Map(results.map((item) => [item.id, item])).values()],
    page,
    hasMore: view !== "popular" && records.length >= 20,
  };
}

let guest;
let guestPending;
export async function guestSession() {
  if (guest && guest.expires > Date.now()) return guest;
  if (guestPending) return guestPending;
  guestPending = (async () => {
    const device = randomBytes(8).toString("hex");
    const data = await readCatalog(
      "/api/public/init",
      { invited_by: "", is_install: "1" },
      { device },
    );
    const token = data?.user_info?.token;
    if (!token) throw new Error("Anonymous session could not be initialized");
    guest = { device, token, expires: Date.now() + 30 * 60 * 1000 };
    return guest;
  })().finally(() => {
    guestPending = null;
  });
  return guestPending;
}
