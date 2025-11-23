import { Composition } from 'remotion';
import React from 'react';
import { OnboardingVideo } from './Video';

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="OnboardingVideo"
        component={OnboardingVideo}
        durationInFrames={6510} // 217 seconds at 30fps (16 demos with full durations + headers + intro/outro)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
