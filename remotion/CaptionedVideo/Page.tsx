import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fitText } from "@remotion/layout-utils";
import { makeTransform, scale, translateY } from "@remotion/animation-utils";
import { TikTokPage } from "@remotion/captions";

const container: React.CSSProperties = {
  justifyContent: "center",
  alignItems: "center",
  top: undefined,
  bottom: 350,
  height: 150,
};

interface PageProps {
  enterProgress: number;
  page: TikTokPage;
  fontSize?: number;
  fontColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  highlightColor?: string;
}

export const Page: React.FC<PageProps> = ({ 
  enterProgress, 
  page,
  fontSize = 120,
  fontColor = "white",
  strokeColor = "black",
  strokeWidth = 20,
  highlightColor = "#39E508"
}) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  const fittedText = fitText({
    fontFamily: 'Inter',
    text: page.text,
    withinWidth: width * 0.9,
    textTransform: "uppercase",
  });

  const finalFontSize = Math.min(fontSize, fittedText.fontSize);

  return (
    <AbsoluteFill style={container}>
      <div
        style={{
          fontSize: finalFontSize,
          transform: makeTransform([
            scale(enterProgress),
            translateY(enterProgress * -30),
          ]),
          fontFamily: "Inter",
          textTransform: "uppercase",
          textAlign: "center",
          width: "100%",
          lineHeight: 1,
          fontWeight: "bold",
          WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
          paintOrder: "stroke",
          textShadow: `${strokeWidth/2}px ${strokeWidth/2}px ${strokeWidth}px rgba(0,0,0,0.3)`,
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
