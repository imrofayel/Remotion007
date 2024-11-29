import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Page } from "./Page";
import { TikTokPage } from "@remotion/captions";

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

const SubtitlePage: React.FC<Props> = ({
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
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
    durationInFrames: 5,
  });

  return (
    <Page
      enterProgress={enter}
      page={page}
      fontSize={fontSize}
      color={color}
      strokeColor={strokeColor}
      stroke={stroke}
      fontFamily={fontFamily}
      fontWeight={fontWeight}
      fontUppercase={fontUppercase}
      fontShadow={fontShadow}
      animation={animation}
      isAnimationActive={isAnimationActive}
      isMotionBlurActive={isMotionBlurActive}
      highlightKeywords={highlightKeywords}
      mainHighlightColor={mainHighlightColor}
      secondHighlightColor={secondHighlightColor}
      thirdHighlightColor={thirdHighlightColor}
      top={top}
      className={className}
    />
  );
};

export default SubtitlePage;
