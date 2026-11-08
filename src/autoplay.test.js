import test from "node:test";
import assert from "node:assert/strict";
import { startAutomatically } from "./autoplay.js";

test("automatic playback keeps sound when the browser allows it", async () => {
  const video = { muted: false, play: async () => {} };
  assert.equal(await startAutomatically(video), "playing");
  assert.equal(video.muted, false);
});
test("a sound restriction falls back to muted playback", async () => {
  const video = { muted: false, play: async () => { if (!video.muted) throw { name: "NotAllowedError" }; } };
  assert.equal(await startAutomatically(video), "muted");
  assert.equal(video.muted, true);
});
test("source replacement does not mute playback, and complete blocking remains actionable", async () => {
  const changing = { muted: false, play: async () => { throw { name: "AbortError" }; } };
  assert.equal(await startAutomatically(changing), "deferred");
  assert.equal(changing.muted, false);
  const blocked = { play: async () => { throw { name: "NotAllowedError" }; } };
  assert.equal(await startAutomatically(blocked), "blocked");
});
