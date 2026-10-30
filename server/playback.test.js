import test from "node:test";
import assert from "node:assert/strict";
import { issueTicket, verifyTicket, playbackRequest, limitMediaRange, fetchCompleteMp4Chunk } from "./playback.js";
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
test("MP4 ranges stay small enough for the native service to finish", () => {
  assert.equal(limitMediaRange(undefined), "bytes=0-1048575");
  assert.equal(limitMediaRange("bytes=0-"), "bytes=0-1048575");
  assert.equal(limitMediaRange("bytes=100-200"), "bytes=100-200");
  assert.equal(limitMediaRange("bytes=100-9999999"), "bytes=100-1048675");
  assert.equal(limitMediaRange("bytes=-2000000"), "bytes=-1048576");
  assert.throws(() => limitMediaRange("bytes=0-3,5-8"), (error) => error.status === 416);
});

test("an incomplete native MP4 chunk is retried before it reaches the viewer", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    return new Response(calls === 1 ? "abc" : "abcd", {
      status: 206,
      headers: { "content-length": "4", "content-range": "bytes 0-3/100" },
    });
  };
  const { body } = await fetchCompleteMp4Chunk(
    new URL("http://localhost/resource.mp4"),
    { Range: "bytes=0-3" },
    new AbortController().signal,
    fetchImpl,
  );
  assert.equal(body.toString(), "abcd");
  assert.equal(calls, 2);
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
