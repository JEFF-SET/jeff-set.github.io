import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// Prevent exposing server/config files as static assets
app.use((req, res, next) => {
  const blocked = ['/server.js', '/package.json', '/package-lock.json'];
  if (blocked.includes(req.path) || req.path.startsWith('/node_modules')) {
    return res.status(404).send('Not found');
  }
  next();
});

// Prevent indexing of /777 and /777.html at HTTP header level as well
app.use((req, res, next) => {
  if (req.path === '/777' || req.path === '/777.html') {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  }
  next();
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
