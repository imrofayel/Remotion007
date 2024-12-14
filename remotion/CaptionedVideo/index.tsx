import { useEffect, useState } from "react";
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
import { getVideoMetadata } from "@remotion/media-utils";
import { DURATION_IN_FRAMES, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "../../types/constants";
import { PhotoTransition, TimelinePhoto } from "../../components/PhotoTransition";
import { Caption } from "../../types/Caption";
import { CaptionText } from "../../components/CaptionText";

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

  // Debug logs
  console.log('CaptionedVideo props:', {
    src,
    captions: propCaptions,
    fps,
    durationInFrames,
    fontSize,
    color,
    top
  });

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

  console.log('Current captions state:', captions);

  return (
    <AbsoluteFill>
      {/* Video Layer */}
      <AbsoluteFill>
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
      <AbsoluteFill style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: '50px',
        zIndex: 1000
      }}>
        {captions.map((caption, index) => {
          console.log('Rendering caption:', caption);

          if (!caption.startMs || !caption.endMs) {
            console.error('Invalid caption timing:', caption);
            return null;
          }

          const startFrame = Math.floor((caption.startMs / 1000) * fps);
          const duration = Math.floor(((caption.endMs - caption.startMs) / 1000) * fps);

          console.log('Caption frames:', {
            index,
            text: caption.text,
            startMs: caption.startMs,
            endMs: caption.endMs,
            startFrame,
            duration,
            fps
          });

          if (startFrame < 0 || duration <= 0) {
            console.error('Invalid frame calculation:', { startFrame, duration });
            return null;
          }

          return (
            <Sequence
              key={`caption-${index}-${startFrame}`}
              from={startFrame}
              durationInFrames={duration}
              name={`Caption ${index}: ${caption.text}`}
            >
              <div style={{
                position: 'absolute',
                bottom: typeof top === 'number' ? `${top}px` : top,
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                width: '100%',
                maxWidth: '80%',
                zIndex: 1000,
                padding: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '8px',
              }}>
                <CaptionText
                  text={caption.text}
                  duration={duration}
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
                  top={0}
                  left={0}
                />
              </div>
            </Sequence>
          );
        })}
      </AbsoluteFill>

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
