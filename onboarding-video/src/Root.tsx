import { Composition } from 'remotion';
import React from 'react';
import { OnboardingVideo } from './Video';

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="OnboardingVideo"
        component={OnboardingVideo}
        durationInFrames={3630} // 121 seconds at 30fps (17 demos + headers + intro/outro)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
