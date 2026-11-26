// Tiny static server for the built lab: no dependencies, no internet needed.
// Usage:  npm run build   then   node serve.js
// Open the printed address; phones on the same Wi-Fi use the LAN address.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'dist');
const port = Number(process.env.PORT) || 8000;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.md': 'text/plain; charset=utf-8',
};

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error(
    '\nThe lab has not been built yet. Run:\n\n  npm install\n  npm run build\n\nthen start this server again.\n',
  );
  process.exit(1);
}

http
  .createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.normalize(path.join(root, p));
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not found');
      }
      res.writeHead(200, {
        'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      });
      res.end(data);
    });
  })
  .listen(port, '0.0.0.0', () => {
    console.log(`\nAI Discovery Lab is running.\n\n  On this computer:     http://localhost:${port}/`);
    for (const nets of Object.values(os.networkInterfaces())) {
      for (const n of nets || []) {
        if (n.family === 'IPv4' && !n.internal)
          console.log(`  Phones on same Wi-Fi: http://${n.address}:${port}/`);
      }
    }
    console.log('\nPress Ctrl+C to stop.\n');
  });
