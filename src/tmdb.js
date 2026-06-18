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
};

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

export default requests;
