import { Composition } from 'remotion';
import React from 'react';
import { OnboardingVideo } from './Video';

export const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="OnboardingVideo"
        component={OnboardingVideo}
        durationInFrames={6960} // Updated based on dynamic lengths (approx 3m 52s)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
