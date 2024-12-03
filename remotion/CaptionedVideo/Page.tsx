import React, { useEffect } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { fitText } from "@remotion/layout-utils";
// import { makeTransform } from "@remotion/animation-utils";
import { TikTokPage } from "@remotion/captions";
import { cn } from "../../lib/utils";

interface Props {
  enterProgress: number;
  page: TikTokPage;
  fontSize: number;
  color: string;
  strokeColor: string;
  stroke: "none" | "s" | "m" | "l";
  fontFamily: string;
  fontWeight: number;
  fontUppercase: boolean;
  fontShadow: "none" | "s" | "m" | "l";
  animation: string;
  isAnimationActive: boolean;
  isMotionBlurActive: boolean;
  highlightKeywords: boolean;
  mainHighlightColor: string;
  secondHighlightColor: string;
  thirdHighlightColor: string;
  top: number;
  className?: string;
}

export const Page: React.FC<Props> = ({
  enterProgress,
  page,
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
  className = "",
}) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  // Calculate fitted text size
  const fittedText = fitText({
    fontFamily,
    text: page.text,
    withinWidth: width - ((width * 1.2)- width),
    textTransform: "none",
  });

  const finalFontSize = Math.min(fontSize, fittedText.fontSize);

  // Animation transforms
  // We will define using CSS animations
  const getAnimationTransform = () => {
    if (!isAnimationActive) return "";

    switch (animation) {
      case "updown": {
        const progress = interpolate(frame % 30, [0, 15, 30], [0, -10, 0]);
        return `translateY(${progress}px)`;
      }
      case "bounce": {
        const progress = interpolate(frame % 60, [0, 30, 60], [0, 20, 0]);
        return `translateY(${progress}px)`;
      }
      case "shake": {
        const progress = interpolate(frame % 20, [0, 5, 10, 15, 20], [-5, 5, -5, 5, -5]);
        return `translateX(${progress}px)`;
      }
      default:
        return "";
    }
  };

  const getStrokeClass = () => `stroke-${stroke}`;
  const getShadowClass = () => `shadow-${fontShadow}`;
  

  const animationTransform = getAnimationTransform();
  const motionBlurFilter = isMotionBlurActive ? 'blur(0.5px)' : 'none';

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",

        "--stroke-color": strokeColor,
        "--main-color": mainHighlightColor,
        "--second-color": secondHighlightColor,
        "--text-color": color,

      } as React.CSSProperties}
      className={className}
    >
      <div 
        className={cn(
          "absolute max-w-fit caption-container z-20 text-center", getShadowClass(), getStrokeClass(),
        )}
        style={{
          position: "absolute",
          top: top,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
          <div 
            className="caption-box" 
            style={{
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
            }}
          >
            {page.tokens.map((token, index) => {
              const startRelativeToSequence = token.fromMs - page.startMs;
              const endRelativeToSequence = token.toMs - page.startMs;
              const active =
                startRelativeToSequence <= timeInMs &&
                endRelativeToSequence > timeInMs;

              return (
                <span key={index} className="relative">
                  <span
                    className={cn("caption-word px-2 sb-text-shadow-sm", active && 'highlight-word')}
                    style={{
                      transform: animationTransform,
                      color: active ? mainHighlightColor : color,
                      fontFamily,
                      fontSize: finalFontSize,
                      fontWeight,
                      textTransform: fontUppercase ? "uppercase" : "none",
                      filter: motionBlurFilter,
                      WebkitTextStrokeColor: strokeColor
                    }}
                    data-text={token.text}
                  >
                    {token.text}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
    </AbsoluteFill>
  );
};
