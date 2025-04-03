app.get('/mnt', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.medicalnewstoday.com/', { waitUntil: 'networkidle2', timeout: 60000 });

    // Počkaj kým sa načítajú články – definujeme bezpečný selektor
    await page.waitForSelector('a.card', { timeout: 10000 });

    const articles = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('a.card')) || [];
      return items.map(item => ({
        title: item.querySelector('h3')?.innerText || 'Bez nadpisu',
        url: item.href,
        content: item.innerText || ''
      }));
    });

    await browser.close();
    res.json(articles);
  } catch (err) {
    console.error('❌ Chyba pri scrapovaní MNT:', err);
    res.status(500).json({ error: 'Scraping failed', detail: err.message });
  }
});
