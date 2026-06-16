import { Routes, Route, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MoviePage from './pages/MoviePage';
import TvShowPage from './pages/TvShowPage';
import SearchPage from './pages/SearchPage';
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
      </Routes>
      
      <footer className="footer">
        <p>Chandu-Flix © 2026</p>
      </footer>
    </div>
  );
}

export default App;
