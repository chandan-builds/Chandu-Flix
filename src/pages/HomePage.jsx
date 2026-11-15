import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Banner from "../components/Banner";
import Row from "../components/Row";
import ContinueWatching from "../components/ContinueWatching";
import GenreChips from "../components/GenreChips";
import requests from "../tmdb";
export default function HomePage() {
  return (
    <main>
      <Banner />
      <div className="rows-container">
        <div className="collection-intro">
          <div>
            <span className="eyebrow">THE CHANDUFLIX COLLECTION</span>
            <h2>Find your kind of story.</h2>
          </div>
          <Link to="/movies">
            Explore all <ArrowUpRight size={17} />
          </Link>
        </div>
        <GenreChips />
        <ContinueWatching />
        <Row
          title="Trending now"
          fetchUrl={requests.fetchTrending}
          isLargeRow
        />
        <Row
          title="Top rated movies"
          fetchUrl={requests.fetchTopRated}
        />
        <div className="series-callout">
          <div>
            <span className="eyebrow">LET THE NEXT CHAPTER BEGIN</span>
            <h2>
              Your next obsession
              <br />
              is one episode away.
            </h2>
            <p>
              Explore new worlds, unforgettable characters, and series worth
              staying in for.
            </p>
            <Link to="/tv-shows" className="primary-button">
              Discover series <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="callout-type" aria-hidden="true">
            ONE
            <br />
            <span>MORE.</span>
          </div>
        </div>
        <Row
          title="Trending series"
          fetchUrl={requests.fetchTrendingTV}
          isLargeRow
        />
        <Row
          title="Bollywood"
          fetchUrl={requests.fetchBollywood}
        />
        <Row
          title="Action movies"
          fetchUrl={requests.fetchActionMovies}
        />
        <Row
          title="Anime"
          fetchUrl={requests.fetchAnime}
          isLargeRow
        />
      </div>
    </main>
  );
}
