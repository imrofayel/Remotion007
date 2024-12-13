import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  continueRender,
  delayRender,
  Sequence,
  useVideoConfig,
  Video,
} from "remotion";
import { z } from "zod";
import SubtitlePage from "./SubtitlePage";
import { getVideoMetadata } from "@remotion/media-utils";
import { Caption, createTikTokStyleCaptions } from "@remotion/captions";
import { DURATION_IN_FRAMES, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "../../types/constants";
import { PhotoTransition } from "../../components/PhotoTransition";

export type SubtitleProp = {
  startInSeconds: number;
  text: string;
};

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
  photos: z.array(z.string()).optional(),
  durationInFrames: z.number().optional(),
});

export const calculateCaptionedVideoMetadata: CalculateMetadataFunction<
  z.infer<typeof captionedVideoSchema>
> = async ({ props }) => {
  try {
    const metadata = await getVideoMetadata(props.src);
    return {
      fps: VIDEO_FPS,
      durationInFrames: Math.floor(metadata.durationInSeconds * VIDEO_FPS),
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
    };
  } catch (error) {
    console.error('Error calculating metadata:', error);
    return {
      fps: VIDEO_FPS,
      durationInFrames: DURATION_IN_FRAMES,
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
    };
  }
};

const BASE_SWITCH_SPEED = 300;

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
}) => {
  const [subtitles, setSubtitles] = useState<Caption[]>([]);
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

  const subtitlesFile = src
    .replace(/^\/uploads\//, '/subs/')
    .replace(/\.(mp4|mkv|mov|webm)$/, '.json');

  const fetchSubtitles = useCallback(async () => {
    try {
      console.log('Fetching subtitles from:', subtitlesFile);
      const res = await fetch(subtitlesFile);
      if (!res.ok) {
        throw new Error(`Failed to fetch subtitles: ${res.statusText}`);
      }
      const data = (await res.json()) as Caption[];
      setSubtitles(data);
      continueRender(handle);
    } catch (e) {
      console.error('Error fetching subtitles:', e);
      continueRender(handle);
    }
  }, [handle, subtitlesFile]);

  useEffect(() => {
    fetchSubtitles();
  }, [fetchSubtitles]);

  const { pages } = useMemo(() => {
    return createTikTokStyleCaptions({
      combineTokensWithinMilliseconds: captionSwitchSpeedValue,
      captions: subtitles ?? [],
    });
  }, [subtitles, captionSwitchSpeedValue]);

  return (
    <AbsoluteFill>
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
          onError={(err) => {
            console.error('Video playback error:', err);
            continueRender(handle);
          }}
          onLoad={() => {
            continueRender(handle);
          }}
        />
      </AbsoluteFill>

      {/* Spider-Man style photo frames */}
      {photos && photos.length > 0 && (
        <PhotoTransition
          photos={photos}
          durationInFrames={durationInFrames || 400}
          videoConfig={{
            width: aspectRatio === "9:16" ? 1080 : 1920,
            height: aspectRatio === "9:16" ? 1920 : 1080,
          }}
          className="z-10"
        />
      )}

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
              className={className}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
