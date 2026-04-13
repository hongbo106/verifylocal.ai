import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * VerifyLocal Popular Times Proxy
 *
 * This server is the integration point for real Google Popular Times data.
 * Currently it returns deterministic stub data that gives the frontend a
 * realistic data shape to work with.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TO CONNECT REAL DATA — replace the stub block in GET /api/popular-times
 * with one of the following options:
 *
 *  Option 1 — SerpAPI (paid, easiest, recommended for production):
 *    https://serpapi.com/google-maps-popular-times
 *    1. Add SERPAPI_KEY=<your_key> to a .env file at project root.
 *    2. npm install node-fetch dotenv
 *    3. Replace the stub block below with:
 *
 *       import 'dotenv/config';
 *       const resp = await fetch(
 *         `https://serpapi.com/search.json?engine=google_maps` +
 *         `&place_id=${placeId}&api_key=${process.env.SERPAPI_KEY}`
 *       );
 *       const json = await resp.json();
 *       const series = parseSerpApiPopularTimes(json); // see helper below
 *       return res.json({ placeId, source: 'google_places', weekday: 'Tuesday', series });
 *
 *  Option 2 — populartimes Python microservice (free, scrape-based):
 *    https://github.com/m-wrzr/populartimes
 *    Run as a separate Python service and proxy the result here.
 *
 *  Option 3 — Direct Playwright scrape (fragile, avoid for production).
 * ─────────────────────────────────────────────────────────────────────────
 */

const app = express();
app.use(express.json());

const HOURS = ['11A', '12P', '1P', '2P', '3P', '4P', '5P', '6P', '7P', '8P'];

// Deterministic stub — remove when real API is connected.
function toSeed(str) {
  return Array.from(str || '').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}
function buildStubSeries(seed) {
  return HOURS.map((hour, idx) => {
    const wave = Math.sin((idx + (seed % 7)) * 0.8);
    const baseline = Math.max(8, Math.min(82, 26 + idx * 6 + Math.round(wave * 12)));
    const lift = 8 + ((seed + idx * 3) % 13);
    return { hour, baseline, campaign: Math.min(95, baseline + lift) };
  });
}

/**
 * Helper: map a SerpAPI popular-times response to the internal series shape.
 * Uncomment and adapt when connecting Option 1.
 *
 * function parseSerpApiPopularTimes(json) {
 *   const popularTimes = json?.knowledge_graph?.popular_times?.graph_results;
 *   if (!popularTimes) return buildStubSeries(0); // graceful fallback
 *   return popularTimes.map((pt) => ({
 *     hour: pt.time,
 *     baseline: pt.typical_popularity ?? 0,
 *     campaign: pt.current_popularity ?? pt.typical_popularity ?? 0,
 *   }));
 * }
 */

app.get('/api/popular-times', (req, res) => {
  const { placeId, merchantEmail } = req.query;

  // ── Real integration point ──────────────────────────────────────────────
  // TODO: When placeId is a real Google Place ID and SERPAPI_KEY is set,
  // replace this block with an actual API call (see header comment above).
  // ────────────────────────────────────────────────────────────────────────

  const seed = toSeed(placeId || merchantEmail || 'default');
  return res.json({
    placeId: placeId || null,
    source: 'stub',
    weekday: 'Tuesday',
    series: buildStubSeries(seed),
  });
});

const PORT = process.env.PORT || 3001;

// In production (Railway/Render/etc.) serve the Vite build from the same process.
// In dev the Vite dev server handles the frontend; Express only handles /api.
if (process.env.NODE_ENV === 'production') {
  const __dir = dirname(fileURLToPath(import.meta.url));
  const distPath = join(__dir, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`VerifyLocal stub API  →  http://localhost:${PORT}`);
  console.log('  GET /api/popular-times?placeId=<id>&merchantEmail=<email>');
});
