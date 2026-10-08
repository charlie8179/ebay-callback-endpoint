# The Refrigeration Cycle — JavaScript motion graphic

45 s · 1920×1080 (16:9) · 60 fps · narrated. Every frame comes from one pure function of time, `drawFrame(ctx, t)` in `src/render.js`. It draws on an HTML canvas, so the same `t` always gives the same picture.

**Output:** `out/refrigeration-cycle-60fps.mp4` · verification sheet: `out/contact-sheet.png`

## Storyboard (approved)

| # | Beat | Time | What happens | Voiceover |
|---|------|------|--------------|-----------|
| 1 | Overview | 0:00–0:09.8 | Loop draws itself, components and labels fade in, refrigerant starts flowing | "A refrigerator is a closed loop. One refrigerant travels round and round, picking up heat inside and dumping it outside." |
| 2 | Compression | 0:09.8–0:18.4 | Compressor glows and pumps; vapor goes in light blue, comes out red. Readout 1.3 → 10 bar, −10 → 65 °C | "The compressor squeezes cool, low-pressure vapor into a hot, high-pressure gas, like a bike pump warming up as you push." |
| 3 | Condensation | 0:18.4–0:26.4 | Condenser glows, heat ripples rise to the room; particles fade red → orange and bunch up as gas becomes liquid. 10 bar, 65 → 35 °C | "In the condenser, the gas is hotter than the room, so heat flows out. It cools and condenses into a liquid." |
| 4 | Expansion | 0:26.4–0:34.8 | Valve glows, frost sparkles; particles leave dark blue. 10 → 1.3 bar, 35 → −20 °C | "The liquid is forced through a narrow expansion valve. Pressure drops suddenly, and its temperature plunges below freezing." |
| 5 | Evaporation | 0:34.8–0:45 | Evaporator glows, heat ripples flow in from the fridge; particles fade dark → light blue and spread out. Finale: everything lights up, "Heat in → heat out. Repeat." | "Now colder than the food, it absorbs heat in the evaporator and boils back into vapor, ready for the compressor again." |

Beat times are not hand-set: `make-voiceover.js` measures each spoken line and builds `src/timeline.js` from it. Each beat starts 0.5 s before its line, and each readout animates while its line is spoken.

## How the animation works

- **State depends on position, not time.** The cycle runs in steady state, so colour (red / orange-red / dark blue / light blue), pressure and density are a function of where a particle is in the loop.
- **Flow without breaks.** Particles are spaced evenly in *mass*, not distance, and advance at a constant mass rate. Liquid (3.5× denser) automatically packs tight and moves slowly, and gas spreads out and moves fast, exactly like real mass flow. `npm run check` verifies all 2,700 frames: no jumps, no gaps, no overlaps.

## Pipeline

```bash
npm install
PIPER_VOICE=/path/en-us-lessac-medium.onnx npm run voiceover  # Piper TTS -> audio/voiceover.wav + src/timeline.js
npm run check     # particle-flow continuity over every frame
npm run sheet     # Playwright renders key frames, FFmpeg tiles out/contact-sheet.png
npm run frames    # Playwright renders all 2700 frames to out/frames/
npm run stitch    # FFmpeg: frames + voiceover -> out/refrigeration-cycle-60fps.mp4
```

Open `index.html` in a browser to watch the animation live (no audio).

**Tools:** Canvas 2D, Playwright + headless Chromium, FFmpeg, [Piper](https://github.com/rhasspy/piper) TTS (voice: `en-us-lessac-medium`, from Piper's v0.0.2 GitHub release). The Lessac voice's training data is under the [Blizzard 2013 Lessac license](https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html), so check it before commercial use, or swap in your own recording: replace `audio/voiceover.wav`, adjust `src/timeline.js`, and re-run `frames` and `stitch`.
