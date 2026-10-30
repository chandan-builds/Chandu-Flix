import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Readable } from "node:stream";
import { readCatalog, normalizeTitle, guestSession } from "./boxoffice.js";

const signingKey =
  process.env.PLAYBACK_SIGNING_SECRET || randomBytes(32).toString("hex");
export function configuredSDK() {
  return process.env.BOXOFFICE_SDK_URL || null;
}
const serviceError = (message, status = 503) =>
  Object.assign(new Error(message), { status });
const MEDIA_CHUNK_BYTES = 1024 * 1024;

export function limitMediaRange(range) {
  if (!range) return `bytes=0-${MEDIA_CHUNK_BYTES - 1}`;
  const forward = /^bytes=(\d+)-(\d*)$/.exec(range);
  if (forward) {
    const start = Number(forward[1]);
    const end = forward[2] ? Number(forward[2]) : Infinity;
    if (
      !Number.isSafeInteger(start) ||
      !(end === Infinity || Number.isSafeInteger(end)) ||
      end < start ||
      start > Number.MAX_SAFE_INTEGER - MEDIA_CHUNK_BYTES
    )
      throw serviceError("Invalid media range", 416);
    return `bytes=${start}-${Math.min(end, start + MEDIA_CHUNK_BYTES - 1)}`;
  }
  const suffix = /^bytes=-(\d+)$/.exec(range);
  if (suffix) {
    const length = Number(suffix[1]);
    if (!Number.isSafeInteger(length) || length < 1)
      throw serviceError("Invalid media range", 416);
    return `bytes=-${Math.min(length, MEDIA_CHUNK_BYTES)}`;
  }
  throw serviceError("Invalid media range", 416);
}

export function issueTicket(path, expires = Date.now() + 6 * 60 * 60 * 1000) {
  const payload = Buffer.from(JSON.stringify({ path, expires })).toString(
    "base64url",
  );
  const signature = createHmac("sha256", signingKey)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}
export function verifyTicket(ticket) {
  if (typeof ticket !== "string" || ticket.length > 16000)
    throw serviceError("Invalid video ticket", 400);
  const [payload, signature, ...extra] = ticket.split(".");
  if (!payload || !signature || extra.length)
    throw serviceError("Invalid video ticket", 400);
  const expected = createHmac("sha256", signingKey).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw serviceError("Invalid video ticket", 403);
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw serviceError("Invalid video ticket", 400);
  }
  if (!Number.isFinite(data.expires) || data.expires < Date.now())
    throw serviceError("Video ticket expired", 410);
  if (
    typeof data.path !== "string" ||
    !data.path.startsWith("/") ||
    data.path.startsWith("//") ||
    data.path.includes("..")
  )
    throw serviceError("Invalid resource path", 400);
  return data.path;
}
function sdkHeaders() {
  return process.env.BOXOFFICE_SDK_TOKEN
    ? { Authorization: `Bearer ${process.env.BOXOFFICE_SDK_TOKEN}` }
    : {};
}
function ensureService(sdkUrl) {
  if (!sdkUrl) throw serviceError("Playback service is not configured");
  const url = new URL(sdkUrl);
  if (!["http:", "https:"].includes(url.protocol))
    throw serviceError("Invalid playback service");
  if (process.env.VERCEL && !process.env.PLAYBACK_SIGNING_SECRET)
    throw serviceError("Playback signing secret is not configured");
}

export async function playbackRequest(query, sdkUrl = configuredSDK()) {
  ensureService(sdkUrl);
  const id = Number(query.get("id")?.replace(/^bo-/, ""));
  const audio = Number(query.get("audio") || 0);
  if (!Number.isSafeInteger(id) || id < 1 || ![0, 1, 2].includes(audio))
    throw serviceError("Invalid title selection", 400);
  const session = await guestSession();
  const timestamp = String(Date.now());
  const verifyUrl = new URL("/control", sdkUrl);
  verifyUrl.searchParams.set("msg", "verify");
  verifyUrl.searchParams.set("device_id", session.device + id);
  verifyUrl.searchParams.set("ts", timestamp);
  const response = await fetch(verifyUrl, {
    headers: sdkHeaders(),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok)
    throw serviceError("Playback verification unavailable", 502);
  const proof = (await response.text()).trim();
  if (!/^[a-f0-9]{32}$/i.test(proof))
    throw serviceError("Unexpected playback verification response", 502);
  const data = await readCatalog(
    "/api/vod/info_new",
    {
      vod_id: String(id),
      cur_time: timestamp,
      sign: proof,
      audio_type: String(audio),
    },
    { ...session, timestamp },
  );
  const title = normalizeTitle({ ...data, id, vod_id: id });
  if (!title) throw serviceError("Title unavailable", 404);
  const episodes = (data.vod_collection || [])
    .filter((item) => item.vod_url && !Number(item.is_ad))
    .flatMap((item) => {
      let source;
      try {
        source = new URL(item.vod_url);
      } catch {
        return [];
      }
      if (!["http:", "https:"].includes(source.protocol)) return [];
      const type = item.vod_url.endsWith(".mp4") ? "mp4" : "hls";
      const path = `/resource.${type === "mp4" ? "mp4" : "m3u8"}?src=${Buffer.from(item.vod_url).toString("base64")}`;
      return [
        {
          id: Number(item.collection) || 1,
          title: String(item.title || item.collection || "Episode"),
          duration: item.duration || "",
          source: {
            type,
            url: process.env.BOXOFFICE_MEDIA_RELAY_URL
              ? `${new URL("/api/stream", process.env.BOXOFFICE_MEDIA_RELAY_URL)}?ticket=${issueTicket(path)}`
              : `/api/stream?ticket=${issueTicket(path)}`,
          },
        },
      ];
    });
  return {
    title,
    episodes,
    audioType: Number(data.audio_type) || audio,
    audioOptions: (data.audio_type_option || []).map((item) => ({
      id: Number(item.type),
      name: String(item.type_name),
    })),
    seasons: data.series_info || [],
  };
}

export async function streamRequest(req, res, sdkUrl = configuredSDK()) {
  const controller = new AbortController();
  try {
    ensureService(sdkUrl);
    if (!["GET", "HEAD"].includes(req.method)) {
      res.statusCode = 405;
      res.end();
      return;
    }
    const query = new URL(req.url, "http://localhost").searchParams;
    const path = verifyTicket(query.get("ticket"));
    const headers = { ...sdkHeaders() };
    if (path.startsWith("/resource.mp4"))
      headers.Range = limitMediaRange(req.headers.range);
    else if (req.headers.range) headers.Range = req.headers.range;
    const timeout = setTimeout(() => controller.abort(), 15000);
    let upstream;
    try {
      upstream = await fetch(new URL(path, sdkUrl), {
        headers,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    res.statusCode = upstream.status;
    res.setHeader("Cache-Control", "private, no-store");
    if (upstream.status === 206) res.setHeader("Accept-Ranges", "bytes");
    for (const name of [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ]) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    if (req.method === "HEAD") {
      await upstream.body?.cancel();
      res.end();
      return;
    }
    if (!upstream.body) {
      res.end();
      return;
    }
    // The native service may return HLS playlists with its own loopback links.
    if (
      path.startsWith("/resource.m3u8") &&
      (upstream.headers.get("content-type") || "").includes("mpegurl")
    ) {
      const text = await upstream.text();
      const rewrite = (value) => {
        const url = new URL(value, new URL(path, sdkUrl));
        if (
          url.origin !== new URL(sdkUrl).origin &&
          !["127.0.0.1", "localhost"].includes(url.hostname)
        )
          return value;
        return `/api/stream?ticket=${issueTicket(url.pathname + url.search)}`;
      };
      const manifest = text
        .split("\n")
        .map((line) =>
          line.startsWith("#")
            ? line.replace(
                /URI="([^"]+)"/g,
                (_, uri) => `URI="${rewrite(uri)}"`,
              )
            : line.trim()
              ? rewrite(line.trim())
              : line,
        )
        .join("\n");
      res.removeHeader("Content-Length");
      res.end(manifest);
      return;
    }
    const stream = Readable.fromWeb(upstream.body);
    res.on("close", () => {
      controller.abort();
      stream.destroy();
    });
    stream.on("error", () => {
      if (!res.destroyed) res.destroy();
    });
    stream.pipe(res);
  } catch (error) {
    controller.abort();
    if (!res.headersSent) {
      res.statusCode = error.status || 502;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "Video is temporarily unavailable. Please try again.",
        }),
      );
    } else res.destroy();
  }
}
