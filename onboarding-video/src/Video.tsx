import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Sequence, spring } from 'remotion';
import React from 'react';

// Reusable components
const Title: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
    const scale = spring({ frame, fps, from: 0.8, to: 1 });

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: 'white' }}>
            <div style={{ opacity, transform: `scale(${scale})`, textAlign: 'center' }}>
                <h1 style={{ fontSize: 100, fontFamily: 'sans-serif', fontWeight: 'bold', margin: 0, background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', color: 'transparent' }}>{title}</h1>
                {subtitle && <h2 style={{ fontSize: 40, fontFamily: 'sans-serif', fontWeight: 'lighter', marginTop: 20, color: '#cbd5e1' }}>{subtitle}</h2>}
            </div>
        </AbsoluteFill>
    );
};

const Feature: React.FC<{ title: string; description: string; icon: string; color: string }> = ({ title, description, icon, color }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const slideIn = spring({ frame, fps, from: 100, to: 0 });
    const opacity = interpolate(frame, [0, 20], [0, 1]);

    return (
        <AbsoluteFill style={{ backgroundColor: 'white', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 50 }}>
             <div style={{
                 transform: `translateY(${slideIn}px)`,
                 opacity,
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 gap: 20
            }}>
                <div style={{ fontSize: 150, color }}>{icon}</div>
                <div style={{ fontSize: 80, fontFamily: 'sans-serif', fontWeight: 'bold', color: '#334155' }}>{title}</div>
                <div style={{ fontSize: 40, fontFamily: 'sans-serif', color: '#64748b', maxWidth: 1000, textAlign: 'center' }}>{description}</div>
            </div>
        </AbsoluteFill>
    );
};

const WidgetShowcase: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Simple representation of widgets popping up
    const widgets = [
        { name: 'Clock', color: '#cbd5e1', x: 200, y: 200 },
        { name: 'Timer', color: '#818cf8', x: 600, y: 200 },
        { name: 'Traffic', color: '#f87171', x: 1000, y: 200 },
        { name: 'Notes', color: '#fbbf24', x: 200, y: 500 },
        { name: 'Checklist', color: '#34d399', x: 600, y: 500 },
        { name: 'Poll', color: '#facc15', x: 1000, y: 500 },
    ];

    return (
        <AbsoluteFill style={{ backgroundColor: '#f1f5f9' }}>
            <div style={{ position: 'absolute', top: 50, width: '100%', textAlign: 'center', fontSize: 60, color: '#334155', fontFamily: 'sans-serif', fontWeight: 'bold' }}>
                Everything you need in one place
            </div>
            {widgets.map((w, i) => {
                const delay = i * 5;
                const scale = spring({ frame: frame - delay, fps, from: 0, to: 1 });
                if (frame < delay) return null;

                return (
                    <div key={i} style={{
                        position: 'absolute',
                        left: w.x + 200, // Center shift
                        top: w.y + 100,
                        width: 300,
                        height: 200,
                        backgroundColor: 'white',
                        borderRadius: 20,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: `scale(${scale})`,
                        border: `2px solid ${w.color}`
                    }}>
                        <span style={{ fontSize: 40, fontFamily: 'sans-serif', color: '#475569' }}>{w.name}</span>
                    </div>
                )
            })}
        </AbsoluteFill>
    )
}

const EndScreen: React.FC = () => {
    const frame = useCurrentFrame();
    const opacity = interpolate(frame, [0, 30], [0, 1]);

    return (
        <AbsoluteFill style={{ backgroundColor: '#0f172a', color: 'white', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ fontSize: 80, fontFamily: 'sans-serif', opacity }}>Ready to transform your classroom?</h1>
             <h2 style={{ fontSize: 40, fontFamily: 'sans-serif', color: '#cbd5e1', marginTop: 20, opacity: interpolate(frame, [20, 50], [0, 1]) }}>
                Try Classroom Dashboard Today
            </h2>
        </AbsoluteFill>
    );
}

export const OnboardingVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>
      <Sequence from={0} durationInFrames={150}>
        <Title title="Classroom Dashboard" subtitle="The Ultimate Teacher's Companion" />
      </Sequence>

      <Sequence from={150} durationInFrames={150}>
         <Feature
            title="Essential Widgets"
            description="Clock, Timer, Traffic Light, and more to manage your class efficiently."
            icon="⏱️"
            color="#6366f1"
         />
      </Sequence>

       <Sequence from={300} durationInFrames={150}>
         <Feature
            title="Interactive Tools"
            description="Random Name Picker, Dice, Polls, and Sound Level Monitor."
            icon="🎲"
            color="#ec4899"
         />
      </Sequence>

       <Sequence from={450} durationInFrames={150}>
         <Feature
            title="Customizable"
            description="Change backgrounds, resize widgets, and save your layouts."
            icon="🎨"
            color="#10b981"
         />
      </Sequence>

      <Sequence from={600} durationInFrames={150}>
        <WidgetShowcase />
      </Sequence>

      <Sequence from={750} durationInFrames={150}>
        <EndScreen />
      </Sequence>
    </AbsoluteFill>
  );
};
