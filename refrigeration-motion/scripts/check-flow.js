// Checks the refrigerant particle flow over every frame of the video:
//  - no particle jumps between consecutive frames (except wrapping the loop)
//  - no gap along the loop wider than the designed gas spacing
//  - particles never overlap (liquid is packed, not stacked)
const RC = require('../src/render.js');

const { fps, duration } = RC.TL;
const frames = Math.round(fps * duration);
const maxStep = 8; // px per frame; gas moves ~3.2 px/frame
let worstStep = 0;
let worstGap = 0;
let minGap = Infinity;
let prev = null;
for (let f = 0; f < frames; f++) {
  const ps = RC.particlesAt(f / fps);
  if (prev) {
    for (let i = 0; i < ps.length; i++) {
      let ds = ps[i].s - prev[i].s;
      if (ds < -RC.LEN / 2) ds += RC.LEN; // wrapped past the start of the loop
      if (ds < 0) throw new Error(`frame ${f}: particle ${i} moved backwards`);
      worstStep = Math.max(worstStep, ds);
    }
  }
  const s = ps.map((p) => p.s).sort((a, b) => a - b);
  for (let i = 0; i < s.length; i++) {
    const gap = (i + 1 < s.length ? s[i + 1] : s[0] + RC.LEN) - s[i];
    worstGap = Math.max(worstGap, gap);
    minGap = Math.min(minGap, gap);
  }
  prev = ps;
}
const ok = worstStep <= maxStep && worstGap <= 42 * 1.01 && minGap >= 11.5;
console.log(`${RC.N} particles, ${frames} frames`);
console.log(`largest move per frame : ${worstStep.toFixed(2)} px (limit ${maxStep})`);
console.log(`widest gap along loop  : ${worstGap.toFixed(2)} px (gas spacing 42)`);
console.log(`tightest gap along loop: ${minGap.toFixed(2)} px (particle diameter 12)`);
console.log(ok ? 'PASS: continuous flow, no breaks' : 'FAIL');
process.exit(ok ? 0 : 1);
