import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { describeTracks, masterPlaylist, createEmbeddedTracks } from "./embeddedTracks.js";
import { issueTicket } from "./playback.js";

test("real container tracks retain their identity and language while unsupported bitmap captions are excluded", () => {
  const tracks = describeTracks({ format: { duration: "120" }, streams: [
    { index: 0, codec_type: "video", codec_name: "h264" },
    { index: 1, codec_type: "audio", codec_name: "aac", tags: { language: "tam" } },
    { index: 3, codec_type: "audio", codec_name: "aac", tags: { language: "hin" } },
    { index: 5, codec_type: "subtitle", codec_name: "mov_text", tags: { language: "eng" } },
    { index: 6, codec_type: "subtitle", codec_name: "hdmv_pgs_subtitle" },
  ] });
  assert.deepEqual(tracks.audio.map(({ index, language, name }) => ({ index, language, name })), [
    { index: 1, language: "ta", name: "Tamil" }, { index: 3, language: "hi", name: "Hindi" },
  ]);
  assert.equal(tracks.subtitles.length, 1);
  assert.equal(tracks.subtitles[0].name, "English");
  const manifest = masterPlaylist(tracks);
  assert.match(manifest, /LANGUAGE="hi".*URI="a1.m3u8"/);
  assert.match(manifest, /AUDIO="audio"/);
});

test("embedded media endpoints require valid, matching MP4 tickets", async (t) => {
  const handle = createEmbeddedTracks({ sdkUrl: "http://127.0.0.1:1", cacheDir: "/unused-for-invalid-tickets" });
  const server = http.createServer(async (req, res) => { await handle(req, res, new URL(req.url, "http://localhost")); });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const root = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(root + "/api/tracks?ticket=invalid")).status, 400);
  assert.equal((await fetch(root + "/api/tracks?ticket=" + issueTicket("/control"))).status, 400);
  const ticket = issueTicket("/resource.mp4?src=approved");
  assert.equal((await fetch(root + "/api/tracks/000000000000000000000000/master.m3u8?ticket=" + ticket)).status, 404);
});
