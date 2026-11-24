import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.set('trust proxy', true);

// Incompressible 512 KB random buffer for accurate download speed measurement
const RANDOM_CHUNK = crypto.randomBytes(512 * 1024);

// Short in-memory cache for Open-Meteo Weather API (15 min)
const weatherCache = new Map();
const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;

// Keep last 5 speed test results in memory (no filesystem writes needed)
const MAX_RECENT_TESTS = 5;
const recentSpeedTests = [];

function sanitizeText(val, maxLen = 64) {
  if (typeof val !== 'string') return '-';
  const cleaned = val.replace(/[\r\n\t\x00-\x1F\x7F]+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLen) : '-';
}

function sanitizeNumber(val, decimals = 2) {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0 || num > 100000) return null;
  return Number(num.toFixed(decimals));
}

function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) return sanitizeText(cfIp, 64);
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return sanitizeText(xff.split(',')[0], 64);
  }
  return sanitizeText(req.ip || req.socket?.remoteAddress || 'unknown', 64);
}

function detectDeviceShort(ua) {
  const safe = sanitizeText(ua, 240);
  if (safe === '-') return 'Пристрій';
  if (/AFT|BRAVIA|MIBOX|Android TV|SmartTV|SMART-TV|TV/i.test(safe)) return 'TV Box';
  if (/iPhone|iPad|iPod/i.test(safe)) return 'iOS';
  if (/Android/i.test(safe)) return 'Android';
  if (/Windows/i.test(safe)) return 'Windows';
  if (/Mac OS X|Macintosh/i.test(safe)) return 'macOS';
  if (/Linux/i.test(safe)) return 'Linux';
  return 'Браузер';
}

// Prevent exposing server/config/internal files as static assets
app.use((req, res, next) => {
  const blockedExact = ['/server.js', '/package.json', '/package-lock.json', '/bun.lock', '/.env', '/.env.example'];
  if (
    blockedExact.includes(req.path) ||
    req.path.startsWith('/node_modules') ||
    req.path.startsWith('/data') ||
    req.path.startsWith('/.gmp_cache')
  ) {
    return res.status(404).send('Not found');
  }
  next();
});

// Prevent indexing of /777, /777.html, and /api/*
app.use((req, res, next) => {
  if (req.path === '/777' || req.path === '/777.html' || req.path.startsWith('/api/')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  }
  next();
});

// Open-Meteo Weather API proxy (current conditions + 7-day forecast)
app.get('/api/weather', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const lat = req.query.lat !== undefined ? Number(req.query.lat) : 48.05833;
  const lon = req.query.lon !== undefined ? Number(req.query.lon) : 39.65833;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'INVALID_COORDINATES' });
  }

  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < WEATHER_CACHE_TTL_MS) {
    return res.json({ ...cached.data, cached: true });
  }

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m');
    url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
    url.searchParams.set('timezone', 'Europe/Kyiv');
    url.searchParams.set('forecast_days', '7');

    const resp = await fetch(url.toString(), { method: 'GET' });
    if (!resp.ok) {
      return res.status(502).json({ error: 'WEATHER_UPSTREAM_ERROR', status: resp.status });
    }

    const data = await resp.json();
    const payload = {
      coordinates: { lat, lon },
      current: data.current || null,
      daily: data.daily || null,
      fetchedAt: new Date().toISOString()
    };

    weatherCache.set(cacheKey, { ts: Date.now(), data: payload });
    return res.json({ ...payload, cached: false });
  } catch (err) {
    console.error('Open-Meteo fetch error:', err?.message || err);
    return res.status(502).json({ error: 'WEATHER_FETCH_FAILED' });
  }
});

// Speed Test: Ping
app.get('/api/speedtest/ping', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({ ok: true, serverTime: Date.now(), ip: getClientIp(req) });
});

// Speed Test: Download payload (incompressible random bytes)
app.get('/api/speedtest/download', (req, res) => {
  const kbRaw = Number(req.query.kb);
  const kb = Number.isFinite(kbRaw) ? Math.min(Math.max(Math.round(kbRaw), 64), 4096) : 1024;
  const totalBytes = kb * 1024;

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store, no-transform');
  res.setHeader('Content-Length', String(totalBytes));

  let remaining = totalBytes;
  while (remaining > 0) {
    const sliceLen = Math.min(remaining, RANDOM_CHUNK.length);
    res.write(sliceLen === RANDOM_CHUNK.length ? RANDOM_CHUNK : RANDOM_CHUNK.subarray(0, sliceLen));
    remaining -= sliceLen;
  }
  res.end();
});

// Speed Test: Upload payload sink
app.post('/api/speedtest/upload', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const maxBytes = 10 * 1024 * 1024;
  let bytesReceived = 0;
  let aborted = false;

  req.on('data', (chunk) => {
    bytesReceived += chunk.length;
    if (bytesReceived > maxBytes && !aborted) {
      aborted = true;
      res.status(413).json({ error: 'PAYLOAD_TOO_LARGE' });
      req.destroy();
    }
  });

  req.on('end', () => {
    if (!aborted) {
      res.json({ ok: true, bytesReceived });
    }
  });

  req.on('error', () => {
    if (!aborted && !res.headersSent) {
      res.status(400).json({ error: 'UPLOAD_ERROR' });
    }
  });
});

// Speed Test: Get last 5 results
app.get('/api/speedtest/recent', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    ok: true,
    clientIp: getClientIp(req),
    recent: recentSpeedTests
  });
});

// Speed Test: Save result into last-5 memory buffer
app.post('/api/speedtest/recent', express.json({ limit: '8kb' }), (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  const pingMs = sanitizeNumber(body.pingMs, 1);
  const jitterMs = sanitizeNumber(body.jitterMs, 1);
  const downloadMbps = sanitizeNumber(body.downloadMbps, 2);
  const uploadMbps = sanitizeNumber(body.uploadMbps, 2);

  if (pingMs === null || downloadMbps === null) {
    return res.status(400).json({ error: 'INVALID_SPEEDTEST_METRICS' });
  }

  const now = new Date();
  const kyivTime = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);

  const entry = {
    time: kyivTime,
    isoTime: now.toISOString(),
    ip: getClientIp(req),
    device: detectDeviceShort(req.headers['user-agent']),
    pingMs,
    jitterMs,
    downloadMbps,
    uploadMbps
  };

  recentSpeedTests.unshift(entry);
  if (recentSpeedTests.length > MAX_RECENT_TESTS) {
    recentSpeedTests.length = MAX_RECENT_TESTS;
  }

  return res.json({
    ok: true,
    entry,
    recent: recentSpeedTests
  });
});

app.use(express.static(__dirname, {
  extensions: ['html'],
  dotfiles: 'ignore'
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Static server listening on http://${HOST}:${PORT}`);
});
