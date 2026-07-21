import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { downloadApiPlugin } from './vite-download-plugin.js'

let cachedToken = '';

async function refreshMovieBoxToken() {
  try {
    const res = await fetch('https://h5-api.aoneroom.com/wefeed-h5api-bff/country-code', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Request-Lang': 'en',
        'X-Client-Info': JSON.stringify({ timezone: "Asia/Calcutta" }),
        'X-Forwarded-For': '8.8.8.8',
        'X-Real-IP': '8.8.8.8',
        'CF-Connecting-IP': '8.8.8.8',
        'Origin': 'https://movieboxonline.org',
        'Referer': 'https://movieboxonline.org/'
      }
    });
    
    const xUser = res.headers.get('x-user');
    if (xUser) {
      const parsed = JSON.parse(xUser);
      if (parsed.token) {
        cachedToken = parsed.token;
        console.log('[Vite MovieBox Proxy] Guest token refreshed from x-user:', cachedToken.substring(0, 15) + '...');
        return;
      }
    }
  } catch (err) {
    console.error('[Vite MovieBox Proxy] Token refresh failed:', err);
  }
}

// Initial fetch
refreshMovieBoxToken();
// Refresh every 15 minutes
setInterval(refreshMovieBoxToken, 15 * 60 * 1000);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), downloadApiPlugin()],
  server: {
    proxy: {
      '/tmdb': {
        target: 'https://api.themoviedb.org/3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tmdb/, ''),
        secure: true,
      },
      '/moviebox-api': {
        target: 'https://h5-api.aoneroom.com/wefeed-h5api-bff',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/moviebox-api/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Attach token for search/detail requests, but omit it for play requests to mimic browser behavior
            if (cachedToken && !req.url.includes('/subject/play')) {
              proxyReq.setHeader('Authorization', `Bearer ${cachedToken}`);
            }
            
            // Inject all required browser headers to bypass CloudFront bot/fingerprint checks
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
            proxyReq.setHeader('Sec-Ch-Ua', '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"');
            proxyReq.setHeader('Sec-Ch-Ua-Mobile', '?0');
            proxyReq.setHeader('Sec-Ch-Ua-Platform', '"Windows"');
            proxyReq.setHeader('Sec-Fetch-Dest', 'empty');
            proxyReq.setHeader('Sec-Fetch-Mode', 'cors');
            proxyReq.setHeader('Sec-Fetch-Site', 'same-origin');
            proxyReq.setHeader('X-Request-Lang', 'en');
            proxyReq.setHeader('X-Client-Info', JSON.stringify({ timezone: "Asia/Calcutta" }));
            proxyReq.setHeader('Origin', 'https://movieboxonline.org');
            proxyReq.setHeader('Referer', 'https://movieboxonline.org/');
          });
        }
      }
    },
  },
})
