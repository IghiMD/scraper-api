app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL in request body" });

  console.log("➡️ Starting scrape:", url);

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: 60000, // + 60s timeout pre istotu
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const content = await page.evaluate(() => {
      return document.body.innerText;
    });

    await browser.close();
    console.log("✅ Scrape completed.");
    res.json({ url, content });

  } catch (error) {
    console.error("❌ Scrape failed:", error);
    res.status(500).json({ error: error.toString() });
  }
});
