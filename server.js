const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// ✨ NOVÝ ENDPOINT PRE MNT
app.get('/mnt', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: "new", // alebo true
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://www.medicalnewstoday.com/', { waitUntil: 'networkidle2' });

    // Získanie článkov z úvodnej stránky (uprav podľa štruktúry stránky)
    const articles = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('a.card')) || [];
      return items.map(item => ({
        title: item.querySelector('h3')?.innerText || 'Bez nadpisu',
        url: item.href,
        content: item.innerText,
      }));
    });

    await browser.close();
    res.json(articles);
  } catch (err) {
    console.error('❌ Chyba pri scrapovaní MNT:', err);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Scraper API beží!');
});

app.listen(PORT, () => {
  console.log(`✅ Server beží na porte ${PORT}`);
});
