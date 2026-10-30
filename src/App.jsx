import { Routes, Route, useParams, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import TitlePage from "./pages/TitlePage";
import LibraryPage from "./pages/LibraryPage";
import "./App.css";
function DetailRoute({ mediaType }) {
  const { id } = useParams();
  if (id?.startsWith("bo-")) return <LibraryPage key={id} />;
  return <TitlePage key={`${mediaType}:${id}`} mediaType={mediaType} />;
}
function LibraryDetailRoute() {
  const { id } = useParams();
  return <LibraryPage key={id} />;
}
export default function App() {
  return (
    <div className="app">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <Navbar />
      <div id="content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/movie/:id"
            element={<DetailRoute mediaType="movie" />}
          />
          <Route path="/tv/:id" element={<DetailRoute mediaType="tv" />} />
          <Route path="/search" element={<LibraryPage key="search" />} />
          <Route path="/library" element={<LibraryPage key="library" />} />
          <Route path="/library/:id" element={<LibraryDetailRoute />} />
          <Route path="/movies" element={<LibraryPage key="movies" />} />
          <Route path="/tv-shows" element={<LibraryPage key="tv" />} />
          <Route
            path="*"
            element={
              <main className="detail-page">
                <div className="player-empty">
                  <h1>That scene is missing.</h1>
                  <Link to="/">Back to discover</Link>
                </div>
              </main>
            }
          />
        </Routes>
      </div>
      <footer className="site-footer">
        <div>
          <Link to="/" className="brand">
            CHANDU<span>FLIX</span>
          </Link>
          <p>A world of stories. Your place to discover.</p>
        </div>
        <div className="footer-navigation">
          <Link to="/movies">Movies</Link>
          <Link to="/tv-shows">Series</Link>
          <Link to="/search">Search</Link>
        </div>
        <div className="footer-fine">
          <span>© {new Date().getFullYear()} ChanduFlix</span>
          <span>
            Library metadata from DeepCine; discovery metadata and imagery by
            TMDB. This product is not endorsed or certified by TMDB. Streaming
            availability varies by title.
          </span>
        </div>
      </footer>
    </div>
  );
}
