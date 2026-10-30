import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import { configuredSDK, streamRequest } from "./playback.js";

// Run alongside a reachable Android SDK runtime. This does not launch an APK,
// publish a tunnel, change a phone, or expose a network port by default.
const sdkUrl = configuredSDK();
const accessToken = process.env.BOXOFFICE_SDK_TOKEN;
if (!sdkUrl || !accessToken || !process.env.PLAYBACK_SIGNING_SECRET) {
  throw new Error(
    "Set BOXOFFICE_SDK_URL, BOXOFFICE_SDK_TOKEN and PLAYBACK_SIGNING_SECRET before starting the relay.",
  );
}
const expected = Buffer.from(`Bearer ${accessToken}`);
const server = http.createServer(async (req, res) => {
  const requestOrigin = req.headers.origin;
  if (
    process.env.PLAYER_ORIGIN &&
    requestOrigin === process.env.PLAYER_ORIGIN
  ) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Range");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Range, Accept-Ranges",
    );
  }
  const url = new URL(req.url, "http://localhost");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (url.pathname === "/health") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ready: true }));
    return;
  }
  if (url.pathname === "/api/stream") {
    await streamRequest(req, res, sdkUrl);
    return;
  }
  if (url.pathname !== "/control" || req.method !== "GET") {
    res.statusCode = 404;
    res.end();
    return;
  }
  const supplied = Buffer.from(req.headers.authorization || "");
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    res.statusCode = 401;
    res.end();
    return;
  }
  const device = url.searchParams.get("device_id") || "";
  const timestamp = url.searchParams.get("ts") || "";
  if (
    url.searchParams.get("msg") !== "verify" ||
    !/^[a-zA-Z0-9]{16,80}$/.test(device) ||
    !/^\d{13}$/.test(timestamp) ||
    Math.abs(Date.now() - Number(timestamp)) > 60000
  ) {
    res.statusCode = 400;
    res.end();
    return;
  }
  const target = new URL("/control", sdkUrl);
  target.search = new URLSearchParams({
    msg: "verify",
    device_id: device,
    ts: timestamp,
  }).toString();
  try {
    const response = await fetch(target, { signal: AbortSignal.timeout(5000) });
    const text = (await response.text()).trim();
    if (!response.ok || !/^[a-f0-9]{32}$/i.test(text))
      throw new Error("SDK unavailable");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", "text/plain");
    res.end(text);
  } catch {
    res.statusCode = 502;
    res.end("SDK unavailable");
  }
});
const host = process.env.RELAY_HOST || "127.0.0.1";
const port = Number(process.env.PORT) || 8787;
server.listen(port, host, () =>
  console.log(`ChanduFlix relay listening on ${host}:${port}`),
);
