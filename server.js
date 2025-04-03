const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
  res.send('✅ Puppeteer Scraper API beží.');
});

app.get('/mnt', async (req, res) => {
  let browser;
  try {
    console.log('[🌐] Spúšťam Puppeteer...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.medicalnewstoday.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('[🔍] Čakám na selektor článkov...');
    await page.waitForSelector('a.card', { timeout: 10000 });

    const articles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a.card')).map(item => {
        const title = item.querySelector('h3')?.innerText || 'Bez nadpisu';
        const url = item.href || '';
        const content = item.innerText || '';
        return { title, url, content };
      });
    });

    console.log(`[✅] Načítaných článkov: ${articles.length}`);
    await browser.close();
    res.json(articles);
  } catch (error) {
    console.error('[❌] Chyba počas scrapingu:', error.message);
    if (browser) await browser.close();
    res.status(500).json({
      error: 'Chyba pri scrapovaní MNT',
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper API beží na porte ${PORT}`);
});
