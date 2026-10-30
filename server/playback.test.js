import test from "node:test";
import assert from "node:assert/strict";
import { issueTicket, verifyTicket, playbackRequest } from "./playback.js";
import { normalizeTitle } from "./boxoffice.js";

test("stream tickets authenticate the native resource and reject tampering and expiry", () => {
  const path = "/resource.mp4?src=approved-source";
  assert.equal(verifyTicket(issueTicket(path)), path);
  assert.throws(() => verifyTicket(issueTicket(path) + "x"));
  assert.throws(() => verifyTicket(issueTicket(path, Date.now() - 1)));
  assert.throws(() => verifyTicket(issueTicket("//external.example/resource")));
});
test("invalid selections and missing runtime fail before creating an upstream session", async () => {
  await assert.rejects(
    playbackRequest(
      new URLSearchParams("id=invalid"),
      "http://127.0.0.1:17000",
    ),
    (error) => error.status === 400,
  );
  await assert.rejects(
    playbackRequest(new URLSearchParams("id=1"), null),
    (error) => error.status === 503,
  );
});
test("movie and season catalog records retain their source identities and media types", () => {
  assert.equal(
    normalizeTitle({ vod_id: 17, vod_name: "Film", type_pid: 1 }).id,
    "bo-17",
  );
  assert.equal(
    normalizeTitle({ id: 27, vod_name: "Season 2", type_pid: 2 }).media_type,
    "tv",
  );
  assert.equal(normalizeTitle({ id: -2, vod_name: "Invalid" }), null);
});
