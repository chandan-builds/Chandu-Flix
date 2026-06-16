import Banner from '../components/Banner';
import Row from '../components/Row';
import ContinueWatching from '../components/ContinueWatching';
import requests from '../tmdb';

const HomePage = () => {
  return (
    <>
      <Banner />
      
      <div className="rows-container">
        <ContinueWatching />
        <Row title="Featured Exclusives" fetchUrl={requests.fetchNetflixOriginals} isLargeRow />
        <Row title="Trending This Week" fetchUrl={requests.fetchTrending} />
        <Row title="Top Rated Masterpieces" fetchUrl={requests.fetchTopRated} />
        <Row title="Action & Adventure" fetchUrl={requests.fetchActionMovies} />
        <Row title="Comedy Specials" fetchUrl={requests.fetchComedyMovies} />
        <Row title="Horror & Thrillers" fetchUrl={requests.fetchHorrorMovies} />
        <Row title="Romance" fetchUrl={requests.fetchRomanceMovies} />
        <Row title="Sci-Fi & Fantasy" fetchUrl={requests.fetchSciFi} />
        <Row title="Animation" fetchUrl={requests.fetchAnimation} />
        <Row title="Documentaries" fetchUrl={requests.fetchDocumentaries} />
      </div>
    </>
  );
};

export default HomePage;
