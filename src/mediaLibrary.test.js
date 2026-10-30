import test from "node:test";
import assert from "node:assert/strict";
import { selectMedia } from "./mediaLibrary.js";

test("movie and episode IDs select exact resources, never a title search fallback", () => {
  const library = {
    "movie:42": { type: "mp4", url: "https://media.example/movie.mp4" },
    "tv:42:2:3": { type: "hls", url: "https://media.example/episode.m3u8" },
  };
  assert.equal(
    selectMedia(library, { mediaType: "movie", id: "42" }).url,
    library["movie:42"].url,
  );
  assert.equal(
    selectMedia(library, { mediaType: "tv", id: 42, season: 2, episode: 3 })
      .url,
    library["tv:42:2:3"].url,
  );
  assert.equal(
    selectMedia(library, { mediaType: "tv", id: 42, season: 2, episode: 4 }),
    null,
  );
});

test("unavailable and malformed resources cannot become playable sources", () => {
  for (const media of [
    null,
    {},
    { type: "iframe", url: "https://embed.example" },
    { type: "mp4", url: "javascript:alert(1)" },
    { type: "mp4", url: "http://media.example/insecure.mp4" },
  ]) {
    assert.equal(
      selectMedia({ "movie:1": media }, { mediaType: "movie", id: 1 }),
      null,
    );
  }
});

test("malformed subtitles do not break playback and invalid tracks are dropped", () => {
  const selection = { mediaType: "movie", id: 1 };
  const source = {
    type: "mp4",
    url: "https://media.example/video.mp4",
    subtitles: "invalid",
  };
  assert.deepEqual(selectMedia({ "movie:1": source }, selection).subtitles, []);
  source.subtitles = [
    null,
    { url: "http://media.example/no.vtt", language: "en", label: "English" },
    { url: "https://media.example/en.vtt", language: "en", label: "English" },
  ];
  assert.equal(
    selectMedia({ "movie:1": source }, selection).subtitles.length,
    1,
  );
});
