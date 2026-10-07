import { getLength } from '@remotion/paths';

// 6 scenes x 7.5 s = 45 s at 30 fps.
export const FPS = 30;
export const SCENE_FRAMES = 225;
export const DRAW_START = 10; // pen starts
export const DRAW_END = 150; // last stroke is complete by this frame
export const STROKE_GAP = 3; // pen-lift pause between strokes
export const LABEL_IN = DRAW_END + 4; // label appears after the drawing is done
export const FADE_OUT = 12; // scene wipes in its last frames

// Split the drawing window across strokes in proportion to their length, so
// the "pen" moves at a steady speed. Returns [{start, end}] in scene frames.
export const strokeSchedule = (paths) => {
  const lengths = paths.map((d) => getLength(d));
  const total = lengths.reduce((a, b) => a + b, 0);
  const drawFrames = DRAW_END - DRAW_START - STROKE_GAP * (paths.length - 1);
  let t = DRAW_START;
  return lengths.map((len) => {
    const start = t;
    const end = start + (len / total) * drawFrames;
    t = end + STROKE_GAP;
    return { start, end, length: len };
  });
};
