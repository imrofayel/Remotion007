import React from 'react';
import { spring, useVideoConfig, useCurrentFrame } from 'remotion';

interface CaptionTextProps {
  text: string;
  duration: number;
  fontSize: number;
  color: string;
  strokeColor: string;
  stroke: 'none' | 's' | 'm' | 'l';
  fontFamily: string;
  fontWeight: number;
  fontUppercase: boolean;
  fontShadow: 'none' | 's' | 'm' | 'l';
  animation: string;
  isAnimationActive: boolean;
  isMotionBlurActive: boolean;
  highlightKeywords: boolean;
  mainHighlightColor: string;
  secondHighlightColor: string;
  thirdHighlightColor: string;
  top: number;
  left: number;
}

export const CaptionText: React.FC<CaptionTextProps> = ({
  text,
  duration,
  fontSize,
  color,
  strokeColor,
  stroke,
  fontFamily,
  fontWeight,
  fontUppercase,
  fontShadow,
  animation,
  isAnimationActive,
  isMotionBlurActive,
  highlightKeywords,
  mainHighlightColor,
  secondHighlightColor,
  thirdHighlightColor,
  top,
  left,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  console.log('CaptionText rendering:', {
    text,
    frame,
    duration,
    fps,
    currentTime: frame / fps
  });

  const progress = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
  });

  const getStrokeWidth = () => {
    switch (stroke) {
      case 's':
        return fontSize * 0.05;
      case 'm':
        return fontSize * 0.1;
      case 'l':
        return fontSize * 0.15;
      default:
        return 0;
    }
  };

  const getShadow = () => {
    switch (fontShadow) {
      case 's':
        return '2px 2px 4px rgba(0,0,0,0.5)';
      case 'm':
        return '4px 4px 8px rgba(0,0,0,0.5)';
      case 'l':
        return '6px 6px 12px rgba(0,0,0,0.5)';
      default:
        return 'none';
    }
  };

  const getAnimationTransform = () => {
    if (!isAnimationActive) return "";

    switch (animation) {
      case "updown": {
        const progress = spring({
          frame: frame % 30,
          fps,
          config: { damping: 10 }
        });
        return `translateY(${progress * -10}px)`;
      }
      case "bounce": {
        const progress = spring({
          frame: frame % 60,
          fps,
          config: { damping: 5 }
        });
        return `translateY(${progress * 20}px)`;
      }
      case "shake": {
        const progress = spring({
          frame: frame % 20,
          fps,
          config: { damping: 3 }
        });
        return `translateX(${progress * 5}px)`;
      }
      default:
        return "";
    }
  };

  const style: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight,
    color,
    textTransform: fontUppercase ? 'uppercase' : 'none',
    position: 'relative',
    width: '100%',
    textAlign: 'center',
    WebkitTextStroke: `${getStrokeWidth()}px ${strokeColor}`,
    textShadow: getShadow(),
    opacity: isAnimationActive ? progress : 1,
    transform: getAnimationTransform(),
    zIndex: 20,
    pointerEvents: 'none',
    padding: '10px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  };

  return (
    <div style={style}>
      {text}
    </div>
  );
};
