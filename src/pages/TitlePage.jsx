import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Play, Star, Clock } from "lucide-react";
import {
  fetchMovieDetails,
  fetchTvDetails,
  fetchTvSeason,
  TMDB_IMAGE,
} from "../tmdb";
import NativePlayer from "../components/NativePlayer";
import "./TitlePage.css";

export default function TitlePage({ mediaType }) {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const season = Math.max(1, Number(params.get("season")) || 1);
  const episode = Math.max(1, Number(params.get("episode")) || 1);
  const [details, setDetails] = useState(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [episodesError, setEpisodesError] = useState(false);
  useEffect(() => {
    let active = true;
    window.scrollTo(0, 0);
    (mediaType === "tv" ? fetchTvDetails(id) : fetchMovieDetails(id))
      .then((data) => {
        if (active) {
          if (data.success === false) setFailed(true);
          else setDetails(data);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [id, mediaType]);
  useEffect(() => {
    if (mediaType !== "tv") return;
    let active = true;
    fetchTvSeason(id, season)
      .then((data) => {
        if (active) {
          setEpisodes(data.episodes || []);
          setEpisodesError(data.success === false);
        }
      })
      .catch(() => {
        if (active) {
          setEpisodes([]);
          setEpisodesError(true);
        }
      });
    return () => {
      active = false;
    };
  }, [id, season, mediaType]);
  if (failed)
    return (
      <main className="detail-page">
        <div className="player-empty">
          <h1>Unable to load this title</h1>
          <p>Please try again later.</p>
          <Link to="/">Back to home</Link>
        </div>
      </main>
    );
  if (!details)
    return (
      <main className="detail-page">
        <div className="player-empty" role="status">
          <div className="loading-spinner" />
          <p>Loading title…</p>
        </div>
      </main>
    );
  const title = details.title || details.name;
  const current = episodes.find((item) => item.episode_number === episode);
  const seasons =
    details.seasons?.filter((item) => item.season_number > 0) || [];
  return (
    <main className="detail-page">
      <Link
        className="back-link"
        to={mediaType === "tv" ? "/tv-shows" : "/movies"}
      >
        <ArrowLeft size={18} /> Back to explore
      </Link>
      {playing ? (
        <NativePlayer
          key={`${mediaType}:${id}:${season}:${episode}`}
          mediaType={mediaType}
          id={id}
          season={season}
          episode={episode}
          title={
            mediaType === "tv" ? `${title} · S${season} E${episode}` : title
          }
          poster_path={details.poster_path}
          backdrop_path={details.backdrop_path}
        />
      ) : (
        <section
          className="detail-hero"
          style={{
            backgroundImage: `linear-gradient(90deg, #0c0e12 0%, #0c0e12dd 35%, #0c0e1222 100%), url(${TMDB_IMAGE.backdrop(details.backdrop_path)})`,
          }}
        >
          <div className="detail-copy">
            <span className="eyebrow">
              {mediaType === "tv"
                ? "THE SERIES COLLECTION"
                : "THE MOVIE COLLECTION"}
            </span>
            <h1>{title}</h1>
            <div className="detail-meta">
              {details.vote_average > 0 && (
                <span className="rating">
                  <Star size={15} fill="currentColor" />{" "}
                  {details.vote_average.toFixed(1)}
                </span>
              )}
              <span>
                {(details.release_date || details.first_air_date || "").slice(
                  0,
                  4,
                )}
              </span>
              {details.runtime > 0 && (
                <span>
                  <Clock size={14} /> {details.runtime} min
                </span>
              )}
              {details.number_of_seasons > 0 && (
                <span>{details.number_of_seasons} seasons</span>
              )}
            </div>
            <p className="detail-genres">
              {details.genres?.map((item) => item.name).join(" / ")}
            </p>
            <p className="detail-overview">{details.overview}</p>
            <button className="primary-button" onClick={() => setPlaying(true)}>
              <Play size={18} fill="currentColor" />{" "}
              {mediaType === "tv"
                ? `Watch S${season} E${episode}`
                : "Watch movie"}
            </button>
          </div>
        </section>
      )}
      {mediaType === "tv" && (
        <section className="detail-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ONE MORE EPISODE</span>
              <h2>Episodes</h2>
            </div>
            <label className="season-label">
              Season{" "}
              <select
                value={season}
                onChange={(event) => {
                  setParams({ season: event.target.value, episode: "1" });
                  setPlaying(false);
                }}
              >
                {seasons.map((item) => (
                  <option key={item.id} value={item.season_number}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {episodesError && (
            <p role="status">
              Episodes could not be loaded. Please try again later.
            </p>
          )}
          {!episodesError && episodes.length === 0 && (
            <p role="status">No episodes available for this season.</p>
          )}
          {playing && current && (
            <p className="now-playing">
              Selected: E{episode} · {current.name}
            </p>
          )}
          <div className="episodes-grid">
            {episodes.map((item) => (
              <button
                key={item.id}
                className={`episode-tile ${episode === item.episode_number ? "selected" : ""}`}
                onClick={() => {
                  setParams({
                    season: String(season),
                    episode: String(item.episode_number),
                  });
                  setPlaying(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {item.still_path && (
                  <img
                    src={TMDB_IMAGE.thumbnail(item.still_path)}
                    alt=""
                    loading="lazy"
                  />
                )}
                <div>
                  <span className="eyebrow">
                    EPISODE {item.episode_number}
                    {item.runtime ? ` · ${item.runtime} MIN` : ""}
                  </span>
                  <h3>{item.name}</h3>
                  <p>{item.overview || "Episode description coming soon."}</p>
                </div>
                <Play size={18} />
              </button>
            ))}
          </div>
        </section>
      )}
      {details.credits?.cast?.length > 0 && (
        <section className="detail-section">
          <span className="eyebrow">IN FRONT OF THE CAMERA</span>
          <h2>The cast</h2>
          <div className="people-row">
            {details.credits.cast.slice(0, 10).map((person) => (
              <div className="person" key={person.id}>
                {person.profile_path ? (
                  <img
                    src={TMDB_IMAGE.profile(person.profile_path)}
                    alt={person.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="person-placeholder" />
                )}
                <strong>{person.name}</strong>
                <span>{person.character}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {details.similar?.results?.length > 0 && (
        <section className="detail-section">
          <span className="eyebrow">KEEP EXPLORING</span>
          <h2>More like this</h2>
          <div className="recommendations">
            {details.similar.results.slice(0, 6).map((item) => (
              <Link key={item.id} to={`/${mediaType}/${item.id}`}>
                {item.poster_path && (
                  <img
                    src={TMDB_IMAGE.poster(item.poster_path)}
                    alt=""
                    loading="lazy"
                  />
                )}
                <strong>{item.title || item.name}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
