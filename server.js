const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("✅ Scraper API beží!");
});

app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Prípadne odklikni cookies alebo popup (ak poznáme selektor)
    // await page.click('#acceptButton')

    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        html: document.body.innerHTML,
        text: document.body.innerText,
      };
    });

    await browser.close();

    res.json({ success: true, data: pageContent });
  } catch (err) {
    console.error("❌ Scraping error:", err);
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server beží na porte ${port}`);
});
