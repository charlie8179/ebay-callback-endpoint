// Asserts every stroke of every drawing is finished before its scene ends.
import { scenes } from '../src/scenes.js';
import { strokeSchedule, SCENE_FRAMES, FADE_OUT, FPS } from '../src/timing.js';

let ok = true;
scenes.forEach((scene, i) => {
  const sched = strokeSchedule(scene.paths);
  const last = Math.max(...sched.map((s) => s.end));
  const deadline = SCENE_FRAMES - FADE_OUT;
  const zero = sched.filter((s) => !(s.length > 0));
  const pass = last < deadline && zero.length === 0;
  ok &&= pass;
  console.log(
    `${pass ? 'PASS' : 'FAIL'} scene ${i + 1}: ${sched.length} strokes, drawing done at ` +
      `${(last / FPS).toFixed(2)}s of ${(SCENE_FRAMES / FPS).toFixed(2)}s ` +
      `(fade starts ${(deadline / FPS).toFixed(2)}s)`,
  );
});
process.exit(ok ? 0 : 1);
