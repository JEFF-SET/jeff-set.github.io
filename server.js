import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.set('trust proxy', true);

const DATA_DIR = path.resolve(__dirname, 'data');
const LOG_FILE_PATH = path.resolve(DATA_DIR, 'speedtest-log.txt');
if (!LOG_FILE_PATH.startsWith(DATA_DIR + path.sep)) {
  throw new Error('Invalid log file path');
}

const LOG_HEADER = [
  '====================================================================',
  'JEFF-SET | Журнал перевірок швидкості інтернету (777.html)',
  '====================================================================',
  ''
].join('\n');

async function ensureLogFile() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.promises.access(LOG_FILE_PATH, fs.constants.F_OK);
  } catch {
    await fs.promises.writeFile(LOG_FILE_PATH, LOG_HEADER, 'utf8');
  }
}

// Incompressible 512 KB random buffer for accurate download speed measurement
const RANDOM_CHUNK = crypto.randomBytes(512 * 1024);

// Short in-memory cache for Weather API to protect API quota
const weatherCache = new Map();
const WEATHER_CACHE_TTL_MS = 20 * 60 * 1000;

function getMapsApiKey() {
  return (process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
}

function sanitizeText(val, maxLen = 64) {
  if (typeof val !== 'string') return '-';
  const cleaned = val.replace(/[\r\n\t\x00-\x1F\x7F]+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLen) : '-';
}

function sanitizeNumber(val, decimals = 2) {
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

function summarizeUserAgent(ua) {
  const safe = sanitizeText(ua, 240);
  if (safe === '-') return 'Unknown';
  let os = 'Other OS';
  if (/Android/i.test(safe)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(safe)) os = 'iOS';
  else if (/Windows/i.test(safe)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(safe)) os = 'macOS';
  else if (/Linux/i.test(safe)) os = 'Linux';

  let device = 'Desktop/Web';
  if (/AFT|BRAVIA|MIBOX|Android TV|SmartTV|SMART-TV|TV/i.test(safe)) device = 'TV Box / Smart TV';
  else if (/Mobile|iPhone|Android/i.test(safe)) device = 'Mobile';

  return `${device} (${os}) | ${safe}`;
}

// Prevent exposing server/config/data/cache files as static assets
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

// Prevent indexing of /777, /777.html, /speedtest-log.txt, and /api/*
app.use((req, res, next) => {
  if (
    req.path === '/777' ||
    req.path === '/777.html' ||
    req.path === '/speedtest-log.txt' ||
    req.path.startsWith('/api/')
  ) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  }
  next();
});

// Client Maps JS API configuration (reads key from environment)
app.get('/api/maps-config', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const apiKey = getMapsApiKey();
  res.json({
    apiKey,
    configured: Boolean(apiKey)
  });
});

// Google Maps Platform Weather API proxy (current conditions + 7-day forecast)
app.get('/api/weather', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const apiKey = getMapsApiKey();
  if (!apiKey) {
    return res.status(503).json({ error: 'WEATHER_KEY_MISSING' });
  }

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
    const headers = {
      'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio'
    };

    const currentUrl = new URL('https://weather.googleapis.com/v1/currentConditions:lookup');
    currentUrl.searchParams.set('key', apiKey);
    currentUrl.searchParams.set('location.latitude', String(lat));
    currentUrl.searchParams.set('location.longitude', String(lon));
    currentUrl.searchParams.set('unitsSystem', 'METRIC');

    const forecastUrl = new URL('https://weather.googleapis.com/v1/forecast/days:lookup');
    forecastUrl.searchParams.set('key', apiKey);
    forecastUrl.searchParams.set('location.latitude', String(lat));
    forecastUrl.searchParams.set('location.longitude', String(lon));
    forecastUrl.searchParams.set('days', '7');
    forecastUrl.searchParams.set('pageSize', '7');
    forecastUrl.searchParams.set('unitsSystem', 'METRIC');

    const [currentResp, forecastResp] = await Promise.all([
      fetch(currentUrl.toString(), { method: 'GET', headers }),
      fetch(forecastUrl.toString(), { method: 'GET', headers })
    ]);

    const currentText = await currentResp.text();
    const forecastText = await forecastResp.text();

    let currentJson = null;
    let forecastJson = null;
    try { currentJson = JSON.parse(currentText); } catch {}
    try { forecastJson = JSON.parse(forecastText); } catch {}

    const isQuotaExceeded =
      currentResp.status === 429 ||
      forecastResp.status === 429 ||
      currentJson?.error?.status === 'RESOURCE_EXHAUSTED' ||
      forecastJson?.error?.status === 'RESOURCE_EXHAUSTED';

    if (isQuotaExceeded) {
      return res.status(429).json({
        error: 'QUOTA_EXCEEDED',
        quotaExceeded: true
      });
    }

    if (!forecastResp.ok) {
      return res.status(forecastResp.status >= 400 ? forecastResp.status : 502).json({
        error: 'WEATHER_UPSTREAM_ERROR',
        status: forecastResp.status,
        message: forecastJson?.error?.message || 'Weather service unavailable'
      });
    }

    const payload = {
      coordinates: { lat, lon },
      current: currentResp.ok ? currentJson : null,
      forecast: forecastJson,
      fetchedAt: new Date().toISOString()
    };

    weatherCache.set(cacheKey, { ts: Date.now(), data: payload });
    return res.json({ ...payload, cached: false });
  } catch (err) {
    console.error('Weather API proxy error:', err?.message || err);
    return res.status(502).json({ error: 'WEATHER_FETCH_FAILED' });
  }
});

// Speed Test: Ping
app.get('/api/speedtest/ping', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({ ok: true, serverTime: Date.now() });
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

// Speed Test: Persist result to text log file
app.post('/api/speedtest/log', express.json({ limit: '8kb' }), async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  const pingMs = sanitizeNumber(body.pingMs, 1);
  const jitterMs = sanitizeNumber(body.jitterMs, 1);
  const downloadMbps = sanitizeNumber(body.downloadMbps, 2);
  const uploadMbps = sanitizeNumber(body.uploadMbps, 2);

  if (pingMs === null || downloadMbps === null || uploadMbps === null) {
    return res.status(400).json({ error: 'INVALID_SPEEDTEST_METRICS' });
  }

  const now = new Date();
  const kyivTime = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);

  const clientIp = getClientIp(req);
  const deviceInfo = summarizeUserAgent(req.headers['user-agent']);
  const netType = sanitizeText(body.connectionType, 32);
  const screenSize = sanitizeText(body.screen, 24);
  const clientTz = sanitizeText(body.timezone, 48);
  const clientLang = sanitizeText(body.language, 24);
  const proto = sanitizeText(req.headers['x-forwarded-proto'] || req.protocol, 12);

  const entry = [
    `[${kyivTime} Kyiv | ${now.toISOString()}]`,
    `IP: ${clientIp}`,
    `Пінг: ${pingMs} мс | Джитер: ${jitterMs !== null ? jitterMs + ' мс' : '-'}`,
    `Завантаження (Download): ${downloadMbps} Мбіт/с | Віддача (Upload): ${uploadMbps} Мбіт/с`,
    `Пристрій / Браузер: ${deviceInfo}`,
    `Мережа (браузер): ${netType} | Екран: ${screenSize} | Часовий пояс: ${clientTz} | Мова: ${clientLang} | Протокол: ${proto}`,
    '--------------------------------------------------------------------',
    ''
  ].join('\n');

  try {
    await ensureLogFile();
    await fs.promises.appendFile(LOG_FILE_PATH, entry, 'utf8');
    return res.json({ ok: true, logUrl: '/speedtest-log.txt', savedAt: now.toISOString(), ip: clientIp });
  } catch (err) {
    console.error('Failed to write speedtest log:', err?.message || err);
    return res.status(500).json({ error: 'LOG_WRITE_FAILED' });
  }
});

// Serve the plain-text speed test log file
app.get('/speedtest-log.txt', async (req, res) => {
  try {
    await ensureLogFile();
    const content = await fs.promises.readFile(LOG_FILE_PATH, 'utf8');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.send(content);
  } catch (err) {
    console.error('Failed to read speedtest log:', err?.message || err);
    res.status(500).type('text/plain').send('Помилка читання журналу.');
  }
});

app.use(express.static(__dirname, {
  extensions: ['html'],
  dotfiles: 'ignore'
}));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

ensureLogFile()
  .catch((err) => console.error('Log init warning:', err?.message || err))
  .finally(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Static server listening on http://${HOST}:${PORT}`);
    });
  });
