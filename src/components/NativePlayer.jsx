import { useEffect, useState } from "react";
import { findMedia } from "../mediaLibrary";
import MediaPlayer from "./MediaPlayer";
export default function NativePlayer({ source, ...props }) {
  const { mediaType, id, season, episode } = props;
  const [result, setResult] = useState({ loading: true });
  useEffect(() => {
    if (source) return;
    const controller = new AbortController();
    findMedia({ mediaType, id, season, episode }, controller.signal)
      .then((media) => setResult({ media }))
      .catch((error) => {
        if (error.name !== "AbortError")
          setResult({
            error: "The video library is unavailable. Please try again later.",
          });
      });
    return () => controller.abort();
  }, [source, mediaType, id, season, episode]);
  const media = source || result.media;
  if (!source && result.loading)
    return (
      <div className="player-empty" role="status">
        <div className="loading-spinner" />
        <p>Loading your video…</p>
      </div>
    );
  if (!media)
    return (
      <div className="player-empty" role="status">
        <span className="eyebrow">CHANDUFLIX CINEMA</span>
        <h2>Not available to stream yet</h2>
        <p>
          {result.error ||
            "This title is in the discovery catalog. A video source has not been added to the library yet."}
        </p>
      </div>
    );
  return <MediaPlayer key={media.url} source={media} {...props} />;
}
