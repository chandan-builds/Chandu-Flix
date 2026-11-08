import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, Search, Star } from "lucide-react";
import discovery, { TMDB_IMAGE } from "../tmdb";
import "./Banner.css";

export default function Banner() {
  const [result, setResult] = useState({ loading: true, movies: [] });
  const [index, setIndex] = useState(0);
  const [retry, setRetry] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    const controller = new AbortController();
    fetch(discovery.fetchTrending, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Discovery unavailable");
        return response.json();
      })
      .then((data) => setResult({ movies: (data.results || []).filter((item) => item.poster_path && item.media_type !== "person").slice(0, 16) }))
      .catch((error) => { if (error.name !== "AbortError") setResult({ movies: [], error: true }); });
    return () => controller.abort();
  }, [retry]);
  const movie = result.movies[index];
  const search = (event) => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") || "").trim();
    if (q.length >= 2) navigate(`/search?${new URLSearchParams({ q })}`);
  };
  return (
    <>
      <header className="orbit-hero">
        <div className="poster-orbit" aria-hidden="true">
          {(result.movies.length ? result.movies : Array.from({ length: 12 }, (_, id) => ({ id }))).map((item, i) => (
            <div className={`orbit-poster orbit-poster-${i}`} key={item.id}>
              {item.poster_path && <img src={TMDB_IMAGE.thumbnail(item.poster_path)} alt="" width="150" height="225" loading={i < 6 ? "eager" : "lazy"} />}
            </div>
          ))}
        </div>
        <div className="orbit-copy">
          <span className="eyebrow">A LITTLE ESCAPE. A GREAT STORY.</span>
          <h1>Every story.<br />Your screen.<br /><em>Your escape.</em></h1>
          <p>From a movie night to one more episode.<br /> Find something you’ll love, and settle in.</p>
          <form className="hero-search" role="search" onSubmit={search}>
            <Search size={21} aria-hidden="true" />
            <input name="q" type="search" placeholder="What do you want to watch?" aria-label="Find a movie or series" required minLength={2} maxLength={120} />
            <button type="submit" aria-label="Search the streaming library"><ArrowUpRight size={22} /></button>
          </form>
          <div className="hero-suggestions">
            <Link to="/movies">Movie night <ArrowUpRight size={13} /></Link>
            <Link to="/tv-shows">One more episode</Link>
            <Link to="/movies?genre=Comedy">Something funny</Link>
          </div>
        </div>
        <span className="orbit-caption">CHANDUFLIX · YOUR OWN LITTLE CINEMA</span>
      </header>
      <section className="discovery-spotlight" aria-labelledby="discovery-heading">
        <div className="discovery-heading"><div><span className="eyebrow">THE BIG PICTURE</span><h2 id="discovery-heading">In the spotlight.</h2><p>Trending around the world. Find your next watch in the library.</p></div><span className="source-label">Discovery by TMDB</span></div>
        {movie ? <>
          <div className="coverflow" aria-label="Trending titles">
            {[-2, -1, 0, 1, 2].map((offset) => {
              const item = result.movies[(index + offset + result.movies.length) % result.movies.length];
              return <button key={offset} className={`coverflow-poster position-${offset + 2}`} aria-label={`Feature ${item.title || item.name}`} aria-pressed={offset === 0} onClick={() => setIndex((index + offset + result.movies.length) % result.movies.length)}>
                <img src={TMDB_IMAGE.poster(item.poster_path)} alt={item.title || item.name} loading="lazy" width="300" height="450" />
              </button>;
            })}
          </div>
          <div className="spotlight-info">
            <div className="spotlight-arrows"><button aria-label="Previous trending title" onClick={() => setIndex((index - 1 + result.movies.length) % result.movies.length)}><ChevronLeft /></button><span>{String(index + 1).padStart(2, "0")} / {result.movies.length}</span><button aria-label="Next trending title" onClick={() => setIndex((index + 1) % result.movies.length)}><ChevronRight /></button></div>
            <h3>{movie.title || movie.name}</h3>
            <p className="spotlight-meta">{(movie.release_date || movie.first_air_date || "").slice(0, 4)} <span>·</span> {movie.media_type === "tv" ? "Series" : "Movie"}{movie.vote_average > 0 && <> <span>·</span> <Star size={13} fill="currentColor" /> {movie.vote_average.toFixed(1)}</>}</p>
            <p className="spotlight-overview">{movie.overview || "Explore this title in the streaming library."}</p>
            <Link className="primary-button" to={`/search?${new URLSearchParams({ q: movie.title || movie.name })}`}>Find in library <ArrowUpRight size={17} /></Link>
          </div>
        </> : <div className="discovery-status" role="status"><p>{result.loading ? "Bringing the posters into focus…" : "Discovery is unavailable. Your streaming library is still below."}</p>{result.error && <button className="primary-button" onClick={() => setRetry((value) => value + 1)}>Retry discovery</button>}{!result.loading && !result.error && <Link to="/library">Browse the library</Link>}</div>}
      </section>
    </>
  );
}
