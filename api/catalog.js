import { catalogRequest } from "../server/boxoffice.js";
export const config = { maxDuration: 15 };
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const result = await catalogRequest(
      new URL(req.url, "http://localhost").searchParams,
    );
    if (result.status)
      return res.status(result.status).json({ error: result.error });
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=300",
    );
    return res.status(200).json(result);
  } catch {
    return res
      .status(502)
      .json({
        error:
          "The library is temporarily unavailable. Please try again later.",
      });
  }
}
