const requests = {
  fetchTrending: "/api/catalog",
  fetchTopRated: "/api/catalog?view=browse&type=movie",
  fetchTrendingTV: "/api/catalog?view=browse&type=tv",
  fetchBollywood: "/api/catalog?view=browse&type=movie&page=2",
  fetchActionMovies: "/api/catalog?view=browse&type=movie&genre=Adventure",
  fetchAnime: "/api/catalog?view=browse&type=tv&genre=Animation",
};
export default requests;
