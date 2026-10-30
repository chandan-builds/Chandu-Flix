# Boxoffice integration evidence

Reference: https://github.com/anumeetkumar/boxoffice/tree/main

The analyzed APK has SHA-256 `983170b637179f7c83eeeaf7cece6ce2cfb763e7e883c9a674615ad9d400c30f`. The copy pulled from the connected phone matched this artifact exactly. REA 6.7.0 with the checksum-verified JADX 0.7.1 provider indexed 42,488 classes. Focused decompilation used bounded package selections to avoid unrelated advertising libraries.

## Recovered flow

- `p9.a` declares the catalog POST routes; `p9.b` delegates request bodies.
- `n9.b.b` selects the API origin; `sa.b0` supplies application headers and signatures.
- `sa.e.x/y/A`, `em.f` and `em.a` establish request signing and response decoding.
- `/api/public/init` creates a synthetic guest session retained in server memory. The website does not use the phone's personal identity or user token.
- `CHANNELVIEWMODEL.S` supplies genre/type/page filters. `HOMECONTENTSEARCHLISTVIEWMODEL.x` supplies keyword search and pagination.
- `VideoPlayDetailActivity.getSignInfo` calls the native verification endpoint. `VIDEOPLAYDETAILVIEWMODEL.S0` submits the resulting proof to `/api/vod/info_new`.
- `sa.e.B` wraps sources through the SDK's MP4 or HLS resource endpoint. The web player uses signed media tickets and a range relay rather than third-party iframes.

The native verifier is called normally. No verification or server-side access check was patched. The phone's installed app and data were retained.

## Observations

- Phone SDK initialization succeeded on port 7000.
- Categories, popular searches, paginated listings, genres and keyword search returned decoded records.
- Title details succeeded with a synthetic guest session and native proof. Omitting that proof failed.
- The tested direct HTTPS origin request returned 403. Its native SDK request returned 206 and valid MP4 bytes.
- Beginning and end byte ranges succeeded through the website relay.
- The tested movie loaded in the browser with duration 9,593.67 seconds, width 1280 and readyState 4. Play/pause, ten-second seeking and speed controls were exercised.
- Breaking Bad Season 1 returned seven episodes and five season entries.

An initial temporary emulator failed because its 16 KB memory pages were incompatible with the APK's native library. It was stopped. The compatible-image download was cancelled when the user requested phone-only debugging; no further emulator work was performed.

## Limits

These observations cover sampled flows, not every title, codec, track or device. HLS support is implemented but has not been validated with a sampled HLS source. Audio/subtitle choices depend on what the source and browser expose.

## DeepCine replacement and Oracle test (30 October 2026)

The previous Boxoffice app expired. The replacement `DeepCine.apk` has SHA-256 `36425131ccb410320fbbbe5b180cec1aa552285ad7f9528693549271fc6c28733`, package `com.velvetreel.shorttv`, version 4.0.0, and the same named native media SDK libraries. Its catalog/search UI and local SDK service run in a ReDroid Android 12 ARM64 container on an Oracle Always Free A1 VM. A non-test-key Android fingerprint is required for the app to launch in that container.

The catalog adapter returned Jailer results with DeepCine's package name in the request headers. With DeepCine's SDK, the playback adapter returned Jailer metadata and a native MP4 source. The SDK served valid MP4 byte ranges at the start, middle and end of a 1.3 GB source. Through a temporary SSH tunnel, the local browser played Jailer at 1280-pixel video width with a 2:39:53 duration and working ten-second seek. Breaking Bad season 1 episode 2 played at 48:13; the in-player episode menu switched to episode 3, which played at 48:12. Both reported browser readyState 4. No phone was involved in these tests.

The DeepCine Android app's own detail player stalled on one full-stream request, while the website's range-based browser player worked. The native SDK truncated large and open-ended MP4 requests, so the relay now caps each media range at 1 MiB. The public HTTPS relay served a complete 1 MiB HTTP 206 response with the intended CORS origin. Vercel Production uses server-side Secret variables for the relay and signing keys. On the public site, Jailer played at 1280-pixel width with readyState 4 and a working ten-second jump. Breaking Bad season 1 episodes 2 and 3 played at 1277-pixel width with readyState 4; the in-player episode picker switched between them. No phone was connected for these tests. Sampled playback does not establish availability or rights for all titles, and startup may take several seconds while the browser fetches media ranges.
