import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Page } from "./Page";
import { TikTokPage } from "@remotion/captions";

interface SubtitlePageProps {
  page: TikTokPage;
  fontSize?: number;
  fontColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  highlightColor?: string;
}

const SubtitlePage: React.FC<SubtitlePageProps> = ({ 
  page,
  fontSize,
  fontColor,
  strokeColor,
  strokeWidth,
  highlightColor
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
    <AbsoluteFill>
      <Page 
        enterProgress={enter} 
        page={page}
        fontSize={fontSize}
        fontColor={fontColor}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        highlightColor={highlightColor}
      />
    </AbsoluteFill>
  );
};

export default SubtitlePage;
