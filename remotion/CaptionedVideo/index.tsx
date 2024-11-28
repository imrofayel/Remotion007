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

export type SubtitleProp = {
  startInSeconds: number;
  text: string;
};

export const captionedVideoSchema = z.object({
  src: z.string(),
  fontSize: z.number().optional(),
  fontColor: z.string().optional(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().optional(),
  highlightColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  rounded: z.enum(["md", "lg"]).optional(),
  wordsPerCaption: z.number().optional(),
  captionSwitchSpeed: z.number().optional(),
  yPosition: z.number().optional(),
  aspectRatio: z.string().optional(),
  onError: z.function().optional(),
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

// Caption Speed
const BASE_SWITCH_SPEED = 300;

export const CaptionedVideo: React.FC<z.infer<typeof captionedVideoSchema>> = ({
  src,
  fontSize = 80,
  fontColor = "white",
  strokeColor = "black",
  strokeWidth = 4,
  highlightColor = "#39E508",
  backgroundColor = "gray",
  rounded = "lg",
  wordsPerCaption = 2,
  captionSwitchSpeed,
  yPosition = 1000,
  aspectRatio = "9:16",
  onError,
}) => {
  const [subtitles, setSubtitles] = useState<Caption[]>([]);
  const [handle] = useState(() => delayRender(
    `Loading video with src="${src}"`,
    {
      timeoutInMilliseconds: 60000 // Increase timeout to 60 seconds
    }
  ));
  const { fps } = useVideoConfig();

  const captionSwitchSpeedValue = useMemo(() =>
    captionSwitchSpeed ?? BASE_SWITCH_SPEED * wordsPerCaption,
    [wordsPerCaption, captionSwitchSpeed]
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
      continueRender(handle); // Continue render even if subtitles fail
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
            continueRender(handle); // Continue render even if video fails
            if (onError) {
              onError(err);
            }
          }}
          onLoad={() => {
            continueRender(handle); // Continue render once video is loaded
          }}
        />
      </AbsoluteFill>
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
              page={page}
              fontSize={fontSize}
              fontColor={fontColor}
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              highlightColor={highlightColor}
              backgroundColor={backgroundColor}
              rounded={rounded}
              yPosition={yPosition}
              aspectRatio={aspectRatio}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
