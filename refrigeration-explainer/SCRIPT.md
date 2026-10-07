# The Refrigeration Cycle — 45-second whiteboard explainer

**Big idea:** a fridge doesn't *make* cold. It works like a sponge: it soaks up heat inside the box and wrings it out into the room.

6 scenes × 7.5 s = 45 s · 1920×1080 · 30 fps · one black line drawing per scene, drawn on stroke by stroke.

Each scene's timing: the pen starts at 0.33 s, the **last stroke finishes at 5.0 s**, the label fades in at 5.1 s, the board holds, then fades out from 7.1 s to 7.5 s.

| # | Time | Drawing (SVG) | Label under drawing | Narration (for voice-over) |
|---|------|---------------|---------------------|----------------------------|
| 1 | 0:00–0:07.5 | Fridge with a snowflake inside and three wavy heat arrows leaving the side — `svg/scene-1-moves-heat.svg` | A fridge moves heat out | A fridge doesn't make cold. It moves heat from inside the box to the room outside, like a sponge soaking up water in one place and squeezing it out in another. |
| 2 | 0:07.5–0:15 | Piston pushed down into a cylinder, gas particles packed tight, heat waves coming off — `svg/scene-2-compressor.svg` | Compressor: squeeze the gas, it gets hot | First, the compressor squeezes the refrigerant gas into a small space. Like pumping up a bike tyre, squeezing a gas makes it hot. |
| 3 | 0:15–0:22.5 | One long serpentine coil with heat rising off it and a liquid drop at the outlet — `svg/scene-3-condenser.svg` | Condenser: heat escapes, gas turns to liquid | The hot gas flows through the coils on the back of the fridge. It hands its heat to the room, cools down, and turns into a liquid. |
| 4 | 0:22.5–0:30 | Pipe narrowing to a tiny nozzle, flow arrow in, spray and a snowflake out — `svg/scene-4-expansion-valve.svg` | Expansion valve: pressure drops, it gets icy cold | Next, the liquid is forced through a tiny opening. Its pressure drops all at once and it turns icy cold, like the spray from an aerosol can. |
| 5 | 0:30–0:37.5 | Inside of the fridge: coil along the top, warm bowl of food, heat arrows rising into the coil — `svg/scene-5-evaporator.svg` | Evaporator: soaks up heat, boils back to gas | Inside the fridge, the cold liquid runs through another coil. It soaks up heat from your food and boils back into a gas. |
| 6 | 0:37.5–0:45 | A loop with mini icons for compressor → condenser → valve → evaporator and clockwise arrows — `svg/scene-6-loop.svg` | Squeeze, release, expand, absorb. Repeat. | The gas flows back to the compressor and the loop starts again, carrying heat out of the fridge over and over. |

## Files

- `src/scenes.js` — the script text and the SVG path data (one source for both the SVG files and the video)
- `svg/` — the six drawings as standalone SVGs (black strokes, no fills)
- `out/refrigeration-cycle.mp4` — the rendered video

## Rebuild

```bash
npm install
npm run svgs     # regenerate svg/ from src/scenes.js
npm run check    # assert every stroke finishes before its scene ends
REMOTION_BROWSER=/path/to/chrome-headless-shell npm run render   # REMOTION_BROWSER optional
```

Strokes share the 0.33–5.0 s drawing window in proportion to their length, so the pen moves at a steady speed. The timing is fixed by design, so `npm run check` will fail if a change ever pushes a stroke past its scene.
