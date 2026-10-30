import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play, RefreshCw } from "lucide-react";
import { TMDB_IMAGE } from "../tmdb";
import "./Row.css";
export default function Row({ title, subtitle, fetchUrl, isLargeRow = false }) {
  const [result, setResult] = useState({ loading: true, items: [] });
  const [retry, setRetry] = useState(0);
  const rowRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    const controller = new AbortController();
    fetch(fetchUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json();
      })
      .then((data) =>
        setResult({
          items: (data.results || []).filter(
            (item) => item.media_type !== "person",
          ),
        }),
      )
      .catch((error) => {
        if (error.name !== "AbortError") setResult({ items: [], error: true });
      });
    return () => controller.abort();
  }, [fetchUrl, retry]);
  const scroll = (direction) =>
    rowRef.current?.scrollBy({
      left: direction * rowRef.current.clientWidth,
      behavior: "smooth",
    });
  return (
    <section className="row">
      <h2>{title}</h2>
      {subtitle && <p className="row-subtitle">{subtitle}</p>}
      {result.loading ? (
        <div
          className="row-posters"
          role="status"
          aria-label={`Loading ${title}`}
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div
              className={`row-poster-container ${isLargeRow ? "large" : ""}`}
              key={index}
            >
              <div
                className={`row-skeleton-img ${isLargeRow ? "large" : ""}`}
              />
            </div>
          ))}
        </div>
      ) : result.error || !result.items.length ? (
        <div className="row-error">
          <p>Couldn't load this collection.</p>
          <button
            className="row-retry-btn"
            onClick={() => setRetry((value) => value + 1)}
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      ) : (
        <div className="row-wrapper">
          <button
            className="slider-arrow left"
            aria-label={`Scroll ${title} left`}
            onClick={() => scroll(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="row-posters" ref={rowRef}>
            {result.items.map((movie) => {
              const image = isLargeRow
                ? TMDB_IMAGE.poster(movie.poster_path)
                : TMDB_IMAGE.thumbnail(
                    movie.backdrop_path || movie.poster_path,
                  );
              if (!image) return null;
              const name = movie.title || movie.name;
              const type =
                movie.media_type || (movie.first_air_date ? "tv" : "movie");
              const destination =
                movie.provider === "boxoffice"
                  ? `/library/${movie.id}?q=${encodeURIComponent(movie.title || movie.name)}`
                  : `/${type}/${movie.id}`;
              return (
                <div
                  key={`${type}:${movie.id}`}
                  className={`row-poster-container ${isLargeRow ? "large" : ""}`}
                  role="link"
                  tabIndex={0}
                  aria-label={`Explore ${name}`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter")
                      navigate(destination, { state: { item: movie } });
                  }}
                  onClick={() =>
                    navigate(destination, { state: { item: movie } })
                  }
                >
                  <img
                    className={`row-poster ${isLargeRow ? "row-posterLarge" : ""}`}
                    src={image}
                    alt={name}
                    loading="lazy"
                  />
                  <div className="poster-overlay">
                    <div className="overlay-play">
                      <Play fill="white" size={20} />
                    </div>
                  </div>
                  <div className="card-caption">
                    <strong>{name}</strong>
                    <span>
                      {(movie.release_date || movie.first_air_date || "").slice(
                        0,
                        4,
                      )}{" "}
                      <span>· {type === "tv" ? "Series" : "Movie"}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className="slider-arrow right"
            aria-label={`Scroll ${title} right`}
            onClick={() => scroll(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  );
}
