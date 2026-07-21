import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

async function run() {
  let browser;
  try {
    const paths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    let executablePath = null;
    for (const p of paths) {
      if (fs.existsSync(p)) {
        executablePath = p;
        break;
      }
    }

    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set custom user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Track all responses that set cookies or contain bff in URL
    page.on('response', async response => {
      const url = response.url();
      const headers = response.headers();
      const setCookie = headers['set-cookie'];
      
      if (setCookie) {
        console.log(`[Set-Cookie] URL: ${url}`);
        console.log(`[Set-Cookie] Header:`, setCookie);
      }
      
      if (url.includes('bff') || url.includes('token') || url.includes('auth')) {
        console.log(`[BFF/Token Request] URL: ${url}, Status: ${response.status()}`);
        try {
          const text = await response.text();
          console.log(`[BFF/Token Response] Body (first 200 chars):`, text.substring(0, 200));
        } catch (e) {
          // Some responses might not be text
        }
      }
    });

    console.log('Navigating to movieboxonline.org...');
    await page.goto('https://movieboxonline.org/', { waitUntil: 'networkidle2', timeout: 30000 });

    await new Promise(r => setTimeout(r, 4000));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (browser) await browser.close();
  }
}

run();
