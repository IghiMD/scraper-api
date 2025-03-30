const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Scraper API beží");
});

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "❌ Chýba URL v požiadavke" });

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Počkáme na hlavný obsah článku
    await page.waitForSelector(".article-perex, .article-body", { timeout: 15000 });

    const data = await page.evaluate(() => {
      const title = document.querySelector("h1")?.innerText || "";
      const perex = document.querySelector(".article-perex")?.innerText || "";
      const bodyParts = Array.from(document.querySelectorAll(".article-body p"))
        .map(p => p.innerText.trim())
        .filter(t => t.length > 0);
      const content = [perex, ...bodyParts].join("\n\n");
      return { title, content };
    });

    await browser.close();
    res.json({ url, ...data });
  } catch (error) {
    res.status(500).json({ error: "❌ Chyba pri scrapovaní", details: error.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper beží na porte ${PORT}`);
});
