import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { fitText } from "@remotion/layout-utils";
import { TikTokPage } from "@remotion/captions";
import { cn } from "../../lib/utils";

interface Props {
  enterProgress: number;
  page: TikTokPage;
  fontSize: number;
  color: string;
  strokeColor: string;
  stroke: "none" | "s" | "m" | "l";
  fontFamily: string;
  fontWeight: number;
  fontUppercase: boolean;
  fontShadow: "none" | "s" | "m" | "l";
  animation: string;
  isAnimationActive: boolean;
  isMotionBlurActive: boolean;
  highlightKeywords: boolean;
  mainHighlightColor: string;
  secondHighlightColor: string;
  thirdHighlightColor: string;
  top: number;
  left: number;
  className?: string;
}

const SubtitlePage: React.FC<Props> = ({
  enterProgress,
  page,
  fontSize,
  color,
  strokeColor,
  stroke,
  fontFamily,
  fontWeight,
  fontUppercase,
  fontShadow,
  animation,
  isAnimationActive,
  isMotionBlurActive,
  highlightKeywords,
  mainHighlightColor,
  secondHighlightColor,
  thirdHighlightColor,
  top,
  left,
  className = "",
}) => {
  const frame = useCurrentFrame();
  const { width, fps } = useVideoConfig();
  const timeInMs = (frame / fps) * 1000;

  console.log('SubtitlePage rendering:', { page, timeInMs });

  // Calculate fitted text size
  const fittedText = fitText({
    fontFamily,
    text: page.text,
    withinWidth: width - 100, // Add some padding
    textTransform: fontUppercase ? "uppercase" : "none",
  });

  const finalFontSize = Math.min(fontSize, fittedText.fontSize);

  // Animation transforms
  const getAnimationTransform = () => {
    if (!isAnimationActive) return "";

    switch (animation) {
      case "updown": {
        const progress = interpolate(frame % 30, [0, 15, 30], [0, -10, 0]);
        return `translateY(${progress}px)`;
      }
      case "bounce": {
        const progress = interpolate(frame % 60, [0, 30, 60], [0, 20, 0]);
        return `translateY(${progress}px)`;
      }
      case "shake": {
        const progress = interpolate(frame % 20, [0, 5, 10, 15, 20], [-5, 5, -5, 5, -5]);
        return `translateX(${progress}px)`;
      }
      default:
        return "";
    }
  };

  const getStrokeClass = () => {
    switch (stroke) {
      case 's':
        return 'stroke-s';
      case 'm':
        return 'stroke-m';
      case 'l':
        return 'stroke-l';
      default:
        return '';
    }
  };

  const getShadowClass = () => {
    switch (fontShadow) {
      case 's':
        return 'shadow-s';
      case 'm':
        return 'shadow-m';
      case 'l':
        return 'shadow-l';
      default:
        return '';
    }
  };

  const animationTransform = getAnimationTransform();
  const motionBlurFilter = isMotionBlurActive ? 'blur(0.5px)' : 'none';

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        "--stroke-color": strokeColor,
        "--main-color": mainHighlightColor,
        "--second-color": secondHighlightColor,
        "--text-color": color,
      } as React.CSSProperties}
      className={className}
    >
      <div 
        className={cn(
          "absolute max-w-fit caption-container z-20 text-center",
          getShadowClass(),
          getStrokeClass(),
        )}
        style={{
          position: "absolute",
          top,
          left: "50%",
          transform: `translateX(-50%) ${animationTransform}`,
          zIndex: 1000,
        }}
      >
        <div 
          className="caption-box" 
          style={{
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35em"
          }}
        >
          {page.tokens.map((token, index) => {
            const startRelativeToSequence = token.fromMs - page.startMs;
            const endRelativeToSequence = token.toMs - page.startMs;
            const active =
              startRelativeToSequence <= timeInMs &&
              endRelativeToSequence > timeInMs;

            return (
              <span key={index} className="relative">
                <span
                  className={cn("caption-word px-1.5 sb-text-shadow-sm", active && 'highlight-word')}
                  style={{
                    transform: animationTransform,
                    color: active && highlightKeywords ? mainHighlightColor : color,
                    fontFamily,
                    fontSize: finalFontSize,
                    fontWeight,
                    textTransform: fontUppercase ? "uppercase" : "none",
                    filter: motionBlurFilter,
                    WebkitTextStrokeColor: strokeColor,
                    display: 'inline-block',
                  }}
                  data-text={token.text}
                >
                  {token.text}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default SubtitlePage;
