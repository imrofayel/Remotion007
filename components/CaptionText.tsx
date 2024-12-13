import React from 'react';
import { spring, useVideoConfig } from 'remotion';

interface CaptionTextProps {
  text: string;
  frame: number;
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
  frame,
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
  const { fps } = useVideoConfig();
  console.log('CaptionText rendering with:', { text, frame, duration }); // Debug log

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

  const style: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight,
    color,
    textTransform: fontUppercase ? 'uppercase' : 'none',
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    top,
    left,
    WebkitTextStroke: `${getStrokeWidth()}px ${strokeColor}`,
    textShadow: getShadow(),
    opacity: isAnimationActive ? progress : 1,
    zIndex: 20, // Make sure captions are above other elements
  };

  return (
    <div style={style}>
      {text}
    </div>
  );
};
