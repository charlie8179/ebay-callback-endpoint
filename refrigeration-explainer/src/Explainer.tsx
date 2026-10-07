import { AbsoluteFill, Sequence } from 'remotion';
import { Scene } from './Scene';
import { scenes } from './scenes.js';
import { SCENE_FRAMES } from './timing.js';

export const Explainer = () => (
  <AbsoluteFill style={{ backgroundColor: '#fff' }}>
    {scenes.map((scene, i) => (
      <Sequence key={scene.id} from={i * SCENE_FRAMES} durationInFrames={SCENE_FRAMES}>
        <Scene paths={scene.paths} label={scene.label} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
