import { Composition } from 'remotion';
import React from 'react';
import { OnboardingVideo } from './Video';

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="OnboardingVideo"
        component={OnboardingVideo}
        durationInFrames={1500} // 50 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
