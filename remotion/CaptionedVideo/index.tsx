import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  continueRender,
  delayRender,
  random,
  Sequence,
  useVideoConfig,
  Video,
} from "remotion";
import { z } from "zod";
import SubtitlePage from "./SubtitlePage";
import { getVideoMetadata } from "@remotion/media-utils";
import { Caption, createTikTokStyleCaptions } from "@remotion/captions";
import { DURATION_IN_FRAMES, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "../../types/constants";
import { PhotoTransition, TimelinePhoto } from "../../components/PhotoTransition";

export const captionedVideoSchema = z.object({
  src: z.string(),
  fontSize: z.number().default(120),
  color: z.string().default("white"),
  strokeColor: z.string().default("black"),
  stroke: z.enum(["none", "s", "m", "l"]).default("m"),
  fontFamily: z.string().default("Inter"),
  fontWeight: z.number().default(700),
  fontUppercase: z.boolean().default(false),
  fontShadow: z.enum(["none", "s", "m", "l"]).default("s"),
  animation: z.string().default("none"),
  isAnimationActive: z.boolean().default(false),
  isMotionBlurActive: z.boolean().default(false),
  highlightKeywords: z.boolean().default(false),
  mainHighlightColor: z.string().default("#39E508"),
  secondHighlightColor: z.string().default("#fdfa14"),
  thirdHighlightColor: z.string().default("#f01916"),
  top: z.number().default(1000),
  aspectRatio: z.enum(["16:9", "9:16", "4:5", "1:1"]).default("9:16"),
  className: z.string().optional(),
  chunkSize: z.number().default(2),
  photos: z.array(z.any()).default([]),
  durationInFrames: z.number().optional(),
  fitMode: z.enum(['fill', 'fit']).default('fit'),
  captionsUrl: z.string().optional(),
  onCaptionsLoad: z.function().args(z.array(z.custom<Caption>())).optional(),
  captions: z.array(z.custom<Caption>()).default([]),
  left: z.number().default(0)
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
  fitMode = "fit",
  captionsUrl,
  onCaptionsLoad,
  captions: propCaptions = [],
}) => {
  const [captions, setCaptions] = useState<Caption[]>(propCaptions);
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

  // Load captions from URL if provided
  useEffect(() => {
    if (captionsUrl) {
      const loadCaptions = async () => {
        try {
          const response = await fetch(captionsUrl);
          if (!response.ok) {
            throw new Error('Failed to load captions');
          }
          const data = await response.json();
          const loadedCaptions: Caption[] = Array.isArray(data) ? data : data.captions;
          console.log('Loaded captions from URL:', loadedCaptions);
          setCaptions(loadedCaptions);
          if (onCaptionsLoad) {
            onCaptionsLoad(loadedCaptions);
          }
        } catch (error) {
          console.error('Error loading captions:', error);
        }
      };
      loadCaptions();
    }
  }, [captionsUrl, onCaptionsLoad]);

  // Update captions when props change
  useEffect(() => {
    console.log('propCaptions changed:', propCaptions);
    if (propCaptions.length > 0) {
      setCaptions(propCaptions);
    }
  }, [propCaptions]);

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
      captions: captions ?? [],
    });
  }, [captions, captionSwitchSpeedValue]);

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
