# Chandu-Flix

A responsive React/Vite cinema using the DeepCine Android media service and a compatible catalog adapter for native MP4/HLS playback. The old provider iframes, server selector, MovieBox proxy and download-page proxy have been removed.

## Features

- Movies, series, keyword search, genre filters, pagination, seasons and episodes.
- Play/pause, ten-second jumps, timeline, volume/mute, 0.5x–2x speed, fullscreen and browser-supported picture-in-picture.
- Available audio/subtitle choices, an in-player episode menu, next episode and locally saved progress.
- Responsive layouts and keyboard controls for touch, desktop and large screens.


## Preview

The original preview image predates this refactor. See the local app for the current design.

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

The replacement DeepCine app runs in an Android ARM64 container on an Oracle A1 VM. The native SDK is private on the VM's Docker network. For local development, forward local TCP port 17000 over SSH to the container's TCP port 7000, then run `npm run dev`. The Vite playback API uses that loopback connection by default. The public site needs the separate HTTPS relay described below.

Keyboard shortcuts: Space/K play or pause, left/right seek ten seconds, up/down adjust volume, M mute, F fullscreen, C captions. Focused player buttons support arrow-key navigation. Audio and subtitle menus reflect available sources and browser tracks; unavailable tracks are not fabricated. Embedded MP4 tracks that a browser does not expose cannot be selected there.

## Production relay and Vercel

The live Vercel site has not yet been updated. The Oracle VM runs the native SDK and `npm run relay` as systemd services. The Android app is launched and monitored by a separate watchdog. The relay binds only to VM loopback; a Caddy HTTPS reverse proxy is being prepared for Vercel. Android ADB and the SDK port must stay private.

The included `npm run relay` service binds to loopback port 8787 by default. It requires `BOXOFFICE_SDK_URL` (the internal native service), `BOXOFFICE_SDK_TOKEN` (a strong bearer token), and `PLAYBACK_SIGNING_SECRET` (a strong shared ticket secret). Set `PLAYER_ORIGIN` to the exact frontend origin. `RELAY_HOST` and `PORT` control binding. Deploy this behind HTTPS on a host that can reach the native runtime.

On Vercel, configure `BOXOFFICE_SDK_URL` and `BOXOFFICE_MEDIA_RELAY_URL` with the HTTPS relay address, and use the same `BOXOFFICE_SDK_TOKEN` and `PLAYBACK_SIGNING_SECRET`. These are server variables, never `VITE_` variables. Long video responses should go directly to the persistent relay. Missing production configuration produces an availability message.

`public/media-library.json` can also hold private MP4/HLS sources for legacy TMDB detail routes, keyed by `movie:<id>` or `tv:<id>:<season>:<episode>`.

## Checks

Run `npm test`, `npm run lint`, `npm run build`, and `npm audit`. See [integration evidence](docs/boxoffice-integration.md) for scope and verification limits.
