import { Composition } from 'remotion';
import { OnboardingVideo } from './Video';

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="OnboardingVideo"
        component={OnboardingVideo}
        durationInFrames={900} // 30 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
