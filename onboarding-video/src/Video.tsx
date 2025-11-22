import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Sequence, spring, Img, staticFile } from 'remotion';
import React from 'react';

// Color constants
const COLORS = {
    TIME_MANAGEMENT: '#6366f1',
    CLASSROOM_MANAGEMENT: '#10b981',
    INTERACTIVE_TOOLS: '#f59e0b',
    CONTENT_MEDIA: '#ec4899',
    PRIMARY_PURPLE: '#a855f7',
    DARK_BG: '#0f172a',
    LIGHT_BG: '#f8fafc',
    TEXT_PRIMARY: '#1e293b',
    TEXT_SECONDARY: '#64748b',
    TEXT_MUTED: '#94a3b8',
} as const;

// Reusable animated particle component
const AnimatedParticle: React.FC<{
    color: string;
    opacity: number;
    speed: number;
    offset: number;
    size: number;
}> = ({ color, opacity, speed, offset, size }) => {
    const frame = useCurrentFrame();

    const x = 50 + Math.sin(frame * speed + offset) * size;
    const y = 50 + Math.cos(frame * speed + offset) * size;

    return (
        <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: `radial-gradient(circle at ${x}% ${y}%, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 50%)`,
        }} />
    );
};

// Progress bar component
const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
        }}>
            <div style={{
                width: `${progress * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${COLORS.TIME_MANAGEMENT}, ${COLORS.PRIMARY_PURPLE}, ${COLORS.CONTENT_MEDIA})`
            }} />
        </div>
    );
};

// Enhanced Screenshot component
const Screenshot: React.FC<{
    src: string;
    title: string;
    description: string;
    accentColor?: string;
}> = ({ src, title, description, accentColor = COLORS.TIME_MANAGEMENT }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const titleSlide = spring({ frame, fps, from: -30, to: 0, config: { damping: 15 } });
    const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

    const descOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });
    const descSlide = spring({ frame: frame - 5, fps, from: 20, to: 0, config: { damping: 15 } });

    const imageScale = spring({ frame: frame - 8, fps, from: 0.95, to: 1, config: { damping: 12, stiffness: 100 } });
    const imageOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' });

    // Fade out at end
    const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });

    return (
        <AbsoluteFill style={{
            backgroundColor: COLORS.LIGHT_BG,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
            opacity: fadeOut
        }}>
            {/* Accent line */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 4,
                background: accentColor
            }} />

            <div style={{
                transform: `translateY(${titleSlide}px)`,
                opacity: titleOpacity,
                textAlign: 'center',
                marginBottom: 30
            }}>
                <h2 style={{
                    fontSize: 56,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 700,
                    color: COLORS.TEXT_PRIMARY,
                    margin: 0,
                    letterSpacing: '-0.02em'
                }}>{title}</h2>
            </div>

            <div style={{
                transform: `translateY(${descSlide}px)`,
                opacity: descOpacity,
                textAlign: 'center',
                marginBottom: 40
            }}>
                <p style={{
                    fontSize: 26,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: COLORS.TEXT_SECONDARY,
                    margin: 0,
                    fontWeight: 400
                }}>{description}</p>
            </div>

            <div style={{
                transform: `scale(${imageScale})`,
                opacity: imageOpacity,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                borderRadius: 16,
                overflow: 'hidden',
                background: 'white'
            }}>
                <Img
                    src={staticFile(src)}
                    alt={`${title} - ${description}`}
                    style={{
                        maxWidth: 1400,
                        maxHeight: 650,
                        objectFit: 'contain'
                    }}
                />
            </div>
        </AbsoluteFill>
    );
};

// Category header component
const CategoryHeader: React.FC<{ title: string; subtitle: string; icon: string; color: string }> = ({ title, subtitle, icon, color }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const iconScale = spring({ frame, fps, from: 0, to: 1, config: { damping: 10, stiffness: 100 } });
    const iconRotate = spring({ frame, fps, from: -180, to: 0, config: { damping: 15 } });
    const titleOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });
    const titleSlide = spring({ frame: frame - 5, fps, from: 40, to: 0, config: { damping: 15 } });
    const subtitleOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });

    const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });

    return (
        <AbsoluteFill style={{
            background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: fadeOut
        }}>
            <div style={{
                transform: `scale(${iconScale}) rotate(${iconRotate}deg)`,
                fontSize: 80,
                marginBottom: 30
            }}>
                {icon}
            </div>
            <div style={{
                transform: `translateY(${titleSlide}px)`,
                opacity: titleOpacity
            }}>
                <h2 style={{
                    fontSize: 64,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 700,
                    color: COLORS.TEXT_PRIMARY,
                    margin: 0,
                    letterSpacing: '-0.02em'
                }}>{title}</h2>
            </div>
            <div style={{ opacity: subtitleOpacity, marginTop: 15 }}>
                <p style={{
                    fontSize: 28,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: COLORS.TEXT_SECONDARY,
                    margin: 0
                }}>{subtitle}</p>
            </div>
        </AbsoluteFill>
    );
};

// Enhanced Title component
const Title: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
    const titleScale = spring({ frame, fps, from: 0.9, to: 1, config: { damping: 12 } });
    const titleY = spring({ frame, fps, from: 20, to: 0, config: { damping: 15 } });

    const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
    const subtitleY = spring({ frame: frame - 20, fps, from: 20, to: 0, config: { damping: 15 } });

    const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });

    return (
        <AbsoluteFill style={{
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: COLORS.DARK_BG,
            opacity: fadeOut
        }}>
            {/* Animated background particles */}
            <AnimatedParticle
                color={COLORS.TIME_MANAGEMENT}
                opacity={0.15}
                speed={0.02}
                offset={0}
                size={20}
            />
            <AnimatedParticle
                color={COLORS.PRIMARY_PURPLE}
                opacity={0.1}
                speed={0.015}
                offset={Math.PI}
                size={30}
            />

            <div style={{
                opacity: titleOpacity,
                transform: `scale(${titleScale}) translateY(${titleY}px)`,
                textAlign: 'center',
                zIndex: 1
            }}>
                <h1 style={{
                    fontSize: 110,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 800,
                    margin: 0,
                    background: `linear-gradient(90deg, ${COLORS.TIME_MANAGEMENT}, ${COLORS.PRIMARY_PURPLE}, ${COLORS.CONTENT_MEDIA})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    letterSpacing: '-0.03em'
                }}>{title}</h1>
                {subtitle && (
                    <h2 style={{
                        fontSize: 36,
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontWeight: 400,
                        marginTop: 25,
                        color: COLORS.TEXT_MUTED,
                        opacity: subtitleOpacity,
                        transform: `translateY(${subtitleY}px)`,
                        letterSpacing: '0.05em'
                    }}>{subtitle}</h2>
                )}
            </div>
        </AbsoluteFill>
    );
};

// Enhanced EndScreen
const EndScreen: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const titleOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
    const titleScale = spring({ frame, fps, from: 0.9, to: 1, config: { damping: 12 } });

    const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
    const subtitleY = spring({ frame: frame - 20, fps, from: 30, to: 0, config: { damping: 15 } });

    const ctaOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp' });
    const ctaScale = spring({ frame: frame - 40, fps, from: 0.8, to: 1, config: { damping: 10, stiffness: 100 } });

    return (
        <AbsoluteFill style={{
            backgroundColor: COLORS.DARK_BG,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column'
        }}>
            {/* Animated background */}
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: `radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.2) 0%, transparent 60%)`,
            }} />

            <h1 style={{
                fontSize: 72,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 700,
                color: 'white',
                opacity: titleOpacity,
                transform: `scale(${titleScale})`,
                textAlign: 'center',
                margin: 0,
                letterSpacing: '-0.02em',
                zIndex: 1
            }}>
                Ready to transform your classroom?
            </h1>

            <h2 style={{
                fontSize: 32,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: COLORS.TEXT_MUTED,
                marginTop: 25,
                opacity: subtitleOpacity,
                transform: `translateY(${subtitleY}px)`,
                fontWeight: 400,
                zIndex: 1
            }}>
                Everything you need in one dashboard
            </h2>

            <div style={{
                marginTop: 50,
                opacity: ctaOpacity,
                transform: `scale(${ctaScale})`,
                zIndex: 1
            }}>
                <div style={{
                    padding: '20px 50px',
                    borderRadius: 12,
                    background: `linear-gradient(90deg, ${COLORS.TIME_MANAGEMENT}, ${COLORS.PRIMARY_PURPLE}, ${COLORS.CONTENT_MEDIA})`,
                    fontSize: 28,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 600,
                    color: 'white',
                    letterSpacing: '0.02em'
                }}>
                    Get Started Free
                </div>
            </div>
        </AbsoluteFill>
    );
};

export const OnboardingVideo: React.FC = () => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    const progress = frame / durationInFrames;

    return (
        <AbsoluteFill style={{ backgroundColor: 'white' }}>
            {/* Intro */}
            <Sequence from={0} durationInFrames={120}>
                <Title title="Classroom Dashboard" subtitle="THE ULTIMATE TEACHER'S COMPANION" />
            </Sequence>

            {/* Time Management Category */}
            <Sequence from={120} durationInFrames={60}>
                <CategoryHeader
                    title="Time Management"
                    subtitle="Keep your class on schedule"
                    icon="⏰"
                    color={COLORS.TIME_MANAGEMENT}
                />
            </Sequence>

            <Sequence from={180} durationInFrames={90}>
                <Screenshot
                    src="clock_comparison.png"
                    title="Clock Widget"
                    description="Display time in analog or digital format"
                    accentColor={COLORS.TIME_MANAGEMENT}
                />
            </Sequence>

            <Sequence from={270} durationInFrames={90}>
                <Screenshot
                    src="timer_comparison.png"
                    title="Timer Widget"
                    description="Countdown timer for activities and transitions"
                    accentColor={COLORS.TIME_MANAGEMENT}
                />
            </Sequence>

            <Sequence from={360} durationInFrames={90}>
                <Screenshot
                    src="timetable_comparison.png"
                    title="Timetable Widget"
                    description="Display your class schedule at a glance"
                    accentColor={COLORS.TIME_MANAGEMENT}
                />
            </Sequence>

            {/* Classroom Management Category */}
            <Sequence from={450} durationInFrames={60}>
                <CategoryHeader
                    title="Classroom Management"
                    subtitle="Maintain focus and productivity"
                    icon="📊"
                    color={COLORS.CLASSROOM_MANAGEMENT}
                />
            </Sequence>

            <Sequence from={510} durationInFrames={90}>
                <Screenshot
                    src="traffic_comparison.png"
                    title="Traffic Light Widget"
                    description="Visual indicator for noise levels and behavior"
                    accentColor={COLORS.CLASSROOM_MANAGEMENT}
                />
            </Sequence>

            <Sequence from={600} durationInFrames={90}>
                <Screenshot
                    src="sound_comparison.png"
                    title="Sound Level Monitor"
                    description="Real-time classroom noise detection"
                    accentColor={COLORS.CLASSROOM_MANAGEMENT}
                />
            </Sequence>

            <Sequence from={690} durationInFrames={90}>
                <Screenshot
                    src="checklist_comparison.png"
                    title="Checklist Widget"
                    description="Track tasks and daily routines"
                    accentColor={COLORS.CLASSROOM_MANAGEMENT}
                />
            </Sequence>

            {/* Interactive Tools Category */}
            <Sequence from={780} durationInFrames={60}>
                <CategoryHeader
                    title="Interactive Tools"
                    subtitle="Engage students with fun activities"
                    icon="🎲"
                    color={COLORS.INTERACTIVE_TOOLS}
                />
            </Sequence>

            <Sequence from={840} durationInFrames={90}>
                <Screenshot
                    src="random_comparison.png"
                    title="Random Name Picker"
                    description="Fairly select students for activities"
                    accentColor={COLORS.INTERACTIVE_TOOLS}
                />
            </Sequence>

            <Sequence from={930} durationInFrames={90}>
                <Screenshot
                    src="dice_comparison.png"
                    title="Dice Widget"
                    description="Roll dice for games and activities"
                    accentColor={COLORS.INTERACTIVE_TOOLS}
                />
            </Sequence>

            <Sequence from={1020} durationInFrames={90}>
                <Screenshot
                    src="poll_comparison.png"
                    title="Poll Widget"
                    description="Quick student voting and surveys"
                    accentColor={COLORS.INTERACTIVE_TOOLS}
                />
            </Sequence>

            {/* Content & Media Category */}
            <Sequence from={1110} durationInFrames={60}>
                <CategoryHeader
                    title="Content & Media"
                    subtitle="Share and display information"
                    icon="🎨"
                    color={COLORS.CONTENT_MEDIA}
                />
            </Sequence>

            <Sequence from={1170} durationInFrames={90}>
                <Screenshot
                    src="text_comparison.png"
                    title="Text Widget"
                    description="Display instructions and announcements"
                    accentColor={COLORS.CONTENT_MEDIA}
                />
            </Sequence>

            <Sequence from={1260} durationInFrames={90}>
                <Screenshot
                    src="drawing_comparison.png"
                    title="Drawing Widget"
                    description="Whiteboard for sketches and diagrams"
                    accentColor={COLORS.CONTENT_MEDIA}
                />
            </Sequence>

            <Sequence from={1350} durationInFrames={90}>
                <Screenshot
                    src="embed_comparison.png"
                    title="Embed Widget"
                    description="Embed websites and external content"
                    accentColor={COLORS.CONTENT_MEDIA}
                />
            </Sequence>

            <Sequence from={1440} durationInFrames={90}>
                <Screenshot
                    src="qr_comparison.png"
                    title="QR Code Widget"
                    description="Share links instantly with students"
                    accentColor={COLORS.CONTENT_MEDIA}
                />
            </Sequence>

            <Sequence from={1530} durationInFrames={90}>
                <Screenshot
                    src="webcam_comparison.png"
                    title="Webcam Widget"
                    description="Display camera feed for demos"
                    accentColor={COLORS.CONTENT_MEDIA}
                />
            </Sequence>

            {/* End Screen */}
            <Sequence from={1620} durationInFrames={150}>
                <EndScreen />
            </Sequence>

            {/* Progress bar */}
            <ProgressBar progress={progress} />
        </AbsoluteFill>
    );
};
