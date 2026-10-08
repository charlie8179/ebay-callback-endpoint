// The Refrigeration Cycle: every frame is a pure function of time.
//
//   drawFrame(ctx, t)  draws the 1920x1080 frame at t seconds.
//   particlesAt(t)     returns refrigerant particle positions (used by the checks).
//
// The refrigerant runs in steady state, so its pressure, temperature, colour
// and density depend on WHERE it is in the loop, not on time. Particles are
// spaced evenly in "mass" rather than distance and advance at a constant mass
// rate: where the refrigerant is dense (liquid) they bunch up and slow down,
// where it is a gas they spread out and speed up, and the flow never breaks.
(function (root) {
  const TL = typeof TIMELINE !== 'undefined' ? TIMELINE : require('./timeline.js');

  const W = 1920;
  const H = 1080;
  const L = 460; // loop left / right / top / bottom
  const R = 1460;
  const T = 300;
  const B = 820;
  const CORNER = 40;
  const COIL_X0 = 760; // condenser and evaporator span x 760..1160
  const COIL_X1 = 1160;
  const COIL_AMP = 30;
  const COIL_WAVES = 6;
  const VALVE_Y = 560;
  const COMP = { x: R, y: 560, w: 150, h: 176 }; // compressor box
  const COMP_IN = 630; // refrigerant enters the compressor box here
  const COMP_OUT = 490; // and leaves here

  const C = {
    bg: '#f6f8fb',
    grid: '#e7ecf2',
    ink: '#1b2430',
    muted: '#64748b',
    tubeEdge: '#9aa7b6',
    tube: '#eef2f6',
    hot: '#e03131', // hot high-pressure gas
    warm: '#e8590c', // warm high-pressure liquid
    cold: '#1d4ed8', // cold low-pressure liquid
    cool: '#74c0fc', // cool low-pressure vapor
    heat: '#f08c00', // heat flow ripples
    frost: '#a5d8ff',
  };

  // ---------- small helpers ----------
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const smooth = (u) => {
    u = clamp01(u);
    return u * u * (3 - 2 * u);
  };
  const ramp = (t, a, b) => smooth((t - a) / (b - a));
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, u) => {
    const [p, q] = [hex(a), hex(b)];
    return `rgb(${p.map((v, i) => Math.round(lerp(v, q[i], clamp01(u)))).join(',')})`;
  };
  // Works for both '#rrggbb' and the 'rgb(r,g,b)' strings mix() returns.
  const rgba = (c, a) =>
    c.startsWith('#') ? `rgba(${hex(c).join(',')},${a})` : c.replace('rgb(', 'rgba(').replace(')', `,${a})`);

  // ---------- the loop path, sampled densely ----------
  // Starts at the compressor outlet and runs: up the right side, left along the
  // top through the condenser, down the left side through the valve, right
  // along the bottom through the evaporator, and up into the compressor.
  const pts = [];
  const add = (x, y) => pts.push([x, y]);
  const line = (x0, y0, x1, y1) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
    for (let i = 1; i <= n; i++) add(lerp(x0, x1, i / n), lerp(y0, y1, i / n));
  };
  const arc = (cx, cy, a0, a1) => {
    const n = 24;
    for (let i = 1; i <= n; i++) {
      const a = lerp(a0, a1, i / n);
      add(cx + CORNER * Math.cos(a), cy + CORNER * Math.sin(a));
    }
  };
  const coil = (y, x0, x1) => {
    const n = 600;
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      add(lerp(x0, x1, u), y - COIL_AMP * Math.sin(u * COIL_WAVES * 2 * Math.PI));
    }
  };
  const PI = Math.PI;
  add(R, COMP_OUT);
  line(R, COMP_OUT, R, T + CORNER);
  arc(R - CORNER, T + CORNER, 0, -PI / 2);
  line(R - CORNER, T, COIL_X1, T);
  const iCondIn = pts.length - 1;
  coil(T, COIL_X1, COIL_X0);
  const iCondOut = pts.length - 1;
  line(COIL_X0, T, L + CORNER, T);
  arc(L + CORNER, T + CORNER, -PI / 2, -PI);
  line(L, T + CORNER, L, VALVE_Y);
  const iValve = pts.length - 1;
  line(L, VALVE_Y, L, B - CORNER);
  arc(L + CORNER, B - CORNER, PI, PI / 2);
  line(L + CORNER, B, COIL_X0, B);
  const iEvapIn = pts.length - 1;
  coil(B, COIL_X0, COIL_X1);
  const iEvapOut = pts.length - 1;
  line(COIL_X1, B, R - CORNER, B);
  arc(R - CORNER, B - CORNER, PI / 2, 0);
  line(R, B - CORNER, R, COMP_IN);
  const iCompIn = pts.length - 1;
  line(R, COMP_IN, R, COMP_OUT);

  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const LEN = cum[cum.length - 1];
  const S = {
    condIn: cum[iCondIn],
    condOut: cum[iCondOut],
    valve: cum[iValve],
    evapIn: cum[iEvapIn],
    evapOut: cum[iEvapOut],
    compIn: cum[iCompIn],
  };

  const search = (arr, v) => {
    let lo = 0;
    let hi = arr.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] <= v) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  const pointAt = (s) => {
    s = ((s % LEN) + LEN) % LEN;
    const i = search(cum, s);
    const u = (s - cum[i]) / (cum[i + 1] - cum[i] || 1);
    return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)];
  };

  // ---------- refrigerant state along the loop ----------
  const GAS = 1;
  const LIQUID = 3.5;
  const MIXTURE = 2.8; // cold liquid with some flash vapor after the valve
  const stateAt = (s) => {
    if (s < S.condIn) return { color: C.hot, density: GAS, k: 0 };
    if (s < S.condOut) {
      const u = (s - S.condIn) / (S.condOut - S.condIn);
      return { color: mix(C.hot, C.warm, u), density: lerp(GAS, LIQUID, smooth(u)), k: 0 };
    }
    if (s < S.valve) return { color: C.warm, density: LIQUID, k: 1 };
    if (s < S.valve + 40) {
      const u = (s - S.valve) / 40;
      return { color: mix(C.warm, C.cold, u), density: lerp(LIQUID, MIXTURE, u), k: 1 };
    }
    if (s < S.evapIn) return { color: C.cold, density: MIXTURE, k: 2 };
    if (s < S.evapOut) {
      const u = (s - S.evapIn) / (S.evapOut - S.evapIn);
      return { color: mix(C.cold, C.cool, u), density: lerp(MIXTURE, GAS, smooth(u)), k: 2 };
    }
    if (s < S.compIn) return { color: C.cool, density: GAS, k: 3 };
    const u = (s - S.compIn) / (LEN - S.compIn);
    return { color: mix(C.cool, C.hot, u), density: GAS, k: 3 };
  };

  // Mass coordinate m(s) = integral of density, tabulated on the path samples.
  const mass = [0];
  for (let i = 1; i < pts.length; i++) {
    const d = stateAt((cum[i] + cum[i - 1]) / 2).density;
    mass.push(mass[i - 1] + d * (cum[i] - cum[i - 1]));
  }
  const MASS = mass[mass.length - 1];
  const GAS_SPACING = 42; // px between particles in gas; liquid is 3.5x tighter
  const N = Math.round(MASS / GAS_SPACING);
  const DM = MASS / N;
  const MASS_RATE = 190; // mass units per second = gas speed in px/s
  const sFromMass = (m) => {
    m = ((m % MASS) + MASS) % MASS;
    const i = search(mass, m);
    const u = (m - mass[i]) / (mass[i + 1] - mass[i] || 1);
    return lerp(cum[i], cum[i + 1], u);
  };

  const particlesAt = (t) => {
    const out = [];
    for (let i = 0; i < N; i++) {
      const s = sFromMass(i * DM + MASS_RATE * t);
      const [x, y] = pointAt(s);
      out.push({ i, s, x, y });
    }
    return out;
  };

  // ---------- timeline helpers ----------
  const beats = TL.beats;
  const beatIndex = (t) => {
    for (let i = beats.length - 1; i >= 0; i--) if (t >= beats[i].start) return i;
    return 0;
  };
  // How strongly component k (0 compressor .. 3 evaporator) is highlighted.
  const highlight = (t, k) => {
    const b = beats[k + 1];
    const own = ramp(t, b.start, b.start + 0.5) * (1 - ramp(t, b.end - 0.4, b.end));
    const finale = ramp(t, TL.repeatStart, TL.repeatStart + 0.6);
    return Math.max(own, finale);
  };
  // Progress of component k's narration (drives its readout values).
  const voProgress = (t, k) => {
    const b = beats[k + 1];
    return smooth((t - b.voStart) / (b.voEnd - b.voStart - 0.6));
  };

  // ---------- drawing ----------
  const font = (size, weight = 600) => `${weight} ${size}px Inter, "DejaVu Sans", sans-serif`;

  function tubePath(ctx, s0, s1) {
    const i0 = search(cum, s0);
    const i1 = search(cum, s1);
    ctx.beginPath();
    ctx.moveTo(pts[i0][0], pts[i0][1]);
    for (let i = i0 + 1; i <= i1 + 1 && i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  }

  function drawBackground(ctx) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 40) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();
  }

  function drawFins(ctx, y, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#c3ccd6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = COIL_X0 - 10; x <= COIL_X1 + 10; x += 14) {
      ctx.moveTo(x, y - 46);
      ctx.lineTo(x, y + 46);
    }
    ctx.stroke();
    ctx.strokeStyle = '#a9b4c1';
    ctx.strokeRect(COIL_X0 - 18, y - 50, COIL_X1 - COIL_X0 + 36, 100);
    ctx.restore();
  }

  function drawTube(ctx, drawn, tintAlpha) {
    const end = drawn * LEN;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    tubePath(ctx, 0, end);
    ctx.strokeStyle = C.tubeEdge;
    ctx.lineWidth = 30;
    ctx.stroke();
    ctx.strokeStyle = C.tube;
    ctx.lineWidth = 24;
    ctx.stroke();
    if (tintAlpha <= 0) return;
    // faint state tint inside the tube: red on the high side, blue on the low
    ctx.lineCap = 'butt';
    for (let s = 0; s < end; s += 12) {
      tubePath(ctx, s, Math.min(s + 13, end));
      ctx.strokeStyle = rgba(stateAt(s + 6).color, 0.22 * tintAlpha);
      ctx.lineWidth = 24;
      ctx.stroke();
    }
    ctx.lineCap = 'round';
  }

  function glow(ctx, color, amount) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 34 * amount;
  }

  function drawCoilHighlight(ctx, s0, s1, color, amount) {
    if (amount <= 0.01) return;
    // Drawn before the tube, so it reads as a halo around the coil and never
    // hides the particles inside.
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    glow(ctx, color, amount);
    tubePath(ctx, s0, s1);
    ctx.strokeStyle = rgba(color, 0.8 * amount);
    ctx.lineWidth = 44;
    ctx.stroke();
    ctx.restore();
  }

  function drawValve(ctx, alpha, hl, t) {
    ctx.save();
    ctx.globalAlpha = alpha;
    glow(ctx, C.cold, hl);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = hl > 0.05 ? mix(C.ink, C.cold, hl) : C.ink;
    ctx.lineWidth = 4;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(L - 34, VALVE_Y + dir * 44);
      ctx.lineTo(L + 34, VALVE_Y + dir * 44);
      ctx.lineTo(L + 5, VALVE_Y + dir * 5);
      ctx.lineTo(L - 5, VALVE_Y + dir * 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    // frost sparkles just below the valve while it is the focus
    const f = Math.max(hl, 0) * alpha;
    if (f > 0.02) {
      ctx.save();
      ctx.strokeStyle = rgba(C.frost, 0.9 * f);
      ctx.lineWidth = 2.5;
      for (let j = 0; j < 9; j++) {
        const phase = (t * 1.3 + j * 0.37) % 1;
        const x = L + (j % 2 ? 1 : -1) * (26 + ((j * 23) % 30));
        const y = VALVE_Y + 60 + ((j * 41) % 110);
        const r = 7 * Math.sin(phase * PI);
        if (r <= 0.5) continue;
        ctx.beginPath();
        ctx.moveTo(x - r, y);
        ctx.lineTo(x + r, y);
        ctx.moveTo(x, y - r);
        ctx.lineTo(x, y + r);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawCompressor(ctx, alpha, hl, t) {
    const { x, y, w, h } = COMP;
    ctx.save();
    ctx.globalAlpha = alpha;
    glow(ctx, C.hot, hl);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = hl > 0.05 ? mix(C.ink, C.hot, hl) : C.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 16);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    // cylinder and pumping piston
    const cylX = x - 38;
    const cylY = y - 56;
    const cylW = 76;
    const cylH = 104;
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.ink;
    ctx.beginPath();
    ctx.moveTo(cylX, cylY);
    ctx.lineTo(cylX, cylY + cylH);
    ctx.lineTo(cylX + cylW, cylY + cylH);
    ctx.lineTo(cylX + cylW, cylY);
    ctx.stroke();
    const speed = 2.2 + 2.0 * hl;
    const py = cylY + 26 + 30 * (0.5 + 0.5 * Math.sin(t * speed * 2 * PI));
    // gas under the piston turns from blue to red as it is squeezed
    ctx.fillStyle = mix(C.cool, C.hot, (py - cylY - 26) / 30);
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillRect(cylX + 3, py + 10, cylW - 6, cylY + cylH - py - 12);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#d5dde6';
    ctx.fillRect(cylX + 3, py, cylW - 6, 12);
    ctx.strokeRect(cylX + 3, py, cylW - 6, 12);
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x, cylY - 18);
    ctx.stroke();
    ctx.restore();
  }

  function drawHeatRipples(ctx, kind, alpha, t) {
    if (alpha <= 0.01) return;
    // condenser: heat rises from the coil into the room
    // evaporator: heat rises from the fridge space into the coil
    const y0 = kind === 'out' ? T - 62 : B + 150;
    const y1 = kind === 'out' ? T - 150 : B + 62;
    ctx.save();
    ctx.strokeStyle = C.heat;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const x of [840, 960, 1080]) {
      for (let j = 0; j < 3; j++) {
        const u = (t * 0.55 + j / 3 + x / 997) % 1;
        const y = lerp(y0, y1, u);
        ctx.globalAlpha = alpha * Math.sin(u * PI);
        ctx.beginPath();
        ctx.moveTo(x - 22, y + 9);
        ctx.quadraticCurveTo(x - 11, y - 6, x, y);
        ctx.quadraticCurveTo(x + 11, y + 6, x + 22, y - 9);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function pill(ctx, cx, cy, text, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = font(24, 600);
    const w = ctx.measureText(text).width + 44;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#c3ccd6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - 22, w, 44, 22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy + 1);
    ctx.restore();
  }

  function label(ctx, text, x, y, align, alpha, color = C.ink) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = font(26, 700);
    ctx.letterSpacing = '2px';
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Live pressure / temperature readout for the component in focus.
  const READOUTS = [
    { x: 1560, y: 600, color: C.hot, p: [1.3, 10], T: [-10, 65] },
    { x: 1200, y: 132, color: C.warm, p: [10, 10], T: [65, 35] },
    { x: 90, y: 600, color: C.cold, p: [10, 1.3], T: [35, -20] },
    { x: 1200, y: 876, color: C.cool, p: [1.3, 1.3], T: [-20, -10] },
  ];
  function drawReadout(ctx, k, t) {
    const r = READOUTS[k];
    const b = beats[k + 1];
    const a =
      ramp(t, b.start, b.start + 0.4) *
      (1 - ramp(t, b.end - 0.4, b.end)) *
      (1 - ramp(t, TL.repeatStart, TL.repeatStart + 0.5)); // clear for the finale
    if (a <= 0.01) return;
    const u = voProgress(t, k);
    const p = lerp(r.p[0], r.p[1], u);
    const temp = lerp(r.T[0], r.T[1], u);
    const w = 300;
    const h = 112;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, w, h, 14);
    ctx.fill();
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.font = font(22, 500);
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'left';
    ctx.fillText('Pressure', r.x + 20, r.y + 34);
    ctx.fillText('Temperature', r.x + 20, r.y + 78);
    ctx.font = font(28, 700);
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'right';
    ctx.fillText(`${p.toFixed(1)} bar`, r.x + w - 20, r.y + 34);
    const tt = Math.round(temp);
    ctx.fillStyle = temp > 20 ? C.hot : temp < 0 ? C.cold : C.ink;
    ctx.fillText(`${tt < 0 ? '−' : ''}${Math.abs(tt)} °C`, r.x + w - 20, r.y + 78);
    ctx.restore();
  }

  const STEPS = [
    { n: '1', text: 'Compress', color: C.hot, ink: '#fff' },
    { n: '2', text: 'Condense', color: C.warm, ink: '#fff' },
    { n: '3', text: 'Expand', color: C.cold, ink: '#fff' },
    { n: '4', text: 'Evaporate', color: C.cool, ink: C.ink },
  ];
  function drawProgress(ctx, t, alpha) {
    const bi = beatIndex(t);
    const finale = ramp(t, TL.repeatStart, TL.repeatStart + 0.6);
    let x = 1860;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = font(22, 600);
    ctx.textBaseline = 'middle';
    const widths = STEPS.map((s) => ctx.measureText(`${s.n}  ${s.text}`).width + 40);
    for (let k = STEPS.length - 1; k >= 0; k--) {
      const s = STEPS[k];
      const w = widths[k];
      x -= w;
      const b = beats[k + 1];
      const on = Math.max(ramp(t, b.start, b.start + 0.4) * (1 - ramp(t, b.end - 0.3, b.end)), finale);
      const done = bi > k + 1;
      ctx.strokeStyle = on > 0.5 || done ? s.color : '#c3ccd6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, 38, w, 44, 22);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      if (on > 0.01) {
        ctx.fillStyle = rgba(s.color, on);
        ctx.fill();
      }
      ctx.stroke();
      ctx.fillStyle = on > 0.5 ? s.ink : done ? s.color : C.muted;
      ctx.textAlign = 'center';
      ctx.fillText(`${s.n}  ${s.text}`, x + w / 2, 61);
      x -= 12;
    }
    ctx.restore();
  }

  const CAPTIONS = [
    'One refrigerant, one closed loop',
    'Squeeze it → hot, high-pressure gas',
    'Heat flows out → gas becomes liquid',
    'Pressure drops → icy cold liquid',
    'Heat flows in → liquid boils to vapor',
  ];
  function drawCaption(ctx, t) {
    const bi = beatIndex(t);
    const b = beats[bi];
    const finale = ramp(t, TL.repeatStart, TL.repeatStart + 0.5);
    const inStart = bi === 0 ? 3.6 : b.start + 0.2;
    let a = ramp(t, inStart, inStart + 0.5) * (1 - ramp(t, b.end - 0.35, b.end));
    if (bi === beats.length - 1) a *= 1 - finale;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(36, 600);
    ctx.fillStyle = C.ink;
    ctx.globalAlpha = a;
    ctx.fillText(CAPTIONS[bi], 960, 560);
    if (finale > 0) {
      ctx.globalAlpha = finale;
      ctx.font = font(40, 700);
      ctx.fillText('Heat in → heat out. Repeat.', 960, 560);
    }
    ctx.restore();
  }

  function drawLegend(ctx, alpha) {
    const rows = [
      [C.hot, 'Hot, high-pressure gas'],
      [C.warm, 'Warm, high-pressure liquid'],
      [C.cold, 'Cold, low-pressure liquid'],
      [C.cool, 'Cool, low-pressure vapor'],
    ];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = font(21, 500);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    rows.forEach(([color, text], i) => {
      const y = 914 + i * 36;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(72, y, 9, 0, 2 * PI);
      ctx.fill();
      ctx.fillStyle = C.ink;
      ctx.fillText(text, 94, y + 1);
    });
    ctx.font = font(18, 500);
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'right';
    ctx.fillText('Typical values for a household fridge (R-134a)', 1860, 1040);
    ctx.restore();
  }

  function drawFrame(ctx, t) {
    const intro = {
      tube: ramp(t, 0, 2.2),
      parts: ramp(t, 1.6, 2.8),
      labels: ramp(t, 2.4, 3.4),
      flow: ramp(t, 2.8, 4.0),
      chrome: ramp(t, 0.3, 1.3),
    };
    const hl = [0, 1, 2, 3].map((k) => highlight(t, k));

    drawBackground(ctx);

    // title
    ctx.save();
    ctx.globalAlpha = intro.chrome;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.ink;
    ctx.font = font(44, 700);
    ctx.fillText('The Refrigeration Cycle', 60, 76);
    ctx.font = font(24, 500);
    ctx.fillStyle = C.muted;
    ctx.fillText('How a fridge moves heat from inside to outside', 60, 112);
    ctx.restore();
    drawProgress(ctx, t, intro.chrome);

    drawFins(ctx, T, intro.parts);
    drawFins(ctx, B, intro.parts);
    drawCoilHighlight(ctx, S.condIn, S.condOut, C.warm, hl[1]);
    drawCoilHighlight(ctx, S.evapIn, S.evapOut, C.cool, hl[3]);
    drawTube(ctx, intro.tube, intro.flow);
    drawValve(ctx, intro.parts, hl[2], t);

    // refrigerant particles
    if (intro.flow > 0) {
      ctx.save();
      ctx.globalAlpha = intro.flow;
      for (const p of particlesAt(t)) {
        ctx.fillStyle = stateAt(p.s).color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, 2 * PI);
        ctx.fill();
      }
      ctx.restore();
    }

    drawCompressor(ctx, intro.parts, hl[0], t);

    // heat exchange with the room and with the fridge space
    drawHeatRipples(ctx, 'out', intro.labels * Math.max(0.35, hl[1]), t);
    drawHeatRipples(ctx, 'in', intro.labels * Math.max(0.35, hl[3]), t);
    pill(ctx, 960, T - 176, 'Room air  25 °C', intro.labels);
    pill(ctx, 960, B + 176, 'Inside the fridge  4 °C', intro.labels);

    // component labels
    label(ctx, 'COMPRESSOR', 1560, 560, 'left', intro.labels, hl[0] > 0.5 ? C.hot : C.ink);
    label(ctx, 'CONDENSER', 960, T + 82, 'center', intro.labels, hl[1] > 0.5 ? C.warm : C.ink);
    label(ctx, 'EXPANSION VALVE', 390, 560, 'right', intro.labels, hl[2] > 0.5 ? C.cold : C.ink);
    label(ctx, 'EVAPORATOR', 960, B - 82, 'center', intro.labels, hl[3] > 0.5 ? C.cold : C.ink);

    for (let k = 0; k < 4; k++) drawReadout(ctx, k, t);
    drawCaption(ctx, t);
    drawLegend(ctx, intro.labels);
  }

  const api = { W, H, drawFrame, particlesAt, stateAt, LEN, N, S, TL };
  if (typeof module !== 'undefined') module.exports = api;
  else root.RefrigerationCycle = api;
})(typeof window !== 'undefined' ? window : globalThis);
