import Banner from '../components/Banner';
import Row from '../components/Row';
import ContinueWatching from '../components/ContinueWatching';
import GenreChips from '../components/GenreChips';
import requests from '../tmdb';

const HomePage = () => {
  return (
    <>
      <Banner />
      
      <div className="rows-container">
        <GenreChips />
        <ContinueWatching />
        <Row title="Featured Exclusives" fetchUrl={requests.fetchNetflixOriginals} isLargeRow />
        <Row title="Trending This Week" fetchUrl={requests.fetchTrending} />
        <Row title="🎬 Now Playing in Theaters" fetchUrl={requests.fetchNowPlaying} />
        <Row title="🔜 Upcoming Movies" fetchUrl={requests.fetchUpcoming} />
        <Row title="Top Rated Masterpieces" fetchUrl={requests.fetchTopRated} />
        <Row title="📺 Trending TV Shows" fetchUrl={requests.fetchTrendingTV} />
        <Row title="⭐ Top Rated TV" fetchUrl={requests.fetchTopRatedTV} />
        <Row title="Action & Adventure" fetchUrl={requests.fetchActionMovies} />
        <Row title="Comedy Specials" fetchUrl={requests.fetchComedyMovies} />
        <Row title="🇮🇳 Bollywood Hits" fetchUrl={requests.fetchBollywood} />
        <Row title="🇰🇷 Korean Drama" fetchUrl={requests.fetchKoreanDrama} />
        <Row title="🎌 Anime" fetchUrl={requests.fetchAnime} />
        <Row title="Horror & Thrillers" fetchUrl={requests.fetchHorrorMovies} />
        <Row title="🔪 Thriller" fetchUrl={requests.fetchThriller} />
        <Row title="🔫 Crime" fetchUrl={requests.fetchCrime} />
        <Row title="Romance" fetchUrl={requests.fetchRomanceMovies} />
        <Row title="Sci-Fi & Fantasy" fetchUrl={requests.fetchSciFi} />
        <Row title="⚔️ War & Military" fetchUrl={requests.fetchWar} />
        <Row title="🔍 Mystery" fetchUrl={requests.fetchMystery} />
        <Row title="👨‍👩‍👧‍👦 Family" fetchUrl={requests.fetchFamily} />
        <Row title="Animation" fetchUrl={requests.fetchAnimation} />
        <Row title="Documentaries" fetchUrl={requests.fetchDocumentaries} />
      </div>
    </>
  );
};

export default HomePage;
