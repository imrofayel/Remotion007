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
  Download,
  Upload,
} from "lucide-react";
import themesConfig from './themes.json';
import { PhotoTransition, type PhotoFitMode } from '../components/PhotoTransition';
import { PhotoUploader } from '../components/PhotoUploader';
import { useToast } from '../components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

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
  const defaultTheme = themesConfig.themes.find(theme => theme.config.default) || themesConfig.themes[0];

  const [fontSize, setFontSize] = useState<number>(defaultTheme.config.style.fontSize);
  const [fontColor, setFontColor] = useState<string>(defaultTheme.config.style.color);
  const [strokeColor, setStrokeColor] = useState<string>(defaultTheme.config.style.strokeColor);
  const [stroke, setStroke] = useState<"none" | "s" | "m" | "l">(defaultTheme.config.style.stroke as "none" | "s" | "m" | "l");
  const [fontShadow, setFontShadow] = useState<"none" | "s" | "m" | "l">(defaultTheme.config.style.fontShadow as "none" | "s" | "m" | "l");
  const [fontFamily, setFontFamily] = useState<string>(defaultTheme.config.style.fontFamily);
  const [fontWeight, setFontWeight] = useState<number>(defaultTheme.config.style.fontWeight);
  const [isUppercase, setIsUppercase] = useState<boolean>(defaultTheme.config.style.fontUppercase);
  const [animation, setAnimation] = useState<string>(defaultTheme.config.subs.animation);
  const [isAnimationActive, setIsAnimationActive] = useState<boolean>(defaultTheme.config.subs.isAnimationActive);
  const [isMotionBlurActive, setIsMotionBlurActive] = useState<boolean>(defaultTheme.config.subs.isMotionBlurActive);
  const [mainHighlightColor, setMainHighlightColor] = useState<string>(defaultTheme.config.highlight_style.mainColor);
  const [secondHighlightColor, setSecondHighlightColor] = useState<string>(defaultTheme.config.highlight_style.secondColor);
  const [thirdHighlightColor, setThirdHighlightColor] = useState<string>(defaultTheme.config.highlight_style.thirdColor);

  const [className, setClassName] = useState<string>(defaultTheme.config.className);

  const [customThemes, setCustomThemes] = useState<typeof themesConfig.themes>([]);
  
  // Combine default themes with custom themes
  const allThemes = useMemo(() => [...themesConfig.themes, ...customThemes], [customThemes]);

  const [wordsPerCaption, setWordsPerCaption] = useState<number>(defaultTheme.config.subs.chunkSize);
  const [aspectRatio, setAspectRatio] = useState<keyof typeof ASPECT_RATIOS>("9:16");

  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fitMode, setFitMode] = useState<PhotoFitMode>('fit');
  const { toast } = useToast();

  const TRANSITIONS = [
    { value: 'fade', label: 'Fade' },
    { value: 'slide', label: 'Slide' },
    { value: 'wipe', label: 'Wipe' },
    { value: 'flip', label: 'Flip' },
  ];

  const [transition, setTransition] = useState('fade');

  // Function to export current theme
  const handleExportTheme = () => {
    const currentTheme = {
      themes: [
        {
          config: {
            className: className,
            name: activeTheme,
            custom: true,
            default: false,
            categories: ["all", "custom"],
            style: {
              fontSize: fontSize,
              color: fontColor,
              fontFamily: fontFamily,
              fontWeight: fontWeight,
              fontUppercase: isUppercase,
              fontShadow: fontShadow,
              stroke: stroke,
              strokeColor: strokeColor,
            },
            subs: {
              chunkSize: wordsPerCaption,
              animation: animation,
              isAnimationActive: isAnimationActive,
              isMotionBlurActive: isMotionBlurActive,
            },
            highlight_style: {
              mainColor: mainHighlightColor,
              secondColor: secondHighlightColor,
              thirdColor: thirdHighlightColor,
            }
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(currentTheme, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${activeTheme.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Modified handleThemeChange to work with custom themes
  const handleThemeChange = (themeName: string) => {
    const selectedTheme = allThemes.find(theme => theme.config.name === themeName);
    if (!selectedTheme) return;

    setActiveTheme(themeName);
    setFontSize(selectedTheme.config.style.fontSize);
    setFontColor(selectedTheme.config.style.color);
    setStrokeColor(selectedTheme.config.style.strokeColor);
    setStroke(selectedTheme.config.style.stroke as "none" | "s" | "m" | "l");
    setFontShadow(selectedTheme.config.style.fontShadow as "none" | "s" | "m" | "l");
    setFontFamily(selectedTheme.config.style.fontFamily);
    setFontWeight(selectedTheme.config.style.fontWeight);
    setIsUppercase(selectedTheme.config.style.fontUppercase);
    setAnimation(selectedTheme.config.subs.animation);
    setIsAnimationActive(selectedTheme.config.subs.isAnimationActive);
    setIsMotionBlurActive(selectedTheme.config.subs.isMotionBlurActive);
    setMainHighlightColor(selectedTheme.config.highlight_style.mainColor);
    setSecondHighlightColor(selectedTheme.config.highlight_style.secondColor);
    setThirdHighlightColor(selectedTheme.config.highlight_style.thirdColor);
    setClassName(selectedTheme.config.className);
  };

  // Modified handleImportTheme to handle custom themes
  const handleImportTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedTheme = JSON.parse(content);
        
        if (!importedTheme.themes?.[0]?.config) {
          throw new Error('Invalid theme file format');
        }

        const themeConfig = importedTheme.themes[0].config;
        
        // Create a unique name for the imported theme if it already exists
        let uniqueName = themeConfig.name;
        let counter = 1;
        while (allThemes.some(theme => theme.config.name === uniqueName)) {
          uniqueName = `${themeConfig.name} (${counter})`;
          counter++;
        }
        
        // Create the new theme with the unique name
        const newTheme = {
          config: {
            ...themeConfig,
            name: uniqueName,
            custom: true,
            default: false,
          }
        };

        // Add to custom themes
        setCustomThemes(prev => [...prev, newTheme]);
        
        // Apply the imported theme
        setActiveTheme(uniqueName);
        setClassName(themeConfig.className);
        setFontSize(themeConfig.style.fontSize);
        setFontColor(themeConfig.style.color);
        setFontFamily(themeConfig.style.fontFamily);
        setFontWeight(themeConfig.style.fontWeight);
        setIsUppercase(themeConfig.style.fontUppercase);
        setFontShadow(themeConfig.style.fontShadow as "none" | "s" | "m" | "l");
        setStroke(themeConfig.style.stroke as "none" | "s" | "m" | "l");
        setStrokeColor(themeConfig.style.strokeColor);
        setWordsPerCaption(themeConfig.subs.chunkSize);
        setAnimation(themeConfig.subs.animation);
        setIsAnimationActive(themeConfig.subs.isAnimationActive);
        setIsMotionBlurActive(themeConfig.subs.isMotionBlurActive);
        setMainHighlightColor(themeConfig.highlight_style.mainColor);
        setSecondHighlightColor(themeConfig.highlight_style.secondColor);
        setThirdHighlightColor(themeConfig.highlight_style.thirdColor);

      } catch (error) {
        console.error('Error importing theme:', error);
      }
    };
    reader.readAsText(file);
  };

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

  // Video props memoization
  const captionedVideoProps = useMemo(
    () => ({
      src: videoSrc,
      fontSize,
      color: fontColor,
      strokeColor,
      stroke,
      fontShadow,
      fontFamily,
      fontWeight,
      fontUppercase: isUppercase,
      animation,
      isAnimationActive,
      isMotionBlurActive,
      mainHighlightColor,
      secondHighlightColor,
      thirdHighlightColor,
      top: captionYPosition,
      chunkSize: wordsPerCaption,
      className: className,
      photos,
      aspectRatio,
      durationInFrames: 400,
      fitMode,
    }),
    [
      videoSrc,
      fontSize,
      fontColor,
      strokeColor,
      stroke,
      fontShadow,
      fontFamily,
      fontWeight,
      isUppercase,
      animation,
      isAnimationActive,
      isMotionBlurActive,
      mainHighlightColor,
      secondHighlightColor,
      thirdHighlightColor,
      captionYPosition,
      wordsPerCaption,
      className,
      photos,
      aspectRatio,
      fitMode,
    ],
  );

  const handlePhotosSelected = async (files: File[]) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await fetch('/api/upload-photos', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photos');
      }

      setPhotos(data.paths);
      toast({
        title: 'Success',
        description: 'Photos uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload photos',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

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
          {/* Photo Upload */}
          <div className="mb-4">
            <PhotoUploader
              onPhotosSelected={handlePhotosSelected}
              isUploading={isUploading}
              className="w-full"
            />
            {photos.length > 0 && (
              <div className="mt-2 flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  {photos.length} photo{photos.length !== 1 ? 's' : ''} added
                </div>
                <Select
                  value={fitMode}
                  onValueChange={(value: PhotoFitMode) => setFitMode(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select fit mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit</SelectItem>
                    <SelectItem value="fill">Fill</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {/* Video Player */}
          {isReady ? (
            <div
              className="relative mx-auto"
              style={getContainerStyle(aspectRatio)}
            >
              <Player
                component={CaptionedVideo}
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
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Theme</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {activeTheme} <GalleryVerticalEndIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {allThemes.map((theme) => (
                    <DropdownMenuItem
                      key={theme.config.name}
                      onClick={() => handleThemeChange(theme.config.name)}
                      className="flex items-center gap-2"
                    >
                      {theme.config.name}
                      {theme.config.custom && " (Custom)"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Stroke Controls */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Stroke Style</label>
              <div className="flex gap-2">
                {(['none', 's', 'm', 'l'] as const).map((s) => (
                  <Button
                    key={s}
                    variant={stroke === s ? "default" : "outline"}
                    onClick={() => setStroke(s)}
                    className="flex-1"
                  >
                    {s.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Font Shadow Controls */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Font Shadow</label>
              <div className="flex gap-2">
                {(['none', 's', 'm', 'l'] as const).map((s) => (
                  <Button
                    key={s}
                    variant={fontShadow === s ? "default" : "outline"}
                    onClick={() => setFontShadow(s)}
                    className="flex-1"
                  >
                    {s.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Animation Controls */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Animation</label>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      {animation}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {['none', 'updown', 'bounce', 'shake'].map((anim) => (
                      <DropdownMenuItem
                        key={anim}
                        onClick={() => setAnimation(anim)}
                      >
                        {anim}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant={isAnimationActive ? "default" : "outline"}
                  onClick={() => setIsAnimationActive(!isAnimationActive)}
                  className="flex-1"
                >
                  {isAnimationActive ? "Active" : "Disabled"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Font Size</label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Font Family</label>
                <input
                  type="text"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Main Highlight Color</label>
                <input
                  type="color"
                  value={mainHighlightColor}
                  onChange={(e) => setMainHighlightColor(e.target.value)}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Second Highlight Color</label>
                <input
                  type="color"
                  value={secondHighlightColor}
                  onChange={(e) => setSecondHighlightColor(e.target.value)}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Third Highlight Color</label>
                <input
                  type="color"
                  value={thirdHighlightColor}
                  onChange={(e) => setThirdHighlightColor(e.target.value)}
                  className="mt-1 block w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isAnimationActive}
                  onChange={(e) => setIsAnimationActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label className="ml-2 text-sm text-gray-700">Enable Animation</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isMotionBlurActive}
                  onChange={(e) => setIsMotionBlurActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label className="ml-2 text-sm text-gray-700">Enable Motion Blur</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isUppercase}
                  onChange={(e) => setIsUppercase(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label className="ml-2 text-sm text-gray-700">Uppercase Text</label>
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
                    }}
                    className="flex-1 h-4 border-none bg-gray-100/60 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-4
                      [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-gray-800"
                    style={{ accentColor: mainHighlightColor }}
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
                    value={mainHighlightColor}
                    onChange={(e) => {
                      setMainHighlightColor(e.target.value);
                    }}
                    className="h-10 rounded border-none cursor-pointer bg-transparent"
                  />
                </div>

                <div>
                  <label className="block font-medium text-lg text-gray-300 mb-2">
                    Stroke Color
                  </label>
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => {
                      setStrokeColor(e.target.value);
                    }}
                    className="h-10 rounded border-none cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              <div>
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
            <div className="flex gap-2">
              <Button
                onClick={handleExportTheme}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Download className="w-4 h-4" />
                Export Theme
              </Button>

              <Button
                onClick={() => document.getElementById('theme-file-input')?.click()}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Upload className="w-4 h-4" />
                Import Theme
              </Button>
              <input
                type="file"
                id="theme-file-input"
                accept=".json"
                onChange={handleImportTheme}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Photo Transitions</h2>
          <div className="flex items-center gap-4">
            <PhotoUploader
              onPhotosSelected={handlePhotosSelected}
              isUploading={isUploading}
            />
            <Select
              value={transition}
              onValueChange={(value) => setTransition(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select transition" />
              </SelectTrigger>
              <SelectContent>
                {TRANSITIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="aspect-video w-full rounded-lg overflow-hidden border">
            <Player
              component={PhotoTransition}
              inputProps={{
                photos,
                transitionType: transition,
                durationInFrames: 60,
              }}
              durationInFrames={photos.length * 90}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
