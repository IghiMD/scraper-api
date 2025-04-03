const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post("/medscape", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.goto("https://login.medscape.com/login/sso/getlogin");

    await page.waitForSelector("#userId");
    await page.type("#userId", email);
    await page.type("#password", password);
    await page.click("#loginbtn");

    await page.waitForNavigation({ waitUntil: "networkidle2" });

    await page.goto("https://www.medscape.com/index/list_12253_0");

    // Zavrieť popup ak existuje
    try {
      await page.waitForSelector(".modalClose", { timeout: 5000 });
      await page.click(".modalClose");
    } catch (err) {
      console.log("Popup nebol zobrazený");
    }

    // Extrakcia článkov
    const articles = await page.evaluate(() => {
      const articleElements = document.querySelectorAll(".column2 .doc-info");
      const data = [];
      articleElements.forEach(el => {
        const titleEl = el.querySelector("a.title");
        const descEl = el.querySelector(".doc-description");
        const dateEl = el.querySelector(".doc-source");

        if (titleEl && descEl) {
          data.push({
            title: titleEl.innerText.trim(),
            url: "https://www.medscape.com" + titleEl.getAttribute("href"),
            description: descEl.innerText.trim(),
            date: dateEl ? dateEl.innerText.trim() : null
          });
        }
      });
      return data;
    });

    await browser.close();
    res.json(articles);

  } catch (err) {
    await browser.close();
    console.error("Scraping failed:", err);
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Medscape scraper API beží.");
});

app.listen(PORT, () => {
  console.log(`✅ Server beží na porte ${PORT}`);
});
