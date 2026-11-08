# Reelipse-inspired discovery and automatic playback

ChanduFlix now uses a warm dark cinema theme, gold search, editorial serif typography, a decorative poster orbit, and an interactive featured-poster carousel. The layout is inspired by https://reelipse.com/; branding and copy remain ChanduFlix's.

The homepage fetches trending metadata through the existing `/tmdb/trending/all/week` integration. TMDB discovery cards offer **Find in library**; catalog cards retain BoxOffice source identities and open the actual player automatically. Discovery metadata does not imply a playable source.

Opening a movie, series, season, or episode starts loading playback immediately. The player attempts sound first, then muted playback when the browser rejects audible autoplay. **Turn sound on** is shown for that fallback; a manual Play action remains available if autoplay is entirely blocked. Changing to a prepared language-track source preserves the current pause/play state and position.

## Reference investigation

Reelipse's About page attributes title/episode metadata, posters, scores, and recommendations to TMDB; availability to JustWatch through TMDB; and related-film signals to Trakt: https://reelipse.com/about.

A read-only inspection of its downloaded public Astro JavaScript with the local REA CLI retained evidence under the task's `outputs/reelipse-redesign` directory. The public store bundle contains `/api/search`, `/api/ask`, and `/api/discover` requests and TMDB image URL construction. Static client evidence does not reveal server implementation, credentials, cache behavior, or upstream request timing. No Reelipse analytics, private credentials, or endpoint dependencies are installed in ChanduFlix. Trakt recommendations and JustWatch listings are not part of this change.

## Validation

ESLint, 15 tests, and production build pass. Autoplay tests cover sound allowed, muted fallback, source-change abort, and complete policy blocking. Browser verification and screenshots are recorded separately in the task outputs.
