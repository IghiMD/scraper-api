const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.post("/medscape", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 1. Načítaj login stránku
    await page.goto("https://login.medscape.com/login/sso/getlogin");

    // 2. Vyplň login formulár
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', email);

    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', password);

    // 3. Klikni na login button
    await page.click('button[type="submit"]');

    // 4. Počkaj na redirect po logine
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 });

    // 5. Choď na anestéziologickú sekciu (napr.)
    await page.goto("https://www.medscape.com/index/list_12253_0", {
      waitUntil: "domcontentloaded",
    });

    // 6. Získaj zoznam článkov
    const articles = await page.evaluate(() => {
      const nodes = document.querySelectorAll(".column-headline a");
      return Array.from(nodes).map(node => ({
        title: node.innerText.trim(),
        url: node.href
      }));
    });

    res.json(articles);

  } catch (error) {
    console.error("[❌ Scraper Error]", error.message);
    res.status(500).json({ error: "Scraping failed", details: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
});
