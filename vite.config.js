import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { catalogRequest } from "./server/boxoffice.js";
import { playbackRequest, streamRequest } from "./server/playback.js";
const catalogPlugin = {
  name: "local-catalog-api",
  configureServer(server) {
    const sdkUrl = process.env.BOXOFFICE_SDK_URL || "http://127.0.0.1:17000";
    server.middlewares.use("/api/stream", (req, res) =>
      streamRequest(req, res, sdkUrl),
    );
    server.middlewares.use("/api/playback", async (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "private, no-store");
      if (req.method !== "GET") {
        res.statusCode = 405;
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }
      try {
        const data = await playbackRequest(
          new URL(req.url, "http://localhost").searchParams,
          sdkUrl,
        );
        res.statusCode = 200;
        res.end(JSON.stringify(data));
      } catch (error) {
        res.statusCode = error.status || 502;
        res.end(
          JSON.stringify({
            error:
              "Playback is temporarily unavailable. Please try again later.",
          }),
        );
      }
    });
    server.middlewares.use("/api/catalog", async (req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.method !== "GET") {
        res.statusCode = 405;
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }
      try {
        const data = await catalogRequest(
          new URL(req.url, "http://localhost").searchParams,
        );
        res.statusCode = data.status || 200;
        res.end(JSON.stringify(data));
      } catch {
        res.statusCode = 502;
        res.end(
          JSON.stringify({
            error:
              "The library is temporarily unavailable. Please try again later.",
          }),
        );
      }
    });
  },
};
export default defineConfig({
  plugins: [react(), catalogPlugin],
  server: {
    proxy: {
      "/tmdb": {
        target: "https://api.tmdb.org/3",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tmdb/, ""),
        secure: true,
      },
    },
  },
});
