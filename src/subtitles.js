export function subtitleAsVtt(input) {
  const text = input.replace(/^\uFEFF/, "").trim();
  if (/^WEBVTT(?:\s|$)/.test(text)) return `${text}\n`;
  if (!/\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/.test(text))
    throw new Error("Choose a valid SRT or VTT subtitle file.");
  return `WEBVTT\n\n${text.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")}\n`;
}
