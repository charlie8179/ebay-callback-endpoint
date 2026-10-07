// Writes each scene's drawing to svg/<id>.svg (black strokes, no fills).
import { writeFileSync, mkdirSync } from 'node:fs';
import { scenes } from '../src/scenes.js';

const outDir = new URL('../svg/', import.meta.url);
mkdirSync(outDir, { recursive: true });

for (const scene of scenes) {
  const body = scene.paths.map((d) => `  <path d="${d}"/>`).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <title>${scene.label}</title>
  <g fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
${body.replace(/^/gm, '  ')}
  </g>
</svg>
`;
  writeFileSync(new URL(`${scene.id}.svg`, outDir), svg);
  console.log(`svg/${scene.id}.svg  (${scene.paths.length} strokes)`);
}
