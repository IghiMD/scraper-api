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
  if (!url) {
    console.log("❌ URL not provided");
    return res.status(400).json({ error: "Missing URL in request body" });
  }

  console.log("➡️ Starting scrape for:", url);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: 60000,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const content = await page.evaluate(() => {
      return document.body.innerText;
    });

    console.log("✅ Scrape successful");

    res.json({ url, content });
  } catch (error) {
    console.error("❌ Scrape failed:", error);
    res.status(500).json({ error: error.toString() });
  } finally {
    if (browser) {
      await browser.close();
      console.log("🧹 Browser closed");
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
