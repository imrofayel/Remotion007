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
      transform: `translateY(${actualPosition}px)`,
    }}
    
    className={cn('top-[5%] bottom-[5%] absolute left-0 right-0 flex justify-center items-center')}
    >
      <div
        style={{
          fontSize: finalFontSize,
          transform: makeTransform([
            // animation transformation
          ]),
          fontFamily: "Inter",
          lineHeight: 1,
          WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
          paintOrder: "stroke",
          textShadow: `${strokeWidth / 2}px ${strokeWidth / 2}px ${strokeWidth}px black`,
          backgroundColor: backgroundColor,
        }}
        
        className={cn(rounded === "md" ? "rounded-lg" : "rounded-full", 'max-w-fit p-5 px-10 font-bold w-full text-center uppercase',)}>

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
              }}

              className={cn(rounded === "md" ? "rounded-lg" : "rounded-full", 
                
              "drop-shadow-2xl inline whitespace-pre transition-colors duration-500 ease-in-out",
            )}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
