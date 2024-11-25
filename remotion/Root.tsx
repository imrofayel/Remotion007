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

export const RemotionRoot: React.FC = () => {

  const [videoSrc,] = useState<string>("/sample-video.mp4");

  const captionedVideoProps = useMemo(() => {
    return {
      src: videoSrc,
    };
  }, [videoSrc]);

  return (
    <>
      <Composition
        id={COMP_NAME}
        component={CaptionedVideo}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={captionedVideoProps}
      />
    </>
  );
};
