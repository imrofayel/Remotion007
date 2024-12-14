import { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  random,
  Sequence,
  useVideoConfig,
  Video,
} from "remotion";
import { z } from "zod";
import SubtitlePage from "./SubtitlePage";
import { Caption, createTikTokStyleCaptions } from "@remotion/captions";
import { DURATION_IN_FRAMES, VIDEO_HEIGHT, VIDEO_WIDTH } from "../../types/constants";
import { PhotoTransition, TimelinePhoto } from "../../components/PhotoTransition";

const BASE_SWITCH_SPEED = 300;

export const captionedVideoSchema = z.object({
  src: z.string(),
  fontSize: z.number().optional(),
  color: z.string().optional(),
  strokeColor: z.string().optional(),
  stroke: z.enum(["none", "s", "m", "l"]).optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.number().optional(),
  fontUppercase: z.boolean().optional(),
  fontShadow: z.enum(["none", "s", "m", "l"]).optional(),
  animation: z.string().optional(),
  isAnimationActive: z.boolean().optional(),
  isMotionBlurActive: z.boolean().optional(),
  highlightKeywords: z.boolean().optional(),
  mainHighlightColor: z.string().optional(),
  secondHighlightColor: z.string().optional(),
  thirdHighlightColor: z.string().optional(),
  top: z.number().optional(),
  left: z.number().optional(),
  aspectRatio: z.string().optional(),
  className: z.string().optional(),
  chunkSize: z.number().optional(),
  photos: z.array(z.any()).optional(),
  durationInFrames: z.number().optional(),
  fitMode: z.enum(['fill', 'fit']).optional(),
  captions: z.array(z.object({
    text: z.string(),
    startMs: z.number(),
    endMs: z.number(),
    timestampMs: z.number(),
    confidence: z.number(),
  })).optional(),
});

export const CaptionedVideo: React.FC<z.infer<typeof captionedVideoSchema>> = ({
  src,
  fontSize = 120,
  color = "white",
  strokeColor = "black",
  stroke = "m",
  fontFamily = "Inter",
  fontWeight = 700,
  fontUppercase = false,
  fontShadow = "s",
  animation = "none",
  isAnimationActive = false,
  isMotionBlurActive = false,
  highlightKeywords = false,
  mainHighlightColor = "#39E508",
  secondHighlightColor = "#fdfa14",
  thirdHighlightColor = "#f01916",
  top = 1000,
  aspectRatio = "9:16",
  chunkSize = 2,
  left = 0,
  className,
  photos = [],
  durationInFrames,
  fitMode,
  captions = [],
}) => {
  const [subtitles, setSubtitles] = useState<Caption[]>(captions);
  const [handle] = useState(() => delayRender(
    `Loading video with src="${src}"`,
    {
      timeoutInMilliseconds: 60000
    }
  ));
  const { fps } = useVideoConfig();

  const captionSwitchSpeedValue = useMemo(() =>
    BASE_SWITCH_SPEED * chunkSize,
    [chunkSize]
  );

  // Update subtitles when captions prop changes
  useEffect(() => {
    if (captions.length > 0) {
      setSubtitles(captions);
    }
  }, [captions]);

  // Ensure video is loaded
  useEffect(() => {
    if (src) {
      const videoElement = document.createElement('video');
      videoElement.src = src;
      videoElement.onloadeddata = () => {
        continueRender(handle);
      };
      videoElement.onerror = () => {
        console.error('Video failed to load:', src);
        continueRender(handle);
      };
    }
  }, [src, handle]);

  const { pages } = useMemo(() => {
    return createTikTokStyleCaptions({
      combineTokensWithinMilliseconds: captionSwitchSpeedValue,
      captions: subtitles ?? [],
      // groupBy: {
      //   type: "words",
      //   numberOfWords: chunkSize,
      // }
    });
  }, [subtitles, captionSwitchSpeedValue]);

  return (
    <AbsoluteFill>
      {/* Video Layer */}
      <AbsoluteFill style={{
        backgroundColor: 'black',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}>
        <Video
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </AbsoluteFill>

      {/* Captions Layer */}
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const subtitleStartFrame = Math.floor((page.startMs / 1000) * fps);
        const subtitleEndFrame = Math.min(
          nextPage ? Math.floor((nextPage.startMs / 1000) * fps) : Infinity,
          subtitleStartFrame + Math.floor((captionSwitchSpeedValue / 1000) * fps)
        );
        const durationInFrames = subtitleEndFrame - subtitleStartFrame;
        if (durationInFrames <= 0) {
          return null;
        }

        return (
          <Sequence
            key={index}
            from={subtitleStartFrame}
            durationInFrames={durationInFrames}
          >
            <SubtitlePage
              key={index}
              enterProgress={subtitleStartFrame / fps}
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
              left={left}
              className={className}
            />
          </Sequence>
        );
      })}

      {/* Photos Layer */}
      {photos && photos.length > 0 && (
        <PhotoTransition
          photos={Array.isArray(photos) ? photos.map((photo: TimelinePhoto | string) => {
            if (typeof photo === 'string') {
              return {
                id: `photo-${random(1000)}`,
                src: photo,
                startFrame: 0,
                durationInFrames: durationInFrames || DURATION_IN_FRAMES,
              };
            }
            return photo;
          }) : photos}
          videoConfig={{
            width: aspectRatio === "9:16" ? 1080 : VIDEO_WIDTH,
            height: aspectRatio === "9:16" ? 1920 : VIDEO_HEIGHT,
          }}
          className="z-10"
          fitMode={fitMode}
        />
      )}
    </AbsoluteFill>
  );
};
