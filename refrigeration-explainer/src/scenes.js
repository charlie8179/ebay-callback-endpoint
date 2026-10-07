// Single source of truth for the explainer: script text, labels and the
// line drawings. Every drawing lives in an 800x500 viewBox and is a list of
// strokes, drawn on in array order. `scripts/export-svgs.js` writes these to
// svg/, and the Remotion composition animates the same paths.

// Small circle as a closed path (used for gas particles).
const dot = (cx, cy, r = 12) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;

// Vertical wavy "heat" line rising from (x, y) with `n` half-waves.
const riseWave = (x, y, n = 4, amp = 12, step = 24) =>
  `M${x} ${y} q${-amp} ${-step / 2} 0 ${-step}` + ` t0 ${-step}`.repeat(n - 1);

// Horizontal wavy line heading right from (x, y).
const sideWave = (x, y, n = 4, amp = 18, step = 40) =>
  `M${x} ${y} q${step / 2} ${-amp} ${step} 0` + ` t${step} 0`.repeat(n - 1);

// Serpentine coil: vertical runs at x0, x0+gap, ... between yTop and yBottom,
// starting at the bottom of the first run and joined by round bends.
const coil = (x0, runs, gap, yTop, yBottom) => {
  const r = gap / 2;
  let d = `M${x0} ${yBottom}`;
  for (let i = 0; i < runs; i++) {
    const x = x0 + i * gap;
    const up = i % 2 === 0;
    d += ` V${up ? yTop : yBottom}`;
    if (i < runs - 1) {
      d += up
        ? ` A${r} ${r} 0 0 1 ${x + gap} ${yTop}`
        : ` A${r} ${r} 0 0 0 ${x + gap} ${yBottom}`;
    }
  }
  return d;
};

// Clockwise arc on the loop circle from angle a to b (degrees, 0 = top),
// plus a chevron arrowhead at its end.
const LOOP = { cx: 400, cy: 250, r: 170 };
const onLoop = (deg) => {
  const t = (deg * Math.PI) / 180;
  return [LOOP.cx + LOOP.r * Math.sin(t), LOOP.cy - LOOP.r * Math.cos(t)];
};
const f = (n) => Math.round(n * 10) / 10;
const loopArc = (a, b) => {
  const [x1, y1] = onLoop(a);
  const [x2, y2] = onLoop(b);
  return `M${f(x1)} ${f(y1)} A${LOOP.r} ${LOOP.r} 0 0 1 ${f(x2)} ${f(y2)}`;
};
const loopHead = (deg) => {
  const t = (deg * Math.PI) / 180;
  const [px, py] = onLoop(deg);
  const [dx, dy] = [Math.cos(t), Math.sin(t)]; // clockwise tangent
  const [nx, ny] = [-dy, dx];
  const back = 20;
  const wing = 13;
  const w1 = [px - back * dx + wing * nx, py - back * dy + wing * ny];
  const w2 = [px - back * dx - wing * nx, py - back * dy - wing * ny];
  return `M${f(w1[0])} ${f(w1[1])} L${f(px)} ${f(py)} L${f(w2[0])} ${f(w2[1])}`;
};

export const scenes = [
  {
    id: 'scene-1-moves-heat',
    label: 'A fridge moves heat out',
    narration:
      "A fridge doesn't make cold. It moves heat from inside the box to the room outside, like a sponge soaking up water in one place and squeezing it out in another.",
    paths: [
      // fridge body
      'M300 60 H460 Q480 60 480 80 V440 Q480 460 460 460 H300 Q280 460 280 440 V80 Q280 60 300 60 Z',
      // freezer divider and handles
      'M280 190 H480',
      'M455 110 V160',
      'M455 230 V320',
      // snowflake: cold inside
      'M380 330 V400',
      'M350 348 L410 382',
      'M350 382 L410 348',
      // heat leaving out the side
      sideWave(510, 200),
      'M655 186 L675 200 L655 214',
      sideWave(510, 260),
      'M655 246 L675 260 L655 274',
      sideWave(510, 320),
      'M655 306 L675 320 L655 334',
    ],
  },
  {
    id: 'scene-2-compressor',
    label: 'Compressor: squeeze the gas, it gets hot',
    narration:
      'First, the compressor squeezes the refrigerant gas into a small space. Like pumping up a bike tyre, squeezing a gas makes it hot.',
    paths: [
      // cylinder
      'M300 120 V420 H500 V120',
      // piston, rod and handle
      'M310 220 H490 V250 H310 Z',
      'M400 220 V70',
      'M340 70 H460',
      // push-down arrow
      'M240 90 V200',
      'M222 178 L240 204 L258 178',
      // gas particles, packed tight
      dot(345, 300),
      dot(405, 290),
      dot(460, 305),
      dot(365, 365),
      dot(430, 355),
      dot(400, 398),
      // heat radiating out
      sideWave(530, 300, 3, 14, 30),
      sideWave(530, 360, 3, 14, 30),
    ],
  },
  {
    id: 'scene-3-condenser',
    label: 'Condenser: heat escapes, gas turns to liquid',
    narration:
      'The hot gas flows through the coils on the back of the fridge. It hands its heat to the room, cools down, and turns into a liquid.',
    paths: [
      // hot gas in, through the coil, liquid out
      'M110 420 H200 ' + coil(200, 8, 60, 160, 420).replace(/^M\S+ \S+/, '') + ' H690',
      // heat rising off the coil
      riseWave(290, 115, 4),
      riseWave(410, 115, 4),
      riseWave(530, 115, 4),
      // liquid drop
      'M735 375 C735 375 760 410 760 422 A25 25 0 0 1 710 422 C710 410 735 375 735 375 Z',
    ],
  },
  {
    id: 'scene-4-expansion-valve',
    label: 'Expansion valve: pressure drops, it gets icy cold',
    narration:
      'Next, the liquid is forced through a tiny opening. Its pressure drops all at once and it turns icy cold, like the spray from an aerosol can.',
    paths: [
      // pipe narrowing to a nozzle and widening again
      'M80 190 H320 L380 235 H420 L480 190 H720',
      'M80 310 H320 L380 265 H420 L480 310 H720',
      // flow arrow
      'M120 250 H240',
      'M218 234 L244 250 L218 266',
      // spray fanning out of the nozzle
      'M465 228 L495 216',
      'M475 250 L510 250',
      'M465 272 L495 284',
      // snowflake: very cold
      'M630 212 V288',
      'M597 231 L663 269',
      'M597 269 L663 231',
    ],
  },
  {
    id: 'scene-5-evaporator',
    label: 'Evaporator: soaks up heat, boils back to gas',
    narration:
      'Inside the fridge, the cold liquid runs through another coil. It soaks up heat from your food and boils back into a gas.',
    paths: [
      // inside of the fridge
      'M200 80 H600 V440 H200 Z',
      // evaporator coil along the top
      coil(260, 8, 40, 120, 220),
      // warm bowl of food
      'M290 395 H470 Q460 435 380 435 Q300 435 290 395 Z',
      // heat rising from the food into the coil
      riseWave(340, 375, 4),
      'M328 272 L340 252 L352 272',
      riseWave(380, 375, 4),
      'M368 272 L380 252 L392 272',
      riseWave(420, 375, 4),
      'M408 272 L420 252 L432 272',
    ],
  },
  {
    id: 'scene-6-loop',
    label: 'Squeeze, release, expand, absorb. Repeat.',
    narration:
      'The gas flows back to the compressor and the loop starts again, carrying heat out of the fridge over and over.',
    paths: [
      // compressor (top): cylinder with piston
      'M375 55 H425 V105 H375 Z',
      'M375 78 H425',
      'M400 78 V35',
      loopArc(20, 70),
      loopHead(70),
      // condenser (right): zigzag coil
      'M555 220 L585 232 L555 244 L585 256 L555 268 L585 280',
      loopArc(110, 160),
      loopHead(160),
      // expansion valve (bottom): narrow neck
      'M365 400 L435 440 V400 L365 440 Z',
      loopArc(200, 250),
      loopHead(250),
      // evaporator (left): snowflake
      'M230 215 V285',
      'M200 232 L260 268',
      'M200 268 L260 232',
      loopArc(290, 340),
      loopHead(340),
    ],
  },
];
