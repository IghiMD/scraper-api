const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Skús odkliknúť cookies, ak existujú
    try {
      await page.waitForSelector("button[aria-label='Súhlasím']", { timeout: 3000 });
      await page.click("button[aria-label='Súhlasím']");
      await page.waitForTimeout(1000);
    } catch (e) {
      // Žiadne cookies alebo už kliknuté
    }

    // Počkaj na hlavný článok
    await page.waitForSelector("h1", { timeout: 10000 });

    const data = await page.evaluate(() => {
      const title = document.querySelector("h1")?.innerText || "";
      const paragraphs = Array.from(document.querySelectorAll("article p"));
      const content = paragraphs.map(p => p.innerText).join("\n\n");
      return {
        title: title.trim(),
        content: content.trim()
      };
    });

    await browser.close();
    res.json({ url, ...data });
  } catch (err) {
    console.error("❌ Scraper error:", err);
    res.status(500).json({ error: "Scraping error", details: err.message });
  }
});

app.listen(process.env.PORT || 8080, () => {
  console.log("✅ Server running on port 8080");
});
