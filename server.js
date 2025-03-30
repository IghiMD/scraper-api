const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // 👇 Namiesto waitForTimeout použijeme JS setTimeout
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Príklad extrakcie obsahu (prispôsob si podľa potreby)
    const title = await page.title();
    const content = await page.evaluate(() => {
      const body = document.querySelector(".article-body") || document.querySelector(".content") || document.body;
      return body ? body.innerText.trim() : "";
    });

    await browser.close();

    res.json({ url, title, content });
  } catch (error) {
    if (browser) await browser.close();
    res.status(500).json({ error: "❌ Chyba pri scrapovaní", details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server beží na porte ${PORT}`);
});
