// server.js - vylepšené scraper API

const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Scraper API is running");
});

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL in request body" });

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Odklikni cookies ak su (najcastejsie triedy a buttony)
    try {
      await page.waitForSelector("button", { timeout: 5000 });
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const cookieBtn = buttons.find((btn) => /súhlas|accept|ok|agree/i.test(btn.textContent));
        if (cookieBtn) cookieBtn.click();
      });
    } catch (e) {
      console.log("❗ Cookie banner nebol nájdený alebo sa nepodarilo odkliknúť.");
    }

    // Skrolovanie pre lazy loading (ak je treba)
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(1000);

    // Skús získať obsah z viacerých známych tried
    const content = await page.evaluate(() => {
      const selectors = [
        ".article-body",
        ".article-content",
        ".content",
        ".post-content",
        ".main-text",
        "article",
      ];
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) return el.innerText.trim();
      }
      return document.body.innerText.slice(0, 2000); // fallback, skratka
    });

    // Titulok ak je dostupný
    const title = await page.title();

    await browser.close();
    res.json({ url, title, content });
  } catch (error) {
    res.status(500).json({ error: "❌ Chyba pri scrapovaní", details: error.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Scraper API beží na porte ${PORT}`);
});
