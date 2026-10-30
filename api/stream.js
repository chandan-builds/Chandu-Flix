import { streamRequest } from "../server/playback.js";
export const config = { maxDuration: 300 };
export default async function handler(req, res) {
  return streamRequest(req, res);
}
