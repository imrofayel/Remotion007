import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fitText } from "@remotion/layout-utils";
import { makeTransform } from "@remotion/animation-utils";
import { TikTokPage } from "@remotion/captions";
import { cn } from "../../lib/utils";

interface PageProps {
  enterProgress: number;
  page: TikTokPage;

  // Theming
  fontSize: number;
  fontColor: string;
  strokeColor: string;
  strokeWidth: number;
  highlightColor: string;
  highlightBg: string;
  backgroundColor: string;
  rounded: "md" | "lg";
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
  highlightBg = 'transparent',
  yPosition = 350,
  aspectRatio = "16:9",
  rounded = "md",
  backgroundColor = "transparent",
}) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

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
            // FOR ANIMATION
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
          backgroundColor: backgroundColor,
          borderRadius: rounded === "md" ? "10px" : rounded === "lg" ? "90px" : "30px",
          padding: "20px 40px",
          WebkitBorderRadius: rounded === "md" ? "10px" : rounded === "lg" ? "90px" : "30px",
        }}

        className='max-w-fit shadow-2xl'>

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
                backgroundColor: active ? highlightBg : "transparent",
                display: "inline",
                whiteSpace: "pre",
                transition: "color 0.4s ease-in-out",
                WebkitBorderRadius: rounded === "md" ? "10px" : rounded === "lg" ? "90px" : "30px"
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
