import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fitText } from "@remotion/layout-utils";
import { makeTransform, scale, translateY } from "@remotion/animation-utils";
import { TikTokPage } from "@remotion/captions";

interface PageProps {
  enterProgress: number;
  page: TikTokPage;
  fontSize?: number;
  fontColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  highlightColor?: string;
  yPosition?: number;
  aspectRatio?: string;
}

export const Page: React.FC<PageProps> = ({
  enterProgress,
  page,
  fontSize = 120,
  fontColor = "white",
  strokeColor = "black",
  strokeWidth = 20,
  highlightColor = "#39E508",
  yPosition = 350,
  aspectRatio = "16:9",
}) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  // Refined floating animation
  const floatAmplitude = 15; // Maximum vertical movement in pixels
  const floatFrequency = 1.5; // Oscillation frequency (higher = faster oscillations)
  const floatingY =
    Math.sin((frame / fps) * floatFrequency * 2 * Math.PI) * floatAmplitude;

  const fittedText = fitText({
    fontFamily: "Inter",
    text: page.text,
    withinWidth: width * 0.9,
    textTransform: "uppercase",
  });

  const finalFontSize = Math.min(fontSize, fittedText.fontSize);
  
  // Calculate video dimensions based on aspect ratio
  const videoHeight = aspectRatio === "16:9" ? 1080 : 
                     aspectRatio === "9:16" ? 1920 :
                     aspectRatio === "4:5" ? 1350 : 1080;

  // Calculate the position as a percentage of video height
  const positionPercentage = (yPosition / (videoHeight)) * 100;
  const clampedPercentage = Math.max(0, Math.min(positionPercentage, 100));
  
  // Calculate actual position relative to container
  const actualPosition = (clampedPercentage / 100) * videoHeight - (videoHeight / 2);

  return (
    <AbsoluteFill style={{
      position: "absolute",
      top: "5%",
      bottom: "5%",
      left: 0,
      right: 0,
      transform: `translateY(${actualPosition}px)`,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div
        style={{
          fontSize: finalFontSize,
          transform: makeTransform([
            scale(enterProgress),
            translateY(-30 + floatingY), // Applied floating effect
          ]),
          fontFamily: "Inter",
          textTransform: "uppercase",
          textAlign: "center",
          width: "100%",
          lineHeight: 1,
          fontWeight: "bold",
          WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
          paintOrder: "stroke",
          textShadow: `${strokeWidth / 2}px ${strokeWidth / 2}px ${strokeWidth}px rgba(0,0,0,0.3)`,
        }}
      >
        {page.tokens.map((token, index) => {
          const startRelativeToSequence = token.fromMs - page.startMs;
          const endRelativeToSequence = token.toMs - page.startMs;
          const active =
            startRelativeToSequence <= timeInMs &&
            endRelativeToSequence > timeInMs;

          return (
            <span
              key={index}
              style={{
                color: active ? highlightColor : fontColor,
                display: "inline",
                whiteSpace: "pre",
                transition: "color 0.1s ease-in-out",
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
