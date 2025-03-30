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
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Odklikni cookies
    try {
      await page.click("button[aria-label='Súhlasím']");
      await page.waitForTimeout(300);
    } catch (e) {}

    const data = await page.evaluate(() => {
      const title = document.querySelector("h1.main-title")?.innerText || "";
      const paragraphs = Array.from(document.querySelectorAll(".main-article p"));
      const content = paragraphs.map(p => p.innerText).join("\n\n");
      return {
        title: title.trim(),
        content: content.trim()
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
  console.log("✅ Server running on port 8080");
});
