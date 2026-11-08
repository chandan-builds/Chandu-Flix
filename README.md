# Chandu-Flix

A responsive React/Vite cinema using the BoxOffice Android media service and a compatible catalog adapter for native MP4/HLS playback. The catalog uses BoxOffice's working API version `50000`.

## Features

- Movies, series, keyword search, genre filters, pagination, seasons and episodes.
- Play/pause, ten-second jumps, timeline, volume/mute, 0.5x–2x speed, fullscreen and browser-supported picture-in-picture.
- Controls fade during playback in the page and fullscreen; pointer, touch or keyboard activity reveals them.
- Buffering status and automatic retries for incomplete native MP4 chunks or a failed player load.
- Available audio/subtitle choices, local SRT/VTT subtitle loading, an in-player episode menu, next episode and locally saved progress.
- Responsive layouts and keyboard controls for touch, desktop and large screens.


## Preview

The current production site is [chandu-flix.vercel.app](https://chandu-flix.vercel.app).

## Local Development

To run the project locally:

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`.

## Development playback

The modified BoxOffice app (`com.fvvcl.flickverse.tv`) runs in the `boxoffice-runtime` Android ARM64 container on an Oracle A1 VM. The native SDK is private on the VM's Docker network. For local development, forward local TCP port 17000 over SSH to the container's TCP port 7000, then run `npm run dev`. The Vite playback API uses that loopback connection by default. The public site needs the separate HTTPS relay described below.

Keyboard shortcuts: Space/K play or pause, left/right seek ten seconds, up/down adjust volume, M mute, F fullscreen, C captions. Focused player buttons support arrow-key navigation. Audio and subtitle menus reflect available sources and browser tracks; unavailable tracks are not fabricated. Embedded MP4 tracks that a browser does not expose cannot be selected there.

Embedded MP4 audio and text subtitles are discovered on Oracle with FFprobe, then prepared as an HLS video/audio bundle and WebVTT subtitles using FFmpeg. The video is copied without re-encoding; AAC audio is copied and other audio codecs are converted to AAC. Original playback stays available while preparation runs once for that source. The player then preserves position/play state and exposes the real embedded languages. Language selection is remembered in this browser. Text subtitle formats are supported; bitmap captions requiring OCR are not fabricated. Local SRT/VTT loading remains available.

First preparation downloads and remuxes the complete source and can take several minutes. Prepared sources are cached on Oracle; normal viewing and seeking then use complete VOD playlists. The relay limits concurrent preparation to two jobs, checks temporary cache/disk use and evicts inactive cached sources. It needs `ffmpeg` and `ffprobe` on its PATH and a writable `TRACK_CACHE_DIR` (default `/var/lib/chanduflix/tracks`). The systemd deployment uses `StateDirectory=chanduflix` to keep writes scoped to that directory. All track metadata, playlists, segments and subtitle files require the existing signed playback ticket; the FFmpeg input bridge is loopback-only.

## Production relay and Vercel

The live Vercel site uses the Oracle VM's native SDK and `npm run relay` systemd service. `boxoffice-watch.service` starts and monitors BoxOffice inside the ARM64 Android container, so playback does not depend on a phone. Its script and unit are in `server/boxoffice-watch.*`. DeepCine was uninstalled and its hosted APK and watchdog removed. The relay binds only to VM loopback; Caddy serves it at `https://140-238-231-247.sslip.io`. Only SSH and HTTP/HTTPS are open to the VM. Android ADB and the native SDK port remain private.

The included `npm run relay` service binds to loopback port 8787 by default. It requires `BOXOFFICE_SDK_URL` (the internal native service), `BOXOFFICE_SDK_TOKEN` (a strong bearer token), and `PLAYBACK_SIGNING_SECRET` (a strong shared ticket secret). Set `PLAYER_ORIGIN` to the exact frontend origin. `RELAY_HOST` and `PORT` control binding. Deploy this behind HTTPS on a host that can reach the native runtime.

Vercel Production has `BOXOFFICE_SDK_URL` and `BOXOFFICE_MEDIA_RELAY_URL` set to the HTTPS relay origin, plus matching `BOXOFFICE_SDK_TOKEN` and `PLAYBACK_SIGNING_SECRET` as server-side Secret variables. Never use `VITE_` variables for these secrets. Long video responses go directly to the persistent relay. The relay caps MP4 byte ranges at 1 MiB because the native SDK truncated larger responses in testing. Missing production configuration produces an availability message.

`public/media-library.json` can also hold private MP4/HLS sources for legacy TMDB detail routes, keyed by `movie:<id>` or `tv:<id>:<season>:<episode>`.

## Checks

Run `npm test`, `npm run lint`, `npm run build`, and `npm audit`. See [integration evidence](docs/boxoffice-integration.md) for scope and verification limits.
