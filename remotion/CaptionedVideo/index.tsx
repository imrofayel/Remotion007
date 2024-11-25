import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  cancelRender,
  continueRender,
  delayRender,
  OffthreadVideo,
  Sequence,
  useVideoConfig,
  Video,
} from "remotion";
import { z } from "zod";
import SubtitlePage from "./SubtitlePage";
import { getVideoMetadata } from "@remotion/media-utils";
import { Caption, createTikTokStyleCaptions } from "@remotion/captions";

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
});

export const calculateCaptionedVideoMetadata: CalculateMetadataFunction<
  z.infer<typeof captionedVideoSchema>
> = async ({ props }) => {
  const fps = 60;
  const metadata = await getVideoMetadata(props.src);

  return {
    fps,
    durationInFrames: Math.floor(metadata.durationInSeconds * fps),
  };
};

const SWITCH_CAPTIONS_EVERY_MS = 200;

export const CaptionedVideo: React.FC<z.infer<typeof captionedVideoSchema>> = ({
  src,
  fontSize = 120,
  fontColor = "white",
  strokeColor = "black",
  strokeWidth = 20,
  highlightColor = "#39E508"
}) => {
  const [subtitles, setSubtitles] = useState<Caption[]>([]);
  const [handle] = useState(() => delayRender());
  const { fps } = useVideoConfig();

  const subtitlesFile = src
    .replace(/.mp4$/, ".json")
    .replace(/.mkv$/, ".json")
    .replace(/.mov$/, ".json")
    .replace(/.webm$/, ".json")
    .replace("uploads", "subs");

  const fetchSubtitles = useCallback(async () => {
    try {
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
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
      captions: subtitles ?? [],
    });
  }, [subtitles]);

  return (
    <AbsoluteFill>
      <AbsoluteFill>
        <Video
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </AbsoluteFill>
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const subtitleStartFrame = Math.floor((page.startMs / 1000) * fps);
        const subtitleEndFrame = Math.min(
          nextPage ? Math.floor((nextPage.startMs / 1000) * fps) : Infinity,
          subtitleStartFrame + Math.floor((SWITCH_CAPTIONS_EVERY_MS / 1000) * fps)
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
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
