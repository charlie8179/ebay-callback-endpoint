import { useMemo } from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { FADE_OUT, LABEL_IN, SCENE_FRAMES, strokeSchedule } from './timing.js';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const Scene = ({ paths, label }: { paths: string[]; label: string }) => {
  const frame = useCurrentFrame();
  const schedule = useMemo(() => strokeSchedule(paths), [paths]);

  // Whole board wipes out at the very end, after the drawing is complete.
  const boardOpacity = interpolate(frame, [SCENE_FRAMES - FADE_OUT, SCENE_FRAMES], [1, 0], clamp);
  const labelIn = interpolate(frame, [LABEL_IN, LABEL_IN + 14], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ opacity: boardOpacity, alignItems: 'center' }}>
      <svg viewBox="0 0 800 500" width={1280} height={800} style={{ marginTop: 60 }}>
        <g fill="none" stroke="#000" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
          {paths.map((d, i) => {
            const { start, end, length } = schedule[i];
            const drawn = interpolate(frame, [start, end], [0, 1], {
              ...clamp,
              easing: Easing.inOut(Easing.sin),
            });
            if (drawn === 0) return null;
            return (
              <path
                key={i}
                d={d}
                strokeDasharray={length}
                strokeDashoffset={length * (1 - drawn)}
              />
            );
          })}
        </g>
      </svg>
      <div
        style={{
          marginTop: 30,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          fontSize: 60,
          color: '#000',
          opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * 16}px)`,
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};
