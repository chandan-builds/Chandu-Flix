import { useEffect, useState } from "react";
import { findMedia } from "../mediaLibrary";
import MediaPlayer from "./MediaPlayer";

export default function NativePlayer({ source, ...props }) {
  if (source) return <MediaPlayer key={source.url} source={source} {...props} />;
  return <DiscoveredPlayer key={JSON.stringify([props.mediaType, props.id, props.season, props.episode])} {...props} />;
}

function DiscoveredPlayer({ mediaType, id, season, episode, imdbId, releaseYear, title, ...props }) {
  const [result, setResult] = useState({ loading: true, sources: [] });
  const [selected, setSelected] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ type: mediaType, id, season, episode });
    if (imdbId) query.set("imdb", imdbId);
    if (title && releaseYear) {
      query.set("title", title);
      query.set("year", releaseYear);
    }
    const remote = fetch(`/api/sources?${query}`, { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error("Stream provider unavailable");
      return response.json();
    });
    Promise.allSettled([findMedia({ mediaType, id, season, episode }, controller.signal), remote])
      .then(([local, provider]) => {
        if (controller.signal.aborted) return;
        const sources = [];
        if (local.status === "fulfilled" && local.value)
          sources.push({ ...local.value, name: local.value.name || "My library" });
        if (provider.status === "fulfilled")
          sources.push(...provider.value.sources.filter((item) => !sources.some((existing) => existing.url === item.url)));
        setResult({ sources, error: local.status === "rejected" || provider.status === "rejected" });
      });
    return () => controller.abort();
  }, [mediaType, id, season, episode, imdbId, title, releaseYear, attempt]);

  const reload = () => {
    setSelected(0);
    setResult({ loading: true, sources: [] });
    setAttempt((value) => value + 1);
  };
  const media = result.sources[selected];
  if (!media) return (
    <div className="player-empty" role="status">
      {result.loading ? <>
        <div className="loading-spinner" />
        <p>Finding video sources…</p>
      </> : <>
        <h2>{result.error ? "Unable to check stream availability" : "No stream available for this title"}</h2>
        {result.error && <button className="primary-button" onClick={reload}>Try again</button>}
      </>}
    </div>
  );
  if (media.type === "embed") {
    return (
      <section className="embed-player" aria-label="Embedded video player">
        <label>
          Server
          <select value={selected} onChange={(event) => setSelected(Number(event.target.value))}>
            {result.sources.map((source, index) => (
              <option key={source.url} value={index}>
                {source.name}{source.quality ? ` · ${source.quality}` : ""}
              </option>
            ))}
          </select>
        </label>
        <iframe
          key={media.url}
          src={media.url}
          title={`${title} on ${media.name}`}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </section>
    );
  }
  return <MediaPlayer
    key={media.url}
    source={media}
    title={title}
    mediaType={mediaType}
    id={id}
    season={season}
    episode={episode}
    servers={result.sources}
    serverValue={selected}
    onServerChange={setSelected}
    onRefreshSources={reload}
    {...props}
  />;
}
