import { Routes, Route, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MoviePage from './pages/MoviePage';
import TvShowPage from './pages/TvShowPage';
import SearchPage from './pages/SearchPage';
import BrowsePage from './pages/BrowsePage';
import './App.css';

// Key-wrapped wrappers to force recreation of component when id changes
const KeyedMoviePage = () => {
  const { id } = useParams();
  return <MoviePage key={id} />;
};

const KeyedTvShowPage = () => {
  const { id } = useParams();
  return <TvShowPage key={id} />;
};

function App() {
  return (
    <div className="app">
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movie/:id" element={<KeyedMoviePage />} />
        <Route path="/tv/:id" element={<KeyedTvShowPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/movies" element={<BrowsePage />} />
        <Route path="/tv-shows" element={<BrowsePage />} />
      </Routes>
      
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h2 className="footer-logo">CHANDUFLIX</h2>
            <p className="footer-tagline">Stream movies and TV shows for free. Unlimited entertainment, zero cost.</p>
          </div>
          <div className="footer-links">
            <div className="footer-link-group">
              <h4>Browse</h4>
              <a href="/movies">Movies</a>
              <a href="/tv-shows">TV Shows</a>
              <a href="/movies?genre=28">Action</a>
              <a href="/movies?genre=35">Comedy</a>
            </div>
            <div className="footer-link-group">
              <h4>Categories</h4>
              <a href="/movies?region=IN">Bollywood</a>
              <a href="/tv-shows?region=KR">K-Drama</a>
              <a href="/movies?genre=27">Horror</a>
              <a href="/movies?genre=878">Sci-Fi</a>
            </div>
            <div className="footer-link-group">
              <h4>Info</h4>
              <a href="/">Home</a>
              <a href="/search">Search</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Chandu-Flix © 2026 — All rights reserved</p>
          <p className="footer-disclaimer">This site does not store any files on its server. All contents are provided by non-affiliated third parties.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
