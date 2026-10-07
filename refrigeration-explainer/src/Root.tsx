import { Composition } from 'remotion';
import { Explainer } from './Explainer';
import { scenes } from './scenes.js';
import { FPS, SCENE_FRAMES } from './timing.js';

export const RemotionRoot = () => (
  <Composition
    id="RefrigerationCycle"
    component={Explainer}
    durationInFrames={SCENE_FRAMES * scenes.length}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
