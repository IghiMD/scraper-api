const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("✅ Puppeteer scraper server beží.");
});

// 🆕 Medscape scraper s loginom
app.get("/medscape", async (req, res) => {
  let browser;
  try {
    console.log("[🚀] Spúšťam Puppeteer pre Medscape...");
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Prihlásenie na Medscape
    await page.goto("https://login.medscape.com/login/sso/getlogin", {
      waitUntil: "networkidle2",
    });
    await page.type("#userId", "ighi@pm.me", { delay: 50 });
    await page.type("#password", "JCZ9vpj3tky5hza-txc", { delay: 50 });
    await Promise.all([
      page.click("button[type='submit']"),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);
    console.log("[🔐] Prihlásený do Medscape");

    // Načítanie sekcie noviniek
    await page.goto("https://www.medscape.com/index/list_13470_0", {
      waitUntil: "networkidle2",
    });
    console.log("[📥] Načítaná stránka s novinkami");

    // Výber článkov
    const articles = await page.evaluate(() => {
      const links = document.querySelectorAll(".headline > a");
      return Array.from(links).map((link) => ({
        title: link.innerText.trim(),
        url: link.href,
      }));
    });

    console.log(`[✅] Nájdených článkov: ${articles.length}`);

    const results = [];

    for (const article of articles.slice(0, 5)) {
      await page.goto(article.url, { waitUntil: "networkidle2" });
      const content = await page.evaluate(() => {
        const paras = document.querySelectorAll(".article-body p");
        return Array.from(paras).map((p) => p.innerText.trim()).join("\n");
      });

      results.push({
        title: article.title,
        url: article.url,
        content,
      });

      console.log(`[🧾] Načítaný článok: ${article.title}`);
    }

    await browser.close();
    console.log("[🟢] Puppeteer zatvorený. Výstup odoslaný.");
    res.json(results);
  } catch (error) {
    console.error("[❌] Chyba počas scrapovania Medscape:", error.message);
    if (browser) await browser.close();
    res.status(500).json({ error: error.message });
  }
});

// Spustenie servera
app.listen(PORT, () => {
  console.log(`🚀 Scraper API beží na porte ${PORT}`);
});
