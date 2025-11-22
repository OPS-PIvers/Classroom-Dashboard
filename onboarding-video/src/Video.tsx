import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Sequence, spring, Video, staticFile, OffthreadVideo } from 'remotion';
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

// Stylized cursor component
const StylizedCursor: React.FC<{
    x: number;
    y: number;
    clicking?: boolean;
    visible?: boolean;
}> = ({ x, y, clicking = false, visible = true }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const clickScale = clicking
        ? spring({ frame, fps, from: 1, to: 0.8, config: { damping: 20, stiffness: 300 } })
        : 1;

    if (!visible) return null;

    return (
        <div style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: `scale(${clickScale})`,
            pointerEvents: 'none',
            zIndex: 1000,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                    d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.84a.5.5 0 0 0-.85.37Z"
                    fill="white"
                    stroke="#1e293b"
                    strokeWidth="1.5"
                />
            </svg>
            {clicking && (
                <div style={{
                    position: 'absolute',
                    top: -10,
                    left: -10,
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '2px solid rgba(99, 102, 241, 0.5)',
                    animation: 'ripple 0.3s ease-out',
                }} />
            )}
        </div>
    );
};

// Typing text animation component
const TypingText: React.FC<{
    text: string;
    startFrame?: number;
    charsPerFrame?: number;
    style?: React.CSSProperties;
}> = ({ text, startFrame = 0, charsPerFrame = 0.5, style }) => {
    const frame = useCurrentFrame();
    const elapsed = Math.max(0, frame - startFrame);
    const chars = Math.min(Math.floor(elapsed * charsPerFrame), text.length);
    const displayText = text.slice(0, chars);
    const showCursor = elapsed > 0 && chars < text.length;

    return (
        <span style={style}>
            {displayText}
            {showCursor && (
                <span style={{
                    opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                    color: COLORS.PRIMARY_PURPLE,
                }}>|</span>
            )}
        </span>
    );
};

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

// Video demo component with pan/zoom effects
const VideoDemo: React.FC<{
    src: string;
    title: string;
    description: string;
    accentColor?: string;
    panZoom?: {
        startScale?: number;
        endScale?: number;
        startX?: number;
        endX?: number;
        startY?: number;
        endY?: number;
    };
    cursorPath?: Array<{ frame: number; x: number; y: number; click?: boolean }>;
}> = ({
    src,
    title,
    description,
    accentColor = COLORS.TIME_MANAGEMENT,
    panZoom = {},
    cursorPath = []
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const {
        startScale = 1,
        endScale = 1.05,
        startX = 50,
        endX = 50,
        startY = 50,
        endY = 50,
    } = panZoom;

    // Pan/zoom interpolation
    const scale = interpolate(frame, [0, durationInFrames], [startScale, endScale], { extrapolateRight: 'clamp' });
    const translateX = interpolate(frame, [0, durationInFrames], [startX - 50, endX - 50], { extrapolateRight: 'clamp' });
    const translateY = interpolate(frame, [0, durationInFrames], [startY - 50, endY - 50], { extrapolateRight: 'clamp' });

    // Title animations
    const titleSlide = spring({ frame, fps, from: -30, to: 0, config: { damping: 15 } });
    const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

    const descOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });
    const descSlide = spring({ frame: frame - 5, fps, from: 20, to: 0, config: { damping: 15 } });

    const videoScale = spring({ frame: frame - 8, fps, from: 0.95, to: 1, config: { damping: 12, stiffness: 100 } });
    const videoOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' });

    // Fade out at end
    const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' });

    // Find current cursor position
    let cursorX = 0;
    let cursorY = 0;
    let cursorClicking = false;
    let cursorVisible = false;

    if (cursorPath.length > 0) {
        for (let i = cursorPath.length - 1; i >= 0; i--) {
            if (frame >= cursorPath[i].frame) {
                const current = cursorPath[i];
                const next = cursorPath[i + 1];

                if (next) {
                    const progress = (frame - current.frame) / (next.frame - current.frame);
                    cursorX = interpolate(progress, [0, 1], [current.x, next.x], { extrapolateRight: 'clamp' });
                    cursorY = interpolate(progress, [0, 1], [current.y, next.y], { extrapolateRight: 'clamp' });
                } else {
                    cursorX = current.x;
                    cursorY = current.y;
                }
                cursorClicking = current.click || false;
                cursorVisible = true;
                break;
            }
        }
    }

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
                marginBottom: 20
            }}>
                <h2 style={{
                    fontSize: 52,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontWeight: 700,
                    color: COLORS.TEXT_PRIMARY,
                    margin: 0,
                    letterSpacing: '-0.02em'
                }}>
                    <TypingText text={title} startFrame={5} charsPerFrame={1.5} />
                </h2>
            </div>

            <div style={{
                transform: `translateY(${descSlide}px)`,
                opacity: descOpacity,
                textAlign: 'center',
                marginBottom: 30
            }}>
                <p style={{
                    fontSize: 24,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    color: COLORS.TEXT_SECONDARY,
                    margin: 0,
                    fontWeight: 400
                }}>{description}</p>
            </div>

            <div style={{
                transform: `scale(${videoScale})`,
                opacity: videoOpacity,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                borderRadius: 16,
                overflow: 'hidden',
                background: 'white',
                position: 'relative',
            }}>
                <div style={{
                    transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
                    transformOrigin: 'center center',
                }}>
                    <OffthreadVideo
                        src={staticFile(src)}
                        style={{
                            width: 1200,
                            height: 675,
                            objectFit: 'cover',
                        }}
                    />
                </div>

                {/* Stylized cursor overlay */}
                <StylizedCursor
                    x={cursorX}
                    y={cursorY}
                    clicking={cursorClicking}
                    visible={cursorVisible}
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

// Video duration per demo (in frames at 30fps)
const DEMO_DURATION = 180; // 6 seconds per demo
const HEADER_DURATION = 60; // 2 seconds per category header
const INTRO_DURATION = 120; // 4 seconds intro
const OUTRO_DURATION = 150; // 5 seconds outro

export const OnboardingVideo: React.FC = () => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    const progress = frame / durationInFrames;

    let currentFrame = 0;

    return (
        <AbsoluteFill style={{ backgroundColor: 'white' }}>
            {/* Intro */}
            <Sequence from={currentFrame} durationInFrames={INTRO_DURATION}>
                <Title title="Classroom Dashboard" subtitle="THE ULTIMATE TEACHER'S COMPANION" />
            </Sequence>
            {currentFrame += INTRO_DURATION}

            {/* Time Management Category */}
            <Sequence from={currentFrame} durationInFrames={HEADER_DURATION}>
                <CategoryHeader
                    title="Time Management"
                    subtitle="Keep your class on schedule"
                    icon="⏰"
                    color={COLORS.TIME_MANAGEMENT}
                />
            </Sequence>
            {currentFrame += HEADER_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="clock.webm"
                    title="Clock Widget"
                    description="Display time in analog or digital format"
                    accentColor={COLORS.TIME_MANAGEMENT}
                    panZoom={{ startScale: 1, endScale: 1.08, startY: 45, endY: 55 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="timer.webm"
                    title="Timer Widget"
                    description="Countdown timer for activities and transitions"
                    accentColor={COLORS.TIME_MANAGEMENT}
                    panZoom={{ startScale: 1.05, endScale: 1, startX: 45, endX: 55 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="timetable.webm"
                    title="Timetable Widget"
                    description="Display your class schedule at a glance"
                    accentColor={COLORS.TIME_MANAGEMENT}
                    panZoom={{ startScale: 1, endScale: 1.06 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            {/* Classroom Management Category */}
            <Sequence from={currentFrame} durationInFrames={HEADER_DURATION}>
                <CategoryHeader
                    title="Classroom Management"
                    subtitle="Maintain focus and productivity"
                    icon="📊"
                    color={COLORS.CLASSROOM_MANAGEMENT}
                />
            </Sequence>
            {currentFrame += HEADER_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="traffic.webm"
                    title="Traffic Light Widget"
                    description="Visual indicator for noise levels and behavior"
                    accentColor={COLORS.CLASSROOM_MANAGEMENT}
                    panZoom={{ startScale: 1.02, endScale: 1.08, startY: 48, endY: 52 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="sound.webm"
                    title="Sound Level Monitor"
                    description="Real-time classroom noise detection"
                    accentColor={COLORS.CLASSROOM_MANAGEMENT}
                    panZoom={{ startScale: 1, endScale: 1.05 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="checklist.webm"
                    title="Checklist Widget"
                    description="Track tasks and daily routines"
                    accentColor={COLORS.CLASSROOM_MANAGEMENT}
                    panZoom={{ startScale: 1.04, endScale: 1, startX: 52, endX: 48 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            {/* Interactive Tools Category */}
            <Sequence from={currentFrame} durationInFrames={HEADER_DURATION}>
                <CategoryHeader
                    title="Interactive Tools"
                    subtitle="Engage students with fun activities"
                    icon="🎲"
                    color={COLORS.INTERACTIVE_TOOLS}
                />
            </Sequence>
            {currentFrame += HEADER_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="random.webm"
                    title="Random Name Picker"
                    description="Fairly select students for activities"
                    accentColor={COLORS.INTERACTIVE_TOOLS}
                    panZoom={{ startScale: 1, endScale: 1.07, startY: 47, endY: 53 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="dice.webm"
                    title="Dice Widget"
                    description="Roll dice for games and activities"
                    accentColor={COLORS.INTERACTIVE_TOOLS}
                    panZoom={{ startScale: 1.03, endScale: 1.08 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="poll.webm"
                    title="Poll Widget"
                    description="Quick student voting and surveys"
                    accentColor={COLORS.INTERACTIVE_TOOLS}
                    panZoom={{ startScale: 1, endScale: 1.06, startX: 48, endX: 52 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            {/* Content & Media Category */}
            <Sequence from={currentFrame} durationInFrames={HEADER_DURATION}>
                <CategoryHeader
                    title="Content & Media"
                    subtitle="Share and display information"
                    icon="🎨"
                    color={COLORS.CONTENT_MEDIA}
                />
            </Sequence>
            {currentFrame += HEADER_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="text.webm"
                    title="Text Widget"
                    description="Display instructions and announcements"
                    accentColor={COLORS.CONTENT_MEDIA}
                    panZoom={{ startScale: 1.02, endScale: 1.07, startY: 46, endY: 54 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="drawing.webm"
                    title="Drawing Widget"
                    description="Whiteboard for sketches and diagrams"
                    accentColor={COLORS.CONTENT_MEDIA}
                    panZoom={{ startScale: 1, endScale: 1.05 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="embed.webm"
                    title="Embed Widget"
                    description="Embed websites and external content"
                    accentColor={COLORS.CONTENT_MEDIA}
                    panZoom={{ startScale: 1.04, endScale: 1, startX: 53, endX: 47 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="qr.webm"
                    title="QR Code Widget"
                    description="Share links instantly with students"
                    accentColor={COLORS.CONTENT_MEDIA}
                    panZoom={{ startScale: 1, endScale: 1.06 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            {/* Additional Features */}
            <Sequence from={currentFrame} durationInFrames={HEADER_DURATION}>
                <CategoryHeader
                    title="Additional Features"
                    subtitle="Save, share, and collaborate"
                    icon="✨"
                    color={COLORS.PRIMARY_PURPLE}
                />
            </Sequence>
            {currentFrame += HEADER_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="backgrounds.webm"
                    title="Custom Backgrounds"
                    description="Personalize your dashboard appearance"
                    accentColor={COLORS.PRIMARY_PURPLE}
                    panZoom={{ startScale: 1, endScale: 1.05 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="save_load.webm"
                    title="Save & Load"
                    description="Save your layouts and restore them anytime"
                    accentColor={COLORS.PRIMARY_PURPLE}
                    panZoom={{ startScale: 1.02, endScale: 1.07 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            <Sequence from={currentFrame} durationInFrames={DEMO_DURATION}>
                <VideoDemo
                    src="teacher_session.webm"
                    title="Live Sessions"
                    description="Share your dashboard with students in real-time"
                    accentColor={COLORS.PRIMARY_PURPLE}
                    panZoom={{ startScale: 1, endScale: 1.06, startY: 48, endY: 52 }}
                />
            </Sequence>
            {currentFrame += DEMO_DURATION}

            {/* End Screen */}
            <Sequence from={currentFrame} durationInFrames={OUTRO_DURATION}>
                <EndScreen />
            </Sequence>

            {/* Progress bar */}
            <ProgressBar progress={progress} />
        </AbsoluteFill>
    );
};
