import { playbackRequest } from "../server/playback.js";
export const config = { maxDuration: 30 };
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Cache-Control", "private, no-store");
  try {
    return res
      .status(200)
      .json(
        await playbackRequest(
          new URL(req.url, "http://localhost").searchParams,
        ),
      );
  } catch (error) {
    return res
      .status(error.status || 502)
      .json({
        error: "Playback is temporarily unavailable. Please try again later.",
      });
  }
}
