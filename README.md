# Scraper API

Jednoduché Express API s Puppeteerom na získavanie obsahu web stránok.
- POST `/scrape` s JSON telom `{ "url": "..." }`
- Vracia čistý text z článku.
