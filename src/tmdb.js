const API_KEY = "e1e4daa6fae8499bb36b579d3c7890d1";
const BASE_URL = "/tmdb";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

export const TMDB_IMAGE = {
  backdrop: (path) => path ? `${IMAGE_BASE}/original${path}` : null,
  poster: (path) => path ? `${IMAGE_BASE}/w500${path}` : null,
  thumbnail: (path) => path ? `${IMAGE_BASE}/w300${path}` : null,
  profile: (path) => path ? `${IMAGE_BASE}/w185${path}` : null,
};

/* ── Category row endpoints ── */
const requests = {
  // Original categories
  fetchTrending: `${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=en-US`,
  fetchNetflixOriginals: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=213`,
  fetchTopRated: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US`,
  fetchActionMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28`,
  fetchComedyMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35`,
  fetchHorrorMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27`,
  fetchRomanceMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10749`,
  fetchDocumentaries: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=99`,
  fetchSciFi: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=878`,
  fetchAnimation: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16`,

  // ── NEW: MovieBox-inspired categories ──
  fetchUpcoming: `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=en-US`,
  fetchNowPlaying: `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US`,
  fetchTrendingMovies: `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=en-US`,
  fetchTrendingTV: `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=en-US`,
  fetchTopRatedTV: `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US`,
  fetchPopularTV: `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US`,
  fetchBollywood: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=hi&sort_by=popularity.desc`,
  fetchKoreanDrama: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_original_language=ko&sort_by=popularity.desc`,
  fetchAnime: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc`,
  fetchCrime: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=80&sort_by=popularity.desc`,
  fetchThriller: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=53&sort_by=popularity.desc`,
  fetchWar: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10752&sort_by=popularity.desc`,
  fetchMystery: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=9648&sort_by=popularity.desc`,
  fetchFamily: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10751&sort_by=popularity.desc`,
};

/* ── Genre lists ── */
export const MOVIE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

export const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
];

/* ── Detail page endpoints ── */

export async function fetchMovieDetails(id) {
  const res = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits,similar,videos`);
  return res.json();
}

export async function fetchTvDetails(id) {
  const res = await fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&append_to_response=credits,similar,videos`);
  return res.json();
}

export async function fetchTvSeason(tvId, seasonNum) {
  const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNum}?api_key=${API_KEY}`);
  return res.json();
}

export async function searchMulti(query) {
  const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`);
  return res.json();
}

export async function fetchTrendingAll() {
  const res = await fetch(requests.fetchTrending);
  return res.json();
}

/* ── NEW: Browse/Discover endpoints for genre pages ── */

export async function discoverMovies({ genre, region, sortBy = 'popularity.desc', page = 1 } = {}) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    language: 'en-US',
    sort_by: sortBy,
    page: String(page),
    'vote_count.gte': '50',
  });
  if (genre) params.set('with_genres', String(genre));
  if (region) params.set('with_original_language', region === 'IN' ? 'hi' : region === 'KR' ? 'ko' : 'en');
  const res = await fetch(`${BASE_URL}/discover/movie?${params.toString()}`);
  return res.json();
}

export async function discoverTV({ genre, region, sortBy = 'popularity.desc', page = 1 } = {}) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    language: 'en-US',
    sort_by: sortBy,
    page: String(page),
    'vote_count.gte': '20',
  });
  if (genre) params.set('with_genres', String(genre));
  if (region) params.set('with_original_language', region === 'IN' ? 'hi' : region === 'KR' ? 'ko' : 'ja');
  const res = await fetch(`${BASE_URL}/discover/tv?${params.toString()}`);
  return res.json();
}

export default requests;
