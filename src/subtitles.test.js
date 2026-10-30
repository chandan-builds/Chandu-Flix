import test from "node:test";
import assert from "node:assert/strict";
import { subtitleAsVtt } from "./subtitles.js";

test("local SRT captions become browser VTT captions", () => {
  const vtt = subtitleAsVtt("1\n00:00:01,200 --> 00:00:03,400\nHello");
  assert.match(vtt, /^WEBVTT\n\n1\n00:00:01\.200 --> 00:00:03\.400\nHello\n$/);
  assert.equal(subtitleAsVtt("WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHi\n"),
    "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHi\n");
  assert.throws(() => subtitleAsVtt("not subtitles"));
});
