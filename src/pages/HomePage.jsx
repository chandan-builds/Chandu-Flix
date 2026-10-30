import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Banner from "../components/Banner";
import Row from "../components/Row";
import ContinueWatching from "../components/ContinueWatching";
import GenreChips from "../components/GenreChips";
import requests from "../libraryRequests";
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
          subtitle="The stories everyone is talking about"
          fetchUrl={requests.fetchTrending}
          isLargeRow
        />
        <Row
          title="Made for a movie night"
          subtitle="Big stories. Lasting impressions."
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
          title="Series to get lost in"
          subtitle="Find a new favorite"
          fetchUrl={requests.fetchTrendingTV}
          isLargeRow
        />
        <Row
          title="More to discover"
          subtitle="Find something unexpected"
          fetchUrl={requests.fetchBollywood}
        />
        <Row
          title="A little more adrenaline"
          subtitle="Action & adventure"
          fetchUrl={requests.fetchActionMovies}
        />
        <Row
          title="A world beyond ordinary"
          subtitle="Animation & imagination"
          fetchUrl={requests.fetchAnime}
          isLargeRow
        />
      </div>
    </main>
  );
}
