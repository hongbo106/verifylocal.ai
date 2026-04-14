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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeHourLabel(rawTime) {
  if (!rawTime) return null;
  const clean = String(rawTime)
    .replace(/\u202f|\u00a0/g, ' ')
    .replace(/\./g, '')
    .trim()
    .toUpperCase();
  const match = clean.match(/(\d{1,2})\s*([AP])M?/);
  if (!match) return null;
  return `${parseInt(match[1], 10)}${match[2]}`;
}

function currentWeekdayKey() {
  const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return keys[new Date().getDay()];
}

function parseSerpApiPopularTimes(json) {
  const graphResults = json?.knowledge_graph?.popular_times?.graph_results;
  if (!graphResults || typeof graphResults !== 'object') return null;

  const preferredDay = currentWeekdayKey();
  const dayKey = graphResults[preferredDay]
    ? preferredDay
    : graphResults.tuesday
      ? 'tuesday'
      : Object.keys(graphResults)[0];

  const dayPoints = Array.isArray(graphResults[dayKey]) ? graphResults[dayKey] : [];
  const byHour = new Map();

  dayPoints.forEach((point) => {
    const hour = normalizeHourLabel(point?.time);
    if (!hour || !HOURS.includes(hour)) return;
    byHour.set(hour, clamp(Number(point?.busyness_score ?? 0), 0, 100));
  });

  const liveTime = normalizeHourLabel(json?.knowledge_graph?.popular_times?.live?.time);
  const liveInfo = String(json?.knowledge_graph?.popular_times?.live?.info || '').toLowerCase();
  const liveBoost = liveInfo.includes('as busy as it gets') ? 18 : liveInfo.includes('little busy') ? 10 : 6;

  const series = HOURS.map((hour) => {
    const baseline = byHour.get(hour) ?? 0;
    const campaign = liveTime === hour ? clamp(baseline + liveBoost, 0, 100) : baseline;
    return { hour, baseline, campaign };
  });

  return {
    weekday: dayKey,
    series,
  };
}

async function fetchSerpApiPopularTimes({ placeId, merchantEmail }) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return null;
  }

  const query = new URLSearchParams({
    engine: 'google',
    q: placeId || merchantEmail || 'restaurant',
    gl: 'us',
    hl: 'en',
    api_key: apiKey,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(`https://serpapi.com/search.json?${query.toString()}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`SerpAPI HTTP ${response.status}`);
    }
    const payload = await response.json();
    return parseSerpApiPopularTimes(payload);
  } finally {
    clearTimeout(timeout);
  }
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

app.get('/api/popular-times', async (req, res) => {
  const { placeId, merchantEmail } = req.query;
  const seed = toSeed(placeId || merchantEmail || 'default');

  try {
    const live = await fetchSerpApiPopularTimes({ placeId, merchantEmail });
    if (live?.series?.length) {
      return res.json({
        placeId: placeId || null,
        source: 'google_places',
        weekday: live.weekday,
        series: live.series,
      });
    }
  } catch (error) {
    console.error('SerpAPI fallback to stub:', error?.message || error);
  }

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
  app.use((_req, res) => res.sendFile(join(distPath, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`VerifyLocal stub API  →  http://localhost:${PORT}`);
  console.log('  GET /api/popular-times?placeId=<id>&merchantEmail=<email>');
});
