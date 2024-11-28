"use client"; // Enable client-side rendering for Next.js

import { Player } from "@remotion/player";
import { getVideoMetadata } from "@remotion/media-utils";
import type { NextPage } from "next";
import React, { SetStateAction, useMemo, useState } from "react";
import {
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  // VIDEO_HEIGHT,
  // VIDEO_WIDTH,
} from "../types/constants";
import { CaptionedVideo } from "../remotion/CaptionedVideo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import {
  GalleryVerticalEndIcon,
  UploadCloud,
} from "lucide-react";

const CAPTION_THEMES = {
  default: {
    fontSize: 120,
    fontColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 10,
    highlightColor: "#39E508",
    highlightBg: "transparent",
    backgroundColor: "transparent",
    rounded: "md",
  },
  ali: {
    fontSize: 90,
    fontColor: "#a4a4a5",
    strokeColor: "#333333",
    strokeWidth: 0,
    highlightColor: "#1c1e1d",
    highlightBg: "transparent",
    backgroundColor: "#e7e5e7",
    rounded: "lg",
  },

  leon: {
    fontSize: 90,
    fontColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 8,
    highlightColor: "#FFFFFF",
    highlightBg: "#e84f02",
    backgroundColor: "transparent",
    rounded: "md",
  },
};

// Predefined aspect ratios with max dimensions for quality
const ASPECT_RATIOS = {
  "16:9": { width: 1920, height: 1080, label: "Landscape (16:9)" },
  "9:16": { width: 1080, height: 1920, label: "Portrait (9:16)" },
  "4:5": { width: 1080, height: 1350, label: "Instagram (4:5)" },
  "1:1": { width: 1080, height: 1080, label: "Square (1:1)" },
};

const Home: NextPage = () => {
  // Video states
  const [videoSrc, setVideoSrc] = useState<string>("/sample-video.mp4");
  const [videoDuration, setVideoDuration] = useState<number>(DURATION_IN_FRAMES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isReady, setIsReady] = useState(true); // Initially true for sample video
  const [captionYPosition, setCaptionYPosition] = useState<number>(1280); // Default Y position

  // Caption styling states with default theme
  const [activeTheme, setActiveTheme] = useState<string>("default");
  const [fontSize, setFontSize] = useState<number>(
    CAPTION_THEMES.default.fontSize,
  );
  const [fontColor, setFontColor] = useState<string>(
    CAPTION_THEMES.default.fontColor,
  );
  const [strokeColor, setStrokeColor] = useState<string>(
    CAPTION_THEMES.default.strokeColor,
  );
  const [strokeWidth, setStrokeWidth] = useState<number>(
    CAPTION_THEMES.default.strokeWidth,
  );
  const [highlightColor, setHighlightColor] = useState<string>(
    CAPTION_THEMES.default.highlightColor,
  );

  const [highlightBg, setHighlightBg] = useState<string>(
    CAPTION_THEMES.default.highlightBg,
  );

  const [backgroundColor, setBackgroundColor] = useState<string>(CAPTION_THEMES.default.backgroundColor);
const [rounded, setRounded] = useState<string>(CAPTION_THEMES.default.rounded);

  const [wordsPerCaption, setWordsPerCaption] = useState<number>(2);
  const [aspectRatio, setAspectRatio] = useState<keyof typeof ASPECT_RATIOS>("9:16");

  // Calculate container dimensions while maintaining aspect ratio
  const getContainerStyle = (ratio: keyof typeof ASPECT_RATIOS) => {
    const { width, height } = ASPECT_RATIOS[ratio];
    return {
      aspectRatio: `${width} / ${height}`,
      maxWidth: "100%",
      maxHeight: "calc(100vh - 100px)", // Leave space for controls
    };
  };

  const getVideoHeight = (ratio: string) => {
    switch (ratio) {
      case "16:9":
        return 1080;
      case "9:16":
        return 1920;
      case "4:5":
        return 1350;
      case "1:1":
        return 1080;
      default:
        return 1080;
    }
  };

  const handleAspectRatioChange = (newRatio: SetStateAction<"16:9" | "9:16" | "4:5" | "1:1">) => {
    setAspectRatio(newRatio);
    const height = getVideoHeight(newRatio as string);
    setCaptionYPosition(height / 2); // Set to middle by default
  };

  const handleYPositionChange = (newPosition: number) => {
    const height = getVideoHeight(aspectRatio);
    setCaptionYPosition(Math.max(0, Math.min(newPosition, height)));
  };

  // Handle video upload
  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setIsReady(false);
    setError("");
    setUploadedFileName(file.name);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("video", file);

      // Upload the video
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Failed to upload video");
      }

      const { videoPath } = uploadData;

      // Wait a bit for the file to be fully written
      await new Promise((resolve) => setTimeout(resolve, 1000));

      try {
        // Get video metadata before setting the source
        const metadata = await getVideoMetadata(videoPath);
        if (metadata && metadata.durationInSeconds) {
          setVideoDuration(Math.floor(metadata.durationInSeconds * VIDEO_FPS));
          setVideoSrc(videoPath);
        } else {
          throw new Error("Could not read video metadata");
        }
      } catch (metadataError) {
        console.error("Metadata error:", metadataError);
        throw new Error("Failed to process video metadata. Please try again.");
      }

      // Generate captions
      const captionResponse = await fetch("/api/generate-captions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoPath }),
      });

      const captionData = await captionResponse.json();

      if (!captionResponse.ok) {
        throw new Error(captionData.error || "Failed to generate captions");
      }

      // Verify captions file exists and is valid
      const captionsPath = videoPath
        .replace(/.mp4$/, ".json")
        .replace(/.mkv$/, ".json")
        .replace(/.mov$/, ".json")
        .replace(/.webm$/, ".json")
        .replace("uploads", "subs");

      const captionsResponse = await fetch(captionsPath);
      if (!captionsResponse.ok) {
        throw new Error("Failed to verify captions file");
      }

      // Everything is ready
      setIsReady(true);
    } catch (error: any) {
      console.error("Error processing video:", error);
      setError(error.message || "Error processing video. Please try again.");
      // Reset video source on error
      setVideoSrc("/sample-video.mp4");
      setVideoDuration(DURATION_IN_FRAMES);
      setIsReady(true); // Reset to show sample video
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle theme change
  const handleThemeChange = (themeName: string) => {
    const theme = CAPTION_THEMES[themeName as keyof typeof CAPTION_THEMES];
    setActiveTheme(themeName);
    setFontSize(theme.fontSize);
    setFontColor(theme.fontColor);
    setStrokeColor(theme.strokeColor);
    setStrokeWidth(theme.strokeWidth);
    setHighlightColor(theme.highlightColor);
    setHighlightBg(theme.highlightBg);
    setBackgroundColor(theme.backgroundColor);
    setRounded(theme.rounded);
  };

  // Video props memoization
  const captionedVideoProps = useMemo(
    () => ({
      src: videoSrc,
      fontSize,
      fontColor,
      strokeColor,
      strokeWidth,
      highlightColor,
      highlightBg,
      backgroundColor,
      rounded,
      wordsPerCaption,
      yPosition: captionYPosition,
      aspectRatio,
    }),
    [
      videoSrc,
      fontSize,
      fontColor,
      strokeColor,
      strokeWidth,
      highlightColor,
      highlightBg,
      backgroundColor,
      rounded,
      wordsPerCaption,
      captionYPosition,
      aspectRatio,
    ],
  );

  return (
    <div className="p-6 items-center justify-center align-middle grid gap-6 text-gray-600">
      {/* Upload Section */}
      <div className="w-full justify-between flex flex-row-reverse">
        <div className="cursor-pointer max-w-fit bg-gray-100/60 p-3 rounded-2xl">
          <UploadCloud
            size={22}
            onClick={() => document.getElementById("video-upload")?.click()}
          />
        </div>
        {/* Aspect Ratio Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-lg rounded-2xl p-3 bg-gray-100/60"
            >
              <GalleryVerticalEndIcon className="h-6 w-6 scale-[1.2] text-muted sm:mr-1" />
              <span className="capitalize">{aspectRatio}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-2xl text-gray-600 shadow-gray-100 border-gray-100">
            <DropdownMenuItem
              onClick={() => handleAspectRatioChange("16:9")}
              className="rounded-lg"
            >
              16:9 Landscape
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAspectRatioChange("9:16")}
              className="rounded-lg"
            >
              9:16 Portrait
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAspectRatioChange("1:1")}
              className="rounded-lg"
            >
              1:1 Square
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAspectRatioChange("4:5")}
              className="rounded-lg"
            >
              4:5 Instagram
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        onChange={(e) => {
          handleVideoUpload(e);
          if (isProcessing) {
            console.log("Processing video and generating captions...");
            console.log(
              "This may take a few moments depending on the video length.",
            );
          }
          if (error) {
            console.error(error);
          }
          if (uploadedFileName && !isProcessing) {
            console.log("Selected:", uploadedFileName);
          }
        }}
        disabled={isProcessing}
        className="hidden"
      />

      <div className="w-full flex justify-center">
        <div className="w-full max-w-4xl">
          {/* Video Player */}
          {isReady ? (
            <div
              className="relative mx-auto"
              style={getContainerStyle(aspectRatio)}
            >
              <Player
                component={CaptionedVideo as any}
                inputProps={captionedVideoProps}
                durationInFrames={videoDuration}
                fps={VIDEO_FPS}
                compositionHeight={ASPECT_RATIOS[aspectRatio].height}
                compositionWidth={ASPECT_RATIOS[aspectRatio].width}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                className="drop-shadow-2xl object-contain"
                controls
                autoPlay
                loop
              />
            </div>
          ) : (
            <div className="rounded-3xl bg-gray-50 min-h-[400px] flex items-center justify-center">
              <div className="text-center p-6">
                <h3 className="text-2xl font-semibold text-gray-300 mb-2">
                  Preparing Your Video
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls Section */}
      <div>
        <div className="bg-white  border-b-2 border-gray-200/60 rounded-3xl border p-6 sticky top-6">
          {/* Theme Selection */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {Object.keys(CAPTION_THEMES).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`px-4 py-2 rounded-2xl font-medium transition-colors
                    ${
                      theme === activeTheme
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100/60 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Words Per Caption Control */}
          <div className="mb-6 space-y-4">
            <label className="block font-medium text-lg text-gray-300 mb-2">
              Display Words
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={wordsPerCaption}
                onChange={(e) => {
                  setWordsPerCaption(Number(e.target.value));
                  setActiveTheme("custom");
                }}
                className="flex-1 h-4 border-none bg-gray-100/60 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-gray-800"
              />
              <span className="p-2 py-1 font-medium text-lg text-gray-600 bg-gray-100/60 rounded-2xl">
                0{wordsPerCaption}
              </span>
            </div>
          </div>

          {/* Custom Controls */}
          <div className="space-y-6">
            <div>
              <label className="block font-medium text-lg text-gray-300 mb-2">
                Size {fontSize}px
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={fontSize}
                  onChange={(e) => {
                    setFontSize(Number(e.target.value));
                    setActiveTheme("custom");
                  }}
                  className="flex-1 h-4 border-none bg-gray-100/60 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-gray-800"
                  style={{ accentColor: highlightColor }}
                />
              </div>
            </div>

            <div className="flex space-x-2 justify-between">
              <div>
                <label className="block font-medium text-lg text-gray-300 mb-2">
                  Color
                </label>{" "}
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => {
                    setFontColor(e.target.value);
                    setActiveTheme("custom");
                  }}
                  className="h-10 rounded border-none cursor-pointer bg-transparent"
                />
              </div>

              <div>
                <label className="block font-medium text-lg text-gray-300 mb-2">
                  Highlight Color
                </label>
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => {
                    setHighlightColor(e.target.value);
                    setActiveTheme("custom");
                  }}
                  className="h-10 rounded border-none cursor-pointer bg-transparent"
                />
              </div>

              <div>
                <label className="block font-medium text-lg text-gray-300 mb-2">
                  Stroke
                </label>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => {
                    setStrokeColor(e.target.value);
                    setActiveTheme("custom");
                  }}
                  className="h-10 rounded border-none cursor-pointer bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-lg text-gray-300 mb-2">
                Stroke {strokeWidth}px
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={strokeWidth}
                  onChange={(e) => {
                    setStrokeWidth(Number(e.target.value));
                    setActiveTheme("custom");
                  }}
                  className="flex-1 h-4 border-none bg-gray-100/60 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-gray-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
            <label className="block font-medium text-lg text-gray-300 mb-2">
                Position Y {captionYPosition}px
              </label>
              <input
                type="range"
                min="0"
                max={getVideoHeight(aspectRatio)}
                value={captionYPosition}
                onChange={(e) => handleYPositionChange(Number(e.target.value))}
                className="flex-1 h-4 border-none bg-gray-100/60 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-gray-800"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
