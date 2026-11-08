import http from "node:http";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile, readdir, stat, rm, statfs } from "node:fs/promises";
import { join } from "node:path";
import { fetchCompleteMp4Chunk, verifyTicket } from "./playback.js";

const languages = { eng: "en", hin: "hi", tam: "ta", tel: "te", mal: "ml", kan: "kn", kor: "ko", jpn: "ja", chi: "zh", zho: "zh", spa: "es", fra: "fr", fre: "fr", por: "pt" };
const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
export function describeTracks(probe) {
  const label = (stream, index) => {
    const language = languages[stream.tags?.language] || stream.tags?.language || "und";
    let name;
    try { name = languageNames.of(language); } catch { name = language; }
    return { index: stream.index, language, name: stream.tags?.title || (language === "und" ? `Track ${index + 1}` : name), codec: stream.codec_name, default: Boolean(stream.disposition?.default) };
  };
  return {
    duration: Number(probe.format?.duration),
    video: probe.streams?.find((stream) => stream.codec_type === "video"),
    audio: (probe.streams || []).filter((stream) => stream.codec_type === "audio").map(label),
    subtitles: (probe.streams || []).filter((stream) => stream.codec_type === "subtitle" && ["mov_text", "subrip", "webvtt", "ass", "ssa"].includes(stream.codec_name)).map(label),
  };
}
const quoted = (text) => String(text).replace(/["\r\n]/g, "");
export function masterPlaylist(tracks) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:7", "#EXT-X-INDEPENDENT-SEGMENTS"];
  tracks.audio.forEach((track, index) => lines.push(`#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="${quoted(track.name)}",LANGUAGE="${quoted(track.language)}",DEFAULT=${index === 0 ? "YES" : "NO"},AUTOSELECT=YES,URI="a${index}.m3u8"`));
  lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${Math.max(1000000, Number(tracks.video?.bit_rate) || 5000000)}${tracks.audio.length ? ',AUDIO="audio"' : ""}`, "v.m3u8");
  return lines.join("\n") + "\n";
}

function run(command, args, timeout, signal) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], signal });
    let output = "", errors = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    child.stdout.on("data", (data) => { if (output.length < 2 ** 20) output += data; });
    child.stderr.on("data", (data) => { errors = (errors + data).slice(-4000); });
    child.once("error", reject);
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else reject(new Error(`${command} could not prepare this source (${code}): ${errors.slice(-500)}`));
    });
  });
}
async function directoryBytes(path) {
  let bytes = 0;
  for (const entry of await readdir(path, { withFileTypes: true }).catch(() => [])) {
    const file = join(path, entry.name);
    bytes += entry.isDirectory() ? await directoryBytes(file) : (await stat(file)).size;
  }
  return bytes;
}

// Only the persistent Oracle relay runs this service. Vercel never runs FFmpeg.
export function createEmbeddedTracks({ sdkUrl, cacheDir }) {
  const jobs = new Map();
  let inputServer, inputOrigin, inputReady, active = 0;
  const maxBytes = 8 * 1024 ** 3;
  async function chunk(job, start, end, signal) {
    const result = await fetchCompleteMp4Chunk(new URL(job.path, sdkUrl), { Range: `bytes=${start}-${end}` }, signal);
    const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(result.response.headers.get("content-range") || "");
    if (!range || Number(range[1]) !== start || Number(range[2]) !== start + result.body.length - 1)
      throw new Error("Native media range did not match the requested bytes");
    job.size = Number(range[3]);
    return result.body;
  }
  async function startInputServer() {
    if (inputOrigin) return;
    if (inputReady) return inputReady;
    inputReady = new Promise((resolve, reject) => {
    inputServer = http.createServer(async (req, res) => {
      const job = jobs.get(req.url.slice(1));
      if (!job || !["GET", "HEAD"].includes(req.method)) { res.writeHead(404).end(); return; }
      const controller = new AbortController();
      res.once("close", () => controller.abort());
      try {
        if (!job.size) await chunk(job, 0, 65535, controller.signal);
        const range = req.headers.range && /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
        if (req.headers.range && !range) { res.writeHead(416).end(); return; }
        const start = range ? Number(range[1]) : 0;
        const end = range?.[2] ? Math.min(Number(range[2]), job.size - 1) : job.size - 1;
        if (!Number.isSafeInteger(start) || start > end || start < 0) { res.writeHead(416).end(); return; }
        res.statusCode = range ? 206 : 200;
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", end - start + 1);
        if (range) res.setHeader("Content-Range", `bytes ${start}-${end}/${job.size}`);
        if (req.method === "HEAD") { res.end(); return; }
        for (let position = start; position <= end;) {
          const bytes = await chunk(job, position, Math.min(end, position + 1024 * 1024 - 1), controller.signal);
          if (!res.write(bytes)) await once(res, "drain", { signal: controller.signal });
          position += bytes.length;
        }
        res.end();
      } catch { if (!res.headersSent) res.writeHead(502); res.destroy(); }
    });
    inputServer.listen(0, "127.0.0.1");
    inputServer.once("error", reject);
    inputServer.once("listening", () => { inputOrigin = `http://127.0.0.1:${inputServer.address().port}`; resolve(); });
    });
    return inputReady;
  }
  async function cleanup() {
    await mkdir(cacheDir, { recursive: true, mode: 0o700 });
    const entries = [];
    for (const name of await readdir(cacheDir)) {
      if (!/^[a-f0-9]{24}$/.test(name) || ["preparing", "probing"].includes(jobs.get(name)?.state)) continue;
      const dir = join(cacheDir, name), info = await stat(dir);
      entries.push({ name, dir, touched: jobs.get(name)?.touched || info.mtimeMs, size: await directoryBytes(dir) });
    }
    let total = entries.reduce((sum, entry) => sum + entry.size, 0);
    for (const entry of entries.sort((a, b) => a.touched - b.touched)) {
      if (Date.now() - entry.touched < 5 * 60 * 1000) continue;
      if (total < maxBytes / 2 && Date.now() - entry.touched < 60 * 60 * 1000) continue;
      await rm(entry.dir, { recursive: true, force: true }); jobs.delete(entry.name); total -= entry.size;
    }
    const disk = await statfs(cacheDir);
    if (disk.bavail * disk.bsize < 4 * 1024 ** 3) throw new Error("Not enough temporary media space");
  }
  async function prepare(job) {
    active++;
    const controller = new AbortController();
    let monitor;
    try {
      await cleanup();
      await mkdir(job.dir, { recursive: true, mode: 0o700 });
      await startInputServer();
      const input = `${inputOrigin}/${job.id}`;
      const probe = JSON.parse(await run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", input], 60000, controller.signal));
      job.tracks = describeTracks(probe);
      if (!job.tracks.video || !Number.isFinite(job.tracks.duration) || job.tracks.duration <= 0) throw new Error("No usable embedded tracks");
      if (job.tracks.audio.length < 2 && !job.tracks.subtitles.length) { job.state = "original"; return; }
      if (job.tracks.audio.length > 12 || job.tracks.subtitles.length > 12) throw new Error("Too many embedded tracks for this runtime");
      job.state = "preparing";
      const args = ["-nostdin", "-hide_banner", "-loglevel", "error", "-i", input];
      const output = (name) => ["-f", "hls", "-hls_time", "6", "-hls_playlist_type", "vod", "-hls_segment_type", "fmp4", "-hls_flags", "independent_segments", "-hls_fmp4_init_filename", `${name}-init.mp4`, "-hls_segment_filename", join(job.dir, `${name}-%06d.m4s`), join(job.dir, `${name}.m3u8`)];
      args.push("-map", `0:${job.tracks.video.index}`, "-an", "-sn", "-c:v", "copy", ...output("v"));
      job.tracks.audio.forEach((track, index) => args.push("-map", `0:${track.index}`, "-vn", "-sn", "-c:a", track.codec === "aac" ? "copy" : "aac", ...output(`a${index}`)));
      job.tracks.subtitles.forEach((track, index) => args.push("-map", `0:${track.index}`, "-vn", "-an", "-c:s", "webvtt", "-f", "webvtt", join(job.dir, `s${index}.vtt`)));
      monitor = setInterval(async () => {
        try {
          const disk = await statfs(cacheDir);
          if (await directoryBytes(job.dir) > maxBytes / 2 || await directoryBytes(cacheDir) > maxBytes || disk.bavail * disk.bsize < 2 * 1024 ** 3) controller.abort();
        } catch { controller.abort(); }
      }, 10000);
      await run("ffmpeg", args, 12 * 60 * 1000, controller.signal);
      await writeFile(join(job.dir, "master.m3u8"), masterPlaylist(job.tracks));
      await writeFile(join(job.dir, "tracks.json"), JSON.stringify(job.tracks));
      job.state = "ready";
    } catch (error) {
      job.state = "unavailable"; job.error = error.message;
      console.warn("Embedded tracks unavailable:", error.message.replace(/https?:\/\/\S+/g, "[media]"));
      await rm(job.dir, { recursive: true, force: true }).catch(() => {});
    } finally { clearInterval(monitor); active--; }
  }
  return async function handle(req, res, url) {
    if (!url.pathname.startsWith("/api/tracks")) return false;
    if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405).end(); return true; }
    try {
      const ticket = url.searchParams.get("ticket"), path = verifyTicket(ticket);
      if (!path.startsWith("/resource.mp4?")) throw Object.assign(new Error("Not an MP4 resource"), { status: 400 });
      const id = createHash("sha256").update(path).digest("hex").slice(0, 24);
      let job = jobs.get(id);
      if (url.pathname === "/api/tracks") {
        if (!job) {
          if (active >= 2) { res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end('{"state":"queued"}'); return true; }
          job = { id, path, dir: join(cacheDir, id), state: "probing", touched: Date.now() }; jobs.set(id, job);
          const saved = await readFile(join(job.dir, "tracks.json"), "utf8").catch(() => null);
          try {
            if (saved) { job.tracks = JSON.parse(saved); job.state = "ready"; }
          } catch { /* An interrupted cache write is prepared again. */ }
          if (job.state !== "ready") void prepare(job);
        }
        job.touched = Date.now();
        const root = `/api/tracks/${id}/`, suffix = `?ticket=${encodeURIComponent(ticket)}`;
        const source = job.state === "ready" ? { type: "hls", url: root + "master.m3u8" + suffix, subtitles: job.tracks.subtitles.map((track, index) => ({ url: root + `s${index}.vtt` + suffix, language: track.language, label: track.name })) } : undefined;
        res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify({ state: job.state, audio: job.tracks?.audio, subtitles: job.tracks?.subtitles, source }));
        return true;
      }
      const match = /^\/api\/tracks\/([a-f0-9]{24})\/([a-z0-9_-]+\.(m3u8|m4s|mp4|vtt))$/.exec(url.pathname);
      if (!match || match[1] !== id || !job || job.state !== "ready") throw Object.assign(new Error("Tracks not ready"), { status: 404 });
      job.touched = Date.now();
      const file = join(job.dir, match[2]);
      const contentType = { m3u8: "application/vnd.apple.mpegurl", m4s: "video/mp4", mp4: "video/mp4", vtt: "text/vtt; charset=utf-8" }[match[3]];
      res.setHeader("Content-Type", contentType); res.setHeader("Cache-Control", "private, max-age=300");
      if (match[3] === "m3u8") {
        const suffix = `?ticket=${encodeURIComponent(ticket)}`;
        const text = (await readFile(file, "utf8")).split("\n").map((line) => line.startsWith("#") ? line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${uri}${suffix}"`) : line.trim() ? line.trim() + suffix : line).join("\n");
        res.end(req.method === "HEAD" ? undefined : text);
      } else {
        res.setHeader("Content-Length", (await stat(file)).size);
        if (req.method === "HEAD") res.end(); else createReadStream(file).on("error", () => res.destroy()).pipe(res);
      }
      return true;
    } catch (error) {
      res.writeHead(error.status || 500, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Embedded tracks are unavailable for this source." }));
      return true;
    }
  };
}
