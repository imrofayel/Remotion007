import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Page } from "./Page";
import { TikTokPage } from "@remotion/captions";

interface Props {
  page: TikTokPage;
  fontSize?: number;
  fontColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  highlightColor?: string;
  yPosition?: number;
  aspectRatio?: string;
}

const SubtitlePage: React.FC<Props> = ({
  page,
  fontSize,
  fontColor,
  strokeColor,
  strokeWidth,
  highlightColor,
  yPosition,
  aspectRatio,
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
      fontColor={fontColor}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      highlightColor={highlightColor}
      yPosition={yPosition}
      aspectRatio={aspectRatio}
    />
  );
};

export default SubtitlePage;
