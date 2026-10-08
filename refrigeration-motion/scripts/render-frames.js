// Renders frames of drawFrame(ctx, t) in headless Chromium via Playwright.
//   node scripts/render-frames.js                 all 2700 frames -> out/frames/00000.png ...
//   node scripts/render-frames.js --times 1,9.5   just those times -> out/sheet-frames/t1.000.png ...
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TIMELINE = require('../src/timeline.js');

(async () => {
  const timesArg = process.argv.indexOf('--times');
  const jobs = [];
  let outDir;
  if (timesArg > -1) {
    outDir = path.join(ROOT, 'out/sheet-frames');
    for (const t of process.argv[timesArg + 1].split(',').map(Number)) {
      jobs.push({ t, file: `t${t.toFixed(3)}.png` });
    }
  } else {
    outDir = path.join(ROOT, 'out/frames');
    const n = Math.round(TIMELINE.duration * TIMELINE.fps);
    for (let f = 0; f < n; f++) jobs.push({ t: f / TIMELINE.fps, file: `${String(f).padStart(5, '0')}.png` });
  }
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.evaluate(() => window.ready);

  const started = Date.now();
  for (let i = 0; i < jobs.length; i++) {
    const { t, file } = jobs[i];
    const url = await page.evaluate((time) => window.renderAt(time), t);
    fs.writeFileSync(path.join(outDir, file), Buffer.from(url.split(',')[1], 'base64'));
    if ((i + 1) % 300 === 0) console.log(`${i + 1}/${jobs.length} frames (${((Date.now() - started) / 1000).toFixed(0)} s)`);
  }
  await browser.close();
  console.log(`wrote ${jobs.length} frames to ${path.relative(ROOT, outDir)}/`);
})();
