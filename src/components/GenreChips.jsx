import { useNavigate } from 'react-router-dom';
import './GenreChips.css';

const GENRE_CHIPS = [
  { id: 'all', label: '🔥 Trending', path: '/' },
  { id: 28, label: '💥 Action', path: '/movies?genre=28' },
  { id: 35, label: '😂 Comedy', path: '/movies?genre=35' },
  { id: 27, label: '👻 Horror', path: '/movies?genre=27' },
  { id: 878, label: '🚀 Sci-Fi', path: '/movies?genre=878' },
  { id: 10749, label: '❤️ Romance', path: '/movies?genre=10749' },
  { id: 53, label: '🔪 Thriller', path: '/movies?genre=53' },
  { id: 16, label: '🎌 Animation', path: '/movies?genre=16' },
  { id: 80, label: '🔫 Crime', path: '/movies?genre=80' },
  { id: 99, label: '📹 Documentary', path: '/movies?genre=99' },
  { id: 10752, label: '⚔️ War', path: '/movies?genre=10752' },
  { id: 'tv', label: '📺 TV Shows', path: '/tv-shows' },
  { id: 'bollywood', label: '🇮🇳 Bollywood', path: '/movies?region=IN' },
  { id: 'korean', label: '🇰🇷 K-Drama', path: '/tv-shows?region=KR' },
];

const GenreChips = () => {
  const navigate = useNavigate();

  return (
    <div className="genre-chips-container">
      <div className="genre-chips-scroll">
        {GENRE_CHIPS.map((chip) => (
          <button
            key={chip.id}
            className="genre-chip"
            onClick={() => navigate(chip.path)}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenreChips;
