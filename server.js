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
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const data = await page.evaluate(() => {
      const title =
        document.querySelector("article h1, h1.article-title")?.innerText || document.title;

      const article =
        document.querySelector("article") || document.querySelector(".article-detail");

      let content = "";
      if (article) {
        const paragraphs = Array.from(article.querySelectorAll("p"));
        content = paragraphs
          .map(p => p.innerText.trim())
          .filter(text => text.length > 0)
          .join("\n\n");
      }

      return {
        title: title.trim(),
        content: content.trim()
      };
    });

    await browser.close();
    res.json({ url, ...data });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
