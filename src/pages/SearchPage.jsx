import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { searchMulti, TMDB_IMAGE } from "../tmdb";
import "./SearchPage.css";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const typeFilter = searchParams.get("type") || "all";

  const [draft, setDraft] = useState({ query, value: query });
  const inputValue = draft.query === query ? draft.value : query;
  const key = JSON.stringify([query, typeFilter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  return (
    <div className="search-page">
      {/* Search Header */}
      <div className="search-page-header">
        <form className="search-page-form" onSubmit={handleSubmit}>
          <Search size={20} className="search-page-icon" />
          <input
            type="text"
            placeholder="Search movies and TV shows..."
            value={inputValue}
            onChange={(e) => setDraft({ query, value: e.target.value })}
            className="search-page-input"
            autoFocus
          />
        </form>

        {query && (
          <div className="search-tabs">
            <button
              className={`search-tab ${typeFilter === "all" ? "active" : ""}`}
              onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
            >
              All
            </button>
            <button
              className={`search-tab ${typeFilter === "movie" ? "active" : ""}`}
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(query)}&type=movie`)
              }
            >
              Movies
            </button>
            <button
              className={`search-tab ${typeFilter === "tv" ? "active" : ""}`}
              onClick={() =>
                navigate(`/search?q=${encodeURIComponent(query)}&type=tv`)
              }
            >
              TV Shows
            </button>
          </div>
        )}
      </div>

      {query ? <Results key={key} query={query} type={typeFilter} /> : (
        <div className="search-empty">
          <h2>Search movies and series</h2>
        </div>
      )}
    </div>
  );
};

function Results({ query, type }) {
  const [result, setResult] = useState({ items: [], page: 0, total: 1 });
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const loading = result.page < page && !result.error;

  useEffect(() => {
    const controller = new AbortController();
    searchMulti(query, { type, page, signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        const incoming = (data.results || []).flatMap((item) => {
          const mediaType = type === "all" ? item.media_type : type;
          return ["movie", "tv"].includes(mediaType) ? [{ ...item, media_type: mediaType }] : [];
        });
        setResult((previous) => ({
          items: [...new Map([...previous.items, ...incoming].map((item) => [`${item.media_type}:${item.id}`, item])).values()],
          page,
          total: Math.min(data.total_pages || 1, 500),
        }));
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult((previous) => ({ ...previous, error: true }));
      });
    return () => controller.abort();
  }, [query, type, page, retry]);

  const results = result.items;
  return (
    <>
      {result.error && <div className="row-error" role="alert">
        <p>Search results could not be loaded.</p>
        <button className="row-retry-btn" onClick={() => {
          setResult((current) => ({ ...current, error: false }));
          setRetry((value) => value + 1);
        }}>Try again</button>
      </div>}
      {!result.error && !loading && !results.length && (
        <div className="search-empty"><h2>No results for “{query}”</h2></div>
      )}
      {results.length > 0 && (
        <div className="search-results-grid">
          {results.map((item) => (
            <Link
              key={`${item.media_type}:${item.id}`}
              className="search-result-card"
              to={`/${item.media_type}/${item.id}`}
            >
              {item.poster_path || item.backdrop_path ? (
                <img
                  src={
                    TMDB_IMAGE.poster(item.poster_path) ||
                    TMDB_IMAGE.thumbnail(item.backdrop_path)
                  }
                  alt={item.title || item.name}
                  className="search-card-poster"
                  loading="lazy"
                />
              ) : (
                <div className="search-card-placeholder" />
              )}
              <div className="search-card-info">
                <span className="search-card-title">
                  {item.title || item.name}
                </span>
                <div className="search-card-meta">
                  <span className="search-card-type">
                    {item.media_type === "tv" ? "TV Series" : "Movie"}
                  </span>
                  {item.vote_average > 0 && (
                    <span className="search-card-rating">
                      ★ {item.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                {(item.release_date || item.first_air_date) && (
                  <span className="search-card-year">
                    {(item.release_date || item.first_air_date).split("-")[0]}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      {loading && <div className="search-loading" role="status" aria-label="Loading results"><div className="loading-spinner" /></div>}
      {!loading && !result.error && result.page < result.total && (
        <div className="browse-load-more">
          <button className="browse-load-more-btn" onClick={() => setPage((value) => value + 1)}>Load more</button>
        </div>
      )}
    </>
  );
}

export default SearchPage;
