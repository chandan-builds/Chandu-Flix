import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import requests from "../libraryRequests";
import { TMDB_IMAGE } from "../tmdb";
import "./Banner.css";
export default function Banner() {
  const [result, setResult] = useState({ loading: true, movies: [] });
  const [index, setIndex] = useState(0);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(requests.fetchTrending, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json();
      })
      .then((data) =>
        setResult({
          movies: (data.results || [])
            .filter(
              (item) => item.backdrop_path && item.media_type !== "person",
            )
            .slice(0, 5),
        }),
      )
      .catch((error) => {
        if (error.name !== "AbortError") setResult({ movies: [], error: true });
      });
    return () => controller.abort();
  }, [retry]);
  const movie = result.movies[index];
  if (!movie)
    return (
      <header className="cinema-hero hero-placeholder">
        <div>
          <span className="eyebrow">YOUR NEXT GREAT WATCH</span>
          <h1>
            A world of stories.
            <br />
            One place to explore.
          </h1>
          <p>
            {result.loading
              ? "Finding something worth watching…"
              : "The catalog is taking a moment. Try again in a little while."}
          </p>
          {!result.loading && (
            <button
              className="primary-button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again
            </button>
          )}
        </div>
      </header>
    );
  const path =
    movie.provider === "boxoffice"
      ? `/library/${movie.id}`
      : `/${movie.media_type === "tv" ? "tv" : "movie"}/${movie.id}`;
  return (
    <header
      className="cinema-hero"
      style={{
        backgroundImage: `url(${TMDB_IMAGE.backdrop(movie.backdrop_path)})`,
      }}
    >
      <div className="hero-shade" />
      <div className="hero-copy" key={movie.id}>
        <span className="eyebrow hero-eyebrow">
          <span /> IN THE SPOTLIGHT
        </span>
        <h1>{movie.title || movie.name}</h1>
        <div className="hero-meta">
          <span className="hero-rating">
            <Star size={14} fill="currentColor" />{" "}
            {movie.vote_average?.toFixed(1)}
          </span>
          <span>
            {(movie.release_date || movie.first_air_date || "").slice(0, 4)}
          </span>
          <span className="hero-type">
            {movie.media_type === "tv" ? "SERIES" : "MOVIE"}
          </span>
          <span className="hero-trending">Popular in the library</span>
        </div>
        <p>{movie.overview}</p>
        <div className="hero-actions">
          <Link className="primary-button" to={path}>
            Explore title <ArrowUpRight size={19} />
          </Link>
          <Link className="hero-secondary" to="/movies">
            Browse the collection
          </Link>
        </div>
      </div>
      <div className="hero-bottom">
        <span className="hero-note">GREAT STORIES. EVERY SCREEN.</span>
        <div className="hero-controls">
          <span className="hero-counter">
            0{index + 1}
            <span> / 0{result.movies.length}</span>
          </span>
          <button
            onClick={() =>
              setIndex(
                (index - 1 + result.movies.length) % result.movies.length,
              )
            }
            aria-label="Previous featured title"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setIndex((index + 1) % result.movies.length)}
            aria-label="Next featured title"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
