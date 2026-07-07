/**
 * Vercel Serverless Function: /api/download-proxy
 * 
 * Proxies the 02moviedownloader HTML page through our origin,
 * injects auto-slider script for seamless verification.
 */
export const config = {
  maxDuration: 15,
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).end();
  }

  const { type = 'movie', id, s = '1', e = '1' } = req.query;

  if (!id) {
    return res.status(400).send('Missing id parameter');
  }

  const BASE = 'https://02moviedownloader.site';
  const path = type === 'tv'
    ? `/api/download/tv/${id}/${s}/${e}`
    : `/api/download/movie/${id}`;
  const targetUrl = `${BASE}${path}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch download page');
    }

    let html = await response.text();

    // Rewrite API calls to point to the real server
    html = html.replace(
      `fetch('/api/verify-robot'`,
      `fetch('${BASE}/api/verify-robot'`
    );
    html = html.replace(
      `fetch(window.location.href,`,
      `fetch('${targetUrl}',`
    );
    html = html.replace(
      /['"]\/api\/proxy\?/g,
      `'${BASE}/api/proxy?`
    );
    // Remove iframe detection
    html = html.replace(
      /if\s*\(\s*window\.self\s*!==\s*window\.top\s*\)/g,
      'if (false)'
    );

    // Inject auto-slider + postMessage communication
    const injectedScript = `
<script>
(function() {
  function waitForSlider() {
    var btn = document.getElementById('sliderButton');
    var container = document.getElementById('sliderContainer');
    if (!btn || !container) { setTimeout(waitForSlider, 100); return; }
    setTimeout(function() {
      var cr = container.getBoundingClientRect();
      var br = btn.getBoundingClientRect();
      var sx = br.left + br.width / 2, sy = br.top + br.height / 2;
      btn.dispatchEvent(new MouseEvent('mousedown', { clientX: sx, clientY: sy, bubbles: true }));
      var step = 0, total = 20;
      var iv = setInterval(function() {
        step++;
        var p = step / total;
        var e2 = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2, 2)/2;
        var cx = sx + (cr.right - br.width - 5 - sx) * e2;
        document.dispatchEvent(new MouseEvent('mousemove', { clientX: cx, clientY: sy, bubbles: true }));
        if (step >= total) {
          clearInterval(iv);
          document.dispatchEvent(new MouseEvent('mouseup', { clientX: cx, clientY: sy, bubbles: true }));
        }
      }, 30);
    }, 500);
  }
  function watchForResults() {
    var ob = new MutationObserver(function() {
      var vg = document.querySelector('.video-grid');
      var em = document.querySelector('.error-message.show');
      if (vg) {
        var dl = [], st = [];
        vg.querySelectorAll('.download-btn').forEach(function(b) {
          var h = b.getAttribute('data-href'), q = b.querySelector('.quality-badge');
          if (h && q) dl.push({ url: h, label: q.textContent.trim() });
        });
        var sg = document.querySelector('.subtitle-grid');
        if (sg) sg.querySelectorAll('.subtitle-btn').forEach(function(b) {
          var h = b.getAttribute('data-href');
          if (h) st.push({ url: h, label: b.textContent.replace(/⬇ Download/g, '').trim() });
        });
        var t = document.querySelector('.movie-title');
        window.parent.postMessage({ type: 'DOWNLOAD_LINKS', success: true,
          title: t ? t.textContent.trim() : '', downloads: dl, subtitles: st }, '*');
        ob.disconnect();
      } else if (em) {
        window.parent.postMessage({ type: 'DOWNLOAD_LINKS', success: false, error: 'Verification failed' }, '*');
        ob.disconnect();
      }
    });
    ob.observe(document.body, { childList: true, subtree: true });
    setTimeout(function() { ob.disconnect();
      window.parent.postMessage({ type: 'DOWNLOAD_LINKS', success: false, error: 'Timeout' }, '*');
    }, 60000);
  }
  waitForSlider();
  watchForResults();
})();
</script>`;

    html = html.replace('</body>', injectedScript + '\n</body>');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('Proxy error:', err.message);
    return res.status(500).send('Proxy error: ' + err.message);
  }
}
