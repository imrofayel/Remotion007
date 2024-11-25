"use client"; // Enable client-side rendering for Next.js

import { Player } from "@remotion/player";
import { getVideoMetadata } from "@remotion/media-utils";
import type { NextPage } from "next";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../types/constants";
import { CaptionedVideo } from "../remotion/CaptionedVideo";

// Predefined themes for captions
const CAPTION_THEMES = {
  default: {
    fontSize: 120,
    fontColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 20,
    highlightColor: "#39E508",
  },
  neon: {
    fontSize: 130,
    fontColor: "#00FF00",
    strokeColor: "#FF00FF",
    strokeWidth: 15,
    highlightColor: "#FFFF00",
  },
  minimal: {
    fontSize: 100,
    fontColor: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 10,
    highlightColor: "#FF4444",
  },
  bold: {
    fontSize: 140,
    fontColor: "#FFD700",
    strokeColor: "#000000",
    strokeWidth: 25,
    highlightColor: "#FF4500",
  },
  subtle: {
    fontSize: 110,
    fontColor: "#E0E0E0",
    strokeColor: "#333333",
    strokeWidth: 15,
    highlightColor: "#90CAF9",
  },
};

const Home: NextPage = () => {
  // Video states
  const [videoSrc, setVideoSrc] = useState<string>("/sample-video.mp4");
  const [videoDuration, setVideoDuration] = useState<number>(DURATION_IN_FRAMES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isReady, setIsReady] = useState(true); // Initially true for sample video

  // Caption styling states with default theme
  const [activeTheme, setActiveTheme] = useState<string>("default");
  const [fontSize, setFontSize] = useState<number>(CAPTION_THEMES.default.fontSize);
  const [fontColor, setFontColor] = useState<string>(CAPTION_THEMES.default.fontColor);
  const [strokeColor, setStrokeColor] = useState<string>(CAPTION_THEMES.default.strokeColor);
  const [strokeWidth, setStrokeWidth] = useState<number>(CAPTION_THEMES.default.strokeWidth);
  const [highlightColor, setHighlightColor] = useState<string>(CAPTION_THEMES.default.highlightColor);
  const [wordsPerCaption, setWordsPerCaption] = useState<number>(2);

  // Handle video upload
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setIsReady(false);
    setError("");
    setUploadedFileName(file.name);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('video', file);

      // Upload the video
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Failed to upload video');
      }

      const { videoPath } = uploadData;

      // Wait a bit for the file to be fully written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Get video metadata before setting the source
        const metadata = await getVideoMetadata(videoPath);
        if (metadata && metadata.durationInSeconds) {
          setVideoDuration(Math.floor(metadata.durationInSeconds * VIDEO_FPS));
          setVideoSrc(videoPath);
        } else {
          throw new Error('Could not read video metadata');
        }
      } catch (metadataError) {
        console.error('Metadata error:', metadataError);
        throw new Error('Failed to process video metadata. Please try again.');
      }

      // Generate captions
      const captionResponse = await fetch('/api/generate-captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoPath }),
      });

      const captionData = await captionResponse.json();
      
      if (!captionResponse.ok) {
        throw new Error(captionData.error || 'Failed to generate captions');
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
        throw new Error('Failed to verify captions file');
      }

      // Everything is ready
      setIsReady(true);

    } catch (error: any) {
      console.error('Error processing video:', error);
      setError(error.message || 'Error processing video. Please try again.');
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
  };

  // Video props memoization
  const captionedVideoProps = useMemo(() => ({
    src: videoSrc,
    fontSize,
    fontColor,
    strokeColor,
    strokeWidth,
    highlightColor,
    wordsPerCaption,
  }), [videoSrc, fontSize, fontColor, strokeColor, strokeWidth, highlightColor, wordsPerCaption]);

  return (
    <div className="container mx-auto p-6 flex flex-col md:flex-row gap-6">
      {/* Video Section */}
      <div className="flex-1">
        {/* Upload Section */}
        <div className="mb-6 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
          <h3 className="text-lg font-semibold mb-2">Upload Video</h3>
          <p className="text-gray-600 mb-4">Upload your video to generate captions</p>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isProcessing && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-700 font-medium mb-2">
                Processing video and generating captions...
              </p>
              <p className="text-sm text-blue-600">
                This may take a few moments depending on the video length.
              </p>
            </div>
          )}
          {error && (
            <p className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg">
              {error}
            </p>
          )}
          {uploadedFileName && !isProcessing && (
            <p className="mt-4 text-green-600">
              Selected: {uploadedFileName}
            </p>
          )}
        </div>

        {/* Video Player */}
        {isReady ? (
          <div className="rounded-2xl overflow-hidden shadow-2xl bg-black">
            <Player
              component={CaptionedVideo}
              inputProps={captionedVideoProps}
              durationInFrames={videoDuration}
              fps={VIDEO_FPS}
              compositionHeight={VIDEO_HEIGHT}
              compositionWidth={VIDEO_WIDTH}
              className="w-full"
              controls
              autoPlay
              loop
            />
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-50 min-h-[400px] flex items-center justify-center">
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Preparing Your Video
              </h3>
              <p className="text-gray-600">
                Please wait while we process your video and generate captions...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls Section */}
      <div className="md:w-[400px] sticky top-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Theme Selection */}
          <div className="mb-6">
            <label className="block font-medium mb-2">Theme</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(CAPTION_THEMES).map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${theme === activeTheme 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Words Per Caption Control */}
          <div className="mb-6">
            <label className="block font-medium mb-2">Words Per Caption</label>
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
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-blue-500"
                style={{ accentColor: highlightColor }}
              />
              <span className="min-w-[80px] text-gray-700">
                {wordsPerCaption} word{wordsPerCaption !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Custom Controls */}
          <div className="space-y-6">
            <div>
              <label className="block font-medium mb-2">Font Size</label>
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
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: highlightColor }}
                />
                <span className="min-w-[60px] text-gray-700">{fontSize}px</span>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">Font Color</label>
              <input
                type="color"
                value={fontColor}
                onChange={(e) => {
                  setFontColor(e.target.value);
                  setActiveTheme("custom");
                }}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Stroke Color</label>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => {
                  setStrokeColor(e.target.value);
                  setActiveTheme("custom");
                }}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Stroke Width</label>
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
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: highlightColor }}
                />
                <span className="min-w-[60px] text-gray-700">{strokeWidth}px</span>
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">Highlight Color</label>
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => {
                  setHighlightColor(e.target.value);
                  setActiveTheme("custom");
                }}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
