import { useEffect, useState } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { Star, SlidersHorizontal } from "lucide-react";
import {
  discoverMovies,
  discoverTV,
  TMDB_IMAGE,
  MOVIE_GENRES,
  TV_GENRES,
} from "../tmdb";
import "./BrowsePage.css";
function Collection({ isTV, genre, region, sort }) {
  const [result, setResult] = useState({
    items: [],
    loading: true,
    page: 0,
    total: 1,
  });
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const getContent = isTV ? discoverTV : discoverMovies;
    getContent({ genre, region, sortBy: sort, page, signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setResult((previous) => ({
          items:
            page === 1
              ? data.results || []
              : [
                  ...new Map(
                    [...previous.items, ...(data.results || [])].map((item) => [
                      item.id,
                      item,
                    ]),
                  ).values(),
                ],
          page,
          total: Math.min(data.total_pages || 1, 500),
        }));
      })
      .catch((error) => {
        if (error.name !== "AbortError")
          setResult((previous) => ({
            ...previous,
            loading: false,
            error: true,
          }));
      });
    return () => controller.abort();
  }, [isTV, genre, region, sort, page, retry]);
  if (result.loading)
    return (
      <div className="browse-loading" role="status">
        <div className="loading-spinner" />
        <p>Loading collection…</p>
      </div>
    );
  return (
    <>
      {result.error && (
        <div className="row-error" role="alert">
          <p>This collection couldn't be loaded.</p>
          <button
            className="row-retry-btn"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      )}
      {!result.error && !result.items.length && (
        <div className="browse-empty">
          <p>No titles found. Try another genre.</p>
        </div>
      )}
      <div className="browse-grid">
        {result.items.map((item) => (
          <Link
            key={item.id}
            className="browse-card"
            to={`/${isTV ? "tv" : "movie"}/${item.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="browse-card-img-wrap">
              {item.poster_path ? (
                <img
                  className="browse-card-img"
                  src={TMDB_IMAGE.poster(item.poster_path)}
                  alt={item.title || item.name}
                  loading="lazy"
                />
              ) : (
                <div className="poster-placeholder">
                  {item.title || item.name}
                </div>
              )}
              {item.vote_average > 0 && (
                <div className="browse-card-rating">
                  <Star size={11} fill="#eac883" stroke="#eac883" />
                  {item.vote_average.toFixed(1)}
                </div>
              )}
            </div>
            <div className="browse-card-info">
              <strong className="browse-card-title">
                {item.title || item.name}
              </strong>
              <span className="browse-card-year">
                {(item.release_date || item.first_air_date || "").slice(0, 4)}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {result.page < result.total && (
        <div className="browse-load-more">
          <button
            className="browse-load-more-btn"
            disabled={page > result.page && !result.error}
            onClick={() => setPage((value) => value + 1)}
          >
            {page > result.page && !result.error ? "Loading…" : "Load more"}
          </button>
          <span className="browse-page-info">
            Page {result.page} of {result.total}
          </span>
        </div>
      )}
    </>
  );
}
export default function BrowsePage() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const isTV = location.pathname === "/tv-shows";
  const genre = params.get("genre") || "";
  const region = params.get("region") || "";
  const sort = params.get("sort") || "popularity.desc";
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };
  return (
    <main className="browse-page">
      <span className="eyebrow">THE COLLECTION</span>
      <div className="browse-header">
        <h1 className="browse-title">
          {isTV ? "Series worth staying in for." : "Make it a movie night."}
        </h1>
        <div className="browse-sort">
          <SlidersHorizontal size={16} />
          <select
            className="browse-sort-select"
            aria-label="Sort titles"
            value={sort}
            onChange={(event) => update("sort", event.target.value)}
          >
            {[
              ["popularity.desc", "Most popular"],
              ["vote_average.desc", "Highest rated"],
              ["primary_release_date.desc", "Newest first"],
              ["primary_release_date.asc", "Oldest first"],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="browse-genres" aria-label="Filter by genre">
        <button
          className={`browse-genre-chip ${!genre ? "active" : ""}`}
          onClick={() => update("genre", "")}
        >
          All genres
        </button>
        {(isTV ? TV_GENRES : MOVIE_GENRES).map((item) => (
          <button
            key={item.id}
            className={`browse-genre-chip ${String(item.id) === genre ? "active" : ""}`}
            onClick={() => update("genre", String(item.id))}
          >
            {item.name}
          </button>
        ))}
      </div>
      <Collection
        key={`${isTV}:${genre}:${region}:${sort}`}
        isTV={isTV}
        genre={genre}
        region={region}
        sort={sort}
      />
    </main>
  );
}
