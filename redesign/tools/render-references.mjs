// Renders every design board in design/prototype to PNG reference images.
// Needs internet (the prototype loads React from unpkg and fonts from Google Fonts).
//
//   npm i -D playwright && npx playwright install chromium
//   node tools/render-references.mjs            -> writes references/*.png
//
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const protoDir = path.join(root, 'design', 'prototype');
const outDir = path.join(root, 'references');
fs.mkdirSync(outDir, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(protoDir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(protoDir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

const pages = [
  ['00-icon', 'VLC Icon.dc.html', 1440],
  ['01-directions', 'VLC Directions.dc.html', 1500],
  ['02-components-motion', 'VLC Components & Motion.dc.html', 1600],
  ['10-flows-playback', 'VLC Flows - Playback.dc.html', 2400],
  ['11-flows-library-menus-settings', 'VLC Flows - Library, Menus & Settings.dc.html', 2400],
  ['12-sizes-themes', 'VLC Screen Sizes & Themes.dc.html', 2600],
  ['20-live-prototype', 'VLC Redesign.dc.html', 1440],
];

const browser = await chromium.launch();
for (const [name, file, width] of pages) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.warn(`[${name}]`, e.message));
  await page.goto(base + encodeURI(file), { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
  // Individual frames on the flow boards carry ids like "1.2.3" (see docs/SCREEN_INVENTORY.md)
  const ids = await page.$$eval('[id]', els => els.map(e => e.id).filter(id => /^\d+\.\d+\.\d+$/.test(id)));
  for (const id of ids) {
    try { await page.locator(`[id="${id}"]`).first().screenshot({ path: path.join(outDir, `${name}__${id}.png`) }); } catch {}
  }
  console.log(`rendered ${name} (+${ids.length} frames)`);
  await page.close();
}
await browser.close();
server.close();
