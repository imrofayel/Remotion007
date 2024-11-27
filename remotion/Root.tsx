import { Composition } from "remotion";
import {
  COMP_NAME,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../types/constants";
import { useState, useMemo } from "react";
import { CaptionedVideo } from "./CaptionedVideo";
import { staticFile } from "remotion";

export const RemotionRoot: React.FC = () => {
  // Use staticFile to correctly reference the video in public folder
  const [videoSrc,] = useState<string>(staticFile("sample-video.mp4"));

  const captionedVideoProps = useMemo(() => ({
    src: videoSrc,
    fontSize: 80,
    fontColor: "white",
    strokeColor: "black",
    strokeWidth: 4,
    highlightColor: "#39E508",
    wordsPerCaption: 2,
    yPosition: 1000,
    aspectRatio: "9:16",
    onError: (error: Error) => {
      console.error('Video error:', error);
    },
  }), [videoSrc]);

  return (
    <>
      <Composition
        id={COMP_NAME}
        component={CaptionedVideo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={captionedVideoProps as any}
      />
    </>
  );
};
