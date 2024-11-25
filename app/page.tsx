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

// Main container style
const mainContainer: React.CSSProperties = {
  display: "flex",
  padding: "20px",
  gap: "20px",
  maxWidth: "1200px",
  margin: "auto",
  alignItems: "flex-start",
};

// Styles for the video section
const videoSection: React.CSSProperties = {
  flex: "1 1 60%",
};

// Styles for the controls section
const controlsSection: React.CSSProperties = {
  flex: "1 1 40%",
  position: "sticky",
  top: "20px",
};

// Styles for the video player container
const playerContainer: React.CSSProperties = {
  borderRadius: "18px",
  overflow: "hidden",
  boxShadow: "0 0 200px rgba(0, 0, 0, 0.15)",
  backgroundColor: "#000",
};

// Styles for the video player
const player: React.CSSProperties = {
  width: "100%",
};

// Styles for the controls panel
const controlsPanel: React.CSSProperties = {
  padding: "20px",
  backgroundColor: "#f5f5f5",
  borderRadius: "10px",
};

const controlGroup: React.CSSProperties = {
  marginBottom: "15px",
};

const label: React.CSSProperties = {
  display: "block",
  marginBottom: "5px",
  fontWeight: "bold",
};

// Styles for theme buttons
const themeButtonsContainer: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const themeButton: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "5px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#e0e0e0",
  transition: "background-color 0.2s",
};

const themeButtonActive: React.CSSProperties = {
  ...themeButton,
  backgroundColor: "#90caf9",
  color: "white",
};

// Styles for the upload section
const uploadSection: React.CSSProperties = {
  marginBottom: "20px",
  padding: "20px",
  borderRadius: "10px",
  backgroundColor: "#fff",
  border: "2px dashed #ccc",
  textAlign: "center",
};

const uploadButton: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "#2196f3",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  marginTop: "10px",
};

const processingMessage: React.CSSProperties = {
  padding: "10px",
  backgroundColor: "#e3f2fd",
  borderRadius: "5px",
  marginTop: "10px",
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setIsReady(false);

    try {
      // Upload video
      const formData = new FormData();
      formData.append('video', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Video upload failed');
      
      const { videoUrl } = await uploadResponse.json();
      setVideoSrc(videoUrl);

      // Generate captions
      const captionsResponse = await fetch('/api/generate-captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      });

      if (!captionsResponse.ok) throw new Error('Caption generation failed');
      
      const { captions: generatedCaptions } = await captionsResponse.json();
      setCaptions(generatedCaptions);

      // Get video metadata
      const metadata = await getVideoMetadata(videoUrl);
      setVideoDuration(Math.floor(metadata.durationInSeconds * VIDEO_FPS));

      setIsReady(true);
    } catch (error) {
      console.error('Error processing video:', error);
      alert('Failed to process video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Props for the CaptionedVideo component
  const captionedVideoProps = useMemo(() => ({
    src: videoSrc,
    fontSize,
    fontColor,
    strokeColor,
    strokeWidth,
    highlightColor,
  }), [videoSrc, fontSize, fontColor, strokeColor, strokeWidth, highlightColor]);

  return (
    <div style={mainContainer}>
      {/* Video Section */}
      <div style={videoSection}>
        {/* Upload Section */}
        <div style={uploadSection}>
          <h3>Upload Video</h3>
          <p>Upload your video to generate captions</p>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            disabled={isProcessing}
          />
          {isProcessing && (
            <div style={{ 
              marginTop: '20px',
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: '16px',
                color: '#0369a1',
                marginBottom: '10px'
              }}>
                Processing video and generating captions...
              </p>
              <p style={{ 
                fontSize: '14px',
                color: '#64748b'
              }}>
                This may take a few moments depending on the video length.
              </p>
            </div>
          )}
          {error && (
            <p style={{ 
              color: '#dc2626',
              padding: '10px',
              backgroundColor: '#fef2f2',
              borderRadius: '6px',
              marginTop: '10px'
            }}>
              {error}
            </p>
          )}
          {uploadedFileName && !isProcessing && (
            <p style={{ 
              color: '#059669',
              marginTop: '10px'
            }}>
              Selected: {uploadedFileName}
            </p>
          )}
        </div>

        {/* Video Player */}
        {isReady ? (
          <div style={playerContainer}>
            <Player
              component={CaptionedVideo}
              inputProps={captionedVideoProps}
              durationInFrames={videoDuration}
              fps={VIDEO_FPS}
              compositionHeight={VIDEO_HEIGHT}
              compositionWidth={VIDEO_WIDTH}
              style={player}
              controls
              autoPlay
              loop
            />
          </div>
        ) : (
          <div style={{
            ...playerContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            minHeight: '400px',
          }}>
            <div style={{
              textAlign: 'center',
              padding: '20px'
            }}>
              <h3 style={{
                color: '#0f172a',
                marginBottom: '10px'
              }}>
                Preparing Your Video
              </h3>
              <p style={{
                color: '#64748b'
              }}>
                Please wait while we process your video and generate captions...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls Section */}
      <div style={controlsSection}>
        <div style={controlsPanel}>
          {/* Theme Buttons */}
          <div style={controlGroup}>
            <label style={label}>Preset Themes</label>
            <div style={themeButtonsContainer}>
              {Object.keys(CAPTION_THEMES).map((themeName) => (
                <button
                  key={themeName}
                  style={themeName === activeTheme ? themeButtonActive : themeButton}
                  onClick={() => handleThemeChange(themeName)}
                >
                  {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
                </button>
              ))}
            </div>
          </div>

              <div style={controlGroup}>
                <label style={label}>Font Size</label>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={fontSize}
                  onChange={(e) => {
                    setFontSize(Number(e.target.value));
                    setActiveTheme("custom");
                  }}
                />
                <span>{fontSize}px</span>
              </div>

              <div style={controlGroup}>
                <label style={label}>Font Color</label>
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => {
                    setFontColor(e.target.value);
                    setActiveTheme("custom");
                  }}
                />
              </div>

              <div style={controlGroup}>
                <label style={label}>Stroke Color</label>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => {
                    setStrokeColor(e.target.value);
                    setActiveTheme("custom");
                  }}
                />
              </div>

              <div style={controlGroup}>
                <label style={label}>Stroke Width</label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={strokeWidth}
                  onChange={(e) => {
                    setStrokeWidth(Number(e.target.value));
                    setActiveTheme("custom");
                  }}
                />
                <span>{strokeWidth}px</span>
              </div>

          <div style={controlGroup}>
            <label style={label}>Highlight Color</label>
            <input
              type="color"
              value={highlightColor}
              onChange={(e) => {
                setHighlightColor(e.target.value);
                setActiveTheme("custom");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
