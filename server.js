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
    await page.goto(url, { waitUntil: "networkidle2" });

    // Odklikni cookies, ak treba (príklad)
    try {
      await page.click("button[aria-label='Súhlasím']");
      await page.waitForTimeout(500);
    } catch (e) {}

    const data = await page.evaluate(() => {
      const title = document.querySelector("h1")?.innerText || "";
      const article = document.querySelector("article")?.innerText || ""; // môžeš doladiť
      return {
        title: title.trim(),
        content: article.trim()
      };
    });

    await browser.close();
    res.json({ url, ...data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scraping error", details: err.message });
  }
});

app.listen(process.env.PORT || 8080, () => {
  console.log("✅ Server running");
});
