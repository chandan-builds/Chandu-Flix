// Browser policy can require muted playback even after a title link is opened.
export async function startAutomatically(element) {
  try {
    await element.play();
    return "playing";
  } catch (error) {
    if (error.name === "AbortError") return "deferred";
    if (error.name !== "NotAllowedError") return "blocked";
    element.muted = true;
    try {
      await element.play();
      return "muted";
    } catch {
      return "blocked";
    }
  }
}
