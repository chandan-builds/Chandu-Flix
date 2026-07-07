/**
 * No-op dev plugin — download is now handled client-side via popup.
 * This file is kept for vite.config.js compatibility.
 */
export function downloadApiPlugin() {
  return {
    name: 'download-api-plugin',
    configureServer() {
      // No server middleware needed — downloads open in a popup
      // on the real domain (02moviedownloader.site)
    },
  };
}
