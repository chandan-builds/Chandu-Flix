import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { ArrowLeft, Play, Search, Star } from "lucide-react";
import NativePlayer from "../components/NativePlayer";
import "./BrowsePage.css";
import "./TitlePage.css";

export default function LibraryPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [input, setInput] = useState(query);
  const initial = location.state?.item;
  const [result, setResult] = useState({
    items: initial ? [initial] : [],
    loading: !initial,
  });
  const [playing, setPlaying] = useState(false);
  const [retry, setRetry] = useState(0);
  const fixedType =
    location.pathname === "/movies"
      ? "movie"
      : location.pathname === "/tv-shows"
        ? "tv"
        : null;
  const type = fixedType || params.get("type") || "all";
  const genre = params.get("genre") || "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const catalogKey = `${type}:${genre}:${query}`;
  const audio = params.get("audio") || "0";
  useEffect(() => {
    const controller = new AbortController();
    const listQuery = new URLSearchParams({
      view: query ? "search" : type !== "all" ? "browse" : "popular",
      page: String(page),
    });
    if (query) listQuery.set("q", query);
    if (type !== "all") listQuery.set("type", type);
    if (genre) listQuery.set("genre", genre);
    const endpoint = id
      ? `/api/playback?id=${encodeURIComponent(id)}&audio=${encodeURIComponent(audio)}`
      : `/api/catalog?${listQuery}`;
    fetch(endpoint, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Library unavailable");
        return response.json();
      })
      .then((data) =>
        setResult((previous) =>
          id
            ? {
                items: [data.title],
                episodes: data.episodes || [],
                audioOptions: data.audioOptions || [],
                audioType: data.audioType,
                seasons: data.seasons || [],
                audioKey: audio,
              }
            : {
                items:
                  page > 1 && previous.key === catalogKey
                    ? [
                        ...new Map(
                          [...previous.items, ...(data.results || [])].map(
                            (item) => [item.id, item],
                          ),
                        ).values(),
                      ]
                    : data.results || [],
                key: catalogKey,
                page,
                hasMore: data.hasMore,
              },
        ),
      )
      .catch((error) => {
        if (error.name !== "AbortError")
          setResult((previous) => ({
            ...previous,
            loading: false,
            error: true,
          }));
      });
    return () => controller.abort();
  }, [query, retry, id, audio, type, genre, page, catalogKey]);
  const submit = (event) => {
    event.preventDefault();
    if (input.trim().length === 1) return;
    setResult({ items: [], loading: true });
    setParams({ q: input.trim() });
  };
  const item = id ? result.items.find((item) => item.id === id) : null;
  const episodeId =
    Number(params.get("episode")) || result.episodes?.[0]?.id || 1;
  const currentEpisode =
    result.audioKey === audio
      ? result.episodes?.find((item) => item.id === episodeId) ||
        result.episodes?.[0]
      : null;
  if (id)
    return (
      <main className="detail-page">
        <Link className="back-link" to="/library">
          <ArrowLeft size={18} /> Back to library
        </Link>
        {item ? (
          <>
            {playing && currentEpisode ? (
              <NativePlayer
                key={`${item.id}:${audio}:${currentEpisode.id}`}
                mediaType={item.media_type}
                id={item.id}
                season={1}
                episode={currentEpisode.id}
                source={currentEpisode.source}
                audioOptions={result.audioOptions || []}
                audioValue={
                  audio === "0" ? String(result.audioType || 1) : audio
                }
                onAudioChange={(value) => {
                  const next = new URLSearchParams(params);
                  next.set("audio", value);
                  setParams(next);
                }}
                episodes={result.episodes || []}
                episodeValue={currentEpisode.id}
                onEpisodeChange={(value) => {
                  const next = new URLSearchParams(params);
                  next.set("episode", String(value));
                  setParams(next);
                  setPlaying(true);
                }}
                title={item.title}
                poster_path={item.poster_path}
              />
            ) : playing ? (
              <div className="player-empty" role="status">
                <div className="loading-spinner" />
                <p>
                  {result.error
                    ? "Playback is temporarily unavailable."
                    : "Loading your selection…"}
                </p>
                {result.error && (
                  <button
                    className="primary-button"
                    onClick={() => setRetry((value) => value + 1)}
                  >
                    Try again
                  </button>
                )}
              </div>
            ) : (
              <section className="library-detail">
                <img src={item.poster_path || undefined} alt="" />
                <div>
                  <span className="eyebrow">FROM THE LIBRARY</span>
                  <h1>{item.title}</h1>
                  <div className="detail-meta">
                    <span>
                      {(item.release_date || item.first_air_date || "").slice(
                        0,
                        4,
                      )}
                    </span>
                    <span>{item.media_type === "tv" ? "Series" : "Movie"}</span>
                    {item.vote_average > 0 && (
                      <span className="rating">
                        <Star size={15} fill="currentColor" />
                        {item.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {item.language && (
                    <p className="detail-genres">{item.language}</p>
                  )}
                  {item.overview && (
                    <p className="detail-overview">{item.overview}</p>
                  )}
                  <button
                    className="primary-button"
                    disabled={!currentEpisode}
                    onClick={() => setPlaying(true)}
                  >
                    <Play size={18} />{" "}
                    {currentEpisode
                      ? "Watch now"
                      : result.error
                        ? "Playback unavailable"
                        : "Loading playback…"}
                  </button>
                  {result.error && (
                    <p className="library-note" role="status">
                      Playback is temporarily unavailable.{" "}
                      <button
                        className="row-retry-btn"
                        onClick={() => setRetry((value) => value + 1)}
                      >
                        Try again
                      </button>
                    </p>
                  )}
                </div>
              </section>
            )}
            {result.audioOptions?.length > 1 && (
              <label className="season-label">
                Audio{" "}
                <select
                  value={audio === "0" ? String(result.audioType || 1) : audio}
                  onChange={(event) => {
                    const next = new URLSearchParams(params);
                    next.set("audio", event.target.value);
                    setParams(next);
                    setPlaying(false);
                  }}
                >
                  {result.audioOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {result.seasons?.length > 1 && (
              <label className="season-label library-season">
                Season{" "}
                <select
                  aria-label="Select season"
                  value={item.sourceId}
                  onChange={(event) =>
                    navigate(`/library/bo-${event.target.value}`)
                  }
                >
                  {result.seasons.map((season) => (
                    <option key={season.vod_id} value={season.vod_id}>
                      {season.series}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {result.episodes?.length > 1 && (
              <section className="detail-section">
                <h2>Episodes</h2>
                <div className="library-episodes">
                  {result.episodes.map((episode) => (
                    <button
                      className={`episode-tile ${currentEpisode?.id === episode.id ? "selected" : ""}`}
                      key={episode.id}
                      onClick={() => {
                        const next = new URLSearchParams(params);
                        next.set("episode", String(episode.id));
                        setParams(next);
                        setPlaying(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <Play size={16} />
                      <span>Episode {episode.title}</span>
                      <span>{episode.duration}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="player-empty" role="status">
            <h1>{result.loading ? "Loading title…" : "Title unavailable"}</h1>
            <p>
              {result.loading
                ? "Finding this title in the library."
                : "This title could not be retrieved. Return to the library to search again."}
            </p>
          </div>
        )}
      </main>
    );
  const visible = result.items.filter(
    (item) => type === "all" || item.media_type === type,
  );
  return (
    <main className="browse-page">
      <span className="eyebrow">FRESH FROM THE CATALOG</span>
      <div className="browse-header">
        <h1 className="browse-title">
          {fixedType === "movie"
            ? "Make it a movie night."
            : fixedType === "tv"
              ? "Your next great series."
              : "More stories to discover."}
        </h1>
        <form className="library-search" onSubmit={submit}>
          <Search size={17} />
          <input
            aria-label="Search the library"
            placeholder="Search the library…"
            maxLength={120}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>
      <div className="browse-genres">
        {!fixedType &&
          [
            ["all", "All stories"],
            ["movie", "Movies"],
            ["tv", "Series"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`browse-genre-chip ${type === value ? "active" : ""}`}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("type", value);
                next.delete("page");
                setParams(next);
              }}
            >
              {label}
            </button>
          ))}
        {fixedType &&
          [
            ["", "All genres"],
            ["Adventure", "Adventure"],
            ["Comedy", "Comedy"],
            ["Drama", "Drama"],
            ["Horror", "Horror"],
            ["Animation", "Animation"],
            ["Romance", "Romance"],
            ["Crime", "Crime"],
            ["Science Fiction", "Sci-fi"],
            ["Documentary", "Documentary"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`browse-genre-chip ${genre === value ? "active" : ""}`}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("genre", value);
                next.delete("page");
                setParams(next);
              }}
            >
              {label}
            </button>
          ))}
      </div>
      {result.loading || (!result.error && result.key !== catalogKey) ? (
        <div className="browse-loading" role="status">
          <div className="loading-spinner" />
          <p>Loading library…</p>
        </div>
      ) : result.error ? (
        <div className="row-error" role="alert">
          <p>The library is temporarily unavailable.</p>
          <button
            className="row-retry-btn"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <p className="library-note">
            {query
              ? `Results for “${query}”`
              : fixedType
                ? "Explore the collection"
                : "Popular searches"}{" "}
            · Catalog listings do not confirm streaming availability.
          </p>
          {!visible.length && (
            <div className="browse-empty">
              No titles found. Try another search.
            </div>
          )}
          <div className="browse-grid">
            {visible.map((item) => (
              <Link
                className="browse-card"
                key={item.id}
                to={`/library/${item.id}?q=${encodeURIComponent(item.title)}`}
                state={{ item }}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <div className="browse-card-img-wrap">
                  {item.poster_path ? (
                    <img
                      className="browse-card-img"
                      src={item.poster_path}
                      alt={item.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="poster-placeholder">{item.title}</div>
                  )}
                </div>
                <div className="browse-card-info">
                  <strong className="browse-card-title">{item.title}</strong>
                  <span className="browse-card-year">
                    {(item.release_date || item.first_air_date || "").slice(
                      0,
                      4,
                    )}{" "}
                    · {item.media_type === "tv" ? "Series" : "Movie"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {result.hasMore && (
            <div className="browse-load-more">
              <button
                className="browse-load-more-btn"
                disabled={result.page !== page}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set("page", String(page + 1));
                  setParams(next);
                }}
              >
                {result.page !== page ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
