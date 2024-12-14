"use client"; // Enable client-side rendering for Next.js

import { Player } from "@remotion/player";
import { getVideoMetadata } from "@remotion/media-utils";
import type { NextPage } from "next";
import React, { SetStateAction, useMemo, useState, useEffect } from "react";
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
  Flame,
  Package2,
  PackagePlus,
  PackageOpen,
  Squircle,
} from "lucide-react";
import themesConfig from "./themes.json";
import {
  type PhotoFitMode,
  type TimelinePhoto,
} from "../components/PhotoTransition";
import { PhotoUploader } from "../components/PhotoUploader";
import { useToast } from "../components/ui/use-toast";
import { Timeline } from "../components/Timeline";
import { cn } from "../lib/utils";
import { CaptionControls } from '../components/CaptionControls';
import { Caption, convertToRemotionCaption } from "@remotion/captions";

const ASPECT_RATIOS = {
  "16:9": { width: 1920, height: 1080, label: "Landscape (16:9)" },
  "9:16": { width: 1080, height: 1920, label: "Portrait (9:16)" },
  "4:5": { width: 1080, height: 1350, label: "Instagram (4:5)" },
  "1:1": { width: 1080, height: 1080, label: "Square (1:1)" },
};

const Home: NextPage = () => {
  // Video states
  const [videoSrc, setVideoSrc] = useState<string>("/sample-video.mp4");
  const [videoDuration, setVideoDuration] =
    useState<number>(DURATION_IN_FRAMES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isReady, setIsReady] = useState(true); // Initially true for sample video
  const [captionYPosition, setCaptionYPosition] = useState<number>(1280); // Default Y position

  // Caption editing state
  const [isEditing, setIsEditing] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);

  // Caption styling states with default theme
  const [activeTheme, setActiveTheme] = useState<string>("default");
  const defaultTheme =
    themesConfig.themes.find((theme) => theme.config.default) ||
    themesConfig.themes[0];

  const [fontSize, setFontSize] = useState<number>(
    defaultTheme.config.style.fontSize,
  );
  const [fontColor, setFontColor] = useState<string>(
    defaultTheme.config.style.color,
  );
  const [strokeColor, setStrokeColor] = useState<string>(
    defaultTheme.config.style.strokeColor,
  );
  const [stroke, setStroke] = useState<"none" | "s" | "m" | "l">(
    defaultTheme.config.style.stroke as "none" | "s" | "m" | "l",
  );
  const [fontShadow, setFontShadow] = useState<"none" | "s" | "m" | "l">(
    defaultTheme.config.style.fontShadow as "none" | "s" | "m" | "l",
  );
  const [fontFamily, setFontFamily] = useState<string>(
    defaultTheme.config.style.fontFamily,
  );
  const [fontWeight, setFontWeight] = useState<number>(
    defaultTheme.config.style.fontWeight,
  );
  const [isUppercase, setIsUppercase] = useState<boolean>(
    defaultTheme.config.style.fontUppercase,
  );
  const [animation, setAnimation] = useState<string>(
    defaultTheme.config.subs.animation,
  );
  const [isAnimationActive, setIsAnimationActive] = useState<boolean>(
    defaultTheme.config.subs.isAnimationActive,
  );
  const [isMotionBlurActive, setIsMotionBlurActive] = useState<boolean>(
    defaultTheme.config.subs.isMotionBlurActive,
  );
  const [mainHighlightColor, setMainHighlightColor] = useState<string>(
    defaultTheme.config.highlight_style.mainColor,
  );
  const [secondHighlightColor, setSecondHighlightColor] = useState<string>(
    defaultTheme.config.highlight_style.secondColor,
  );
  const [thirdHighlightColor, setThirdHighlightColor] = useState<string>(
    defaultTheme.config.highlight_style.thirdColor,
  );

  const [className, setClassName] = useState<string>(
    defaultTheme.config.className,
  );

  const [customThemes, setCustomThemes] = useState<typeof themesConfig.themes>(
    [],
  );

  // Combine default themes with custom themes
  const allThemes = useMemo(
    () => [...themesConfig.themes, ...customThemes],
    [customThemes],
  );

  const [wordsPerCaption, setWordsPerCaption] = useState<number>(
    defaultTheme.config.subs.chunkSize,
  );
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "4:5" | "1:1">("9:16");

  const [photos, setPhotos] = useState<TimelinePhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fitMode, setFitMode] = useState<PhotoFitMode>("fit");
  const { toast } = useToast();
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
            },
          },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(currentTheme, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `theme-${activeTheme.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Modified handleThemeChange to work with custom themes
  const handleThemeChange = (themeName: string) => {
    const selectedTheme = allThemes.find(
      (theme) => theme.config.name === themeName,
    );
    if (!selectedTheme) return;

    setActiveTheme(themeName);
    setFontSize(selectedTheme.config.style.fontSize);
    setFontColor(selectedTheme.config.style.color);
    setStrokeColor(selectedTheme.config.style.strokeColor);
    setStroke(selectedTheme.config.style.stroke as "none" | "s" | "m" | "l");
    setFontShadow(
      selectedTheme.config.style.fontShadow as "none" | "s" | "m" | "l",
    );
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
          throw new Error("Invalid theme file format");
        }

        const themeConfig = importedTheme.themes[0].config;

        // Create a unique name for the imported theme if it already exists
        let uniqueName = themeConfig.name;
        let counter = 1;
        while (allThemes.some((theme) => theme.config.name === uniqueName)) {
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
          },
        };

        // Add to custom themes
        setCustomThemes((prev) => [...prev, newTheme]);

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
        console.error("Error importing theme:", error);
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

  const handleAspectRatioChange = (
    newRatio: SetStateAction<"16:9" | "9:16" | "4:5" | "1:1">,
  ) => {
    setAspectRatio(newRatio);
    const height = getVideoHeight(newRatio as string);
    setCaptionYPosition(height / 2); // Set to middle by default
  };

  const handleYPositionChange = (newPosition: number) => {
    const height = getVideoHeight(aspectRatio);
    setCaptionYPosition(Math.max(0, Math.min(newPosition, height)));
  };

  // Handle video upload and metadata
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setIsUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append("video", file);

      // Upload the video
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video");
      }

      const uploadData = await uploadResponse.json();
      const { videoPath } = uploadData;

      // Generate captions
      toast({
        title: "Processing",
        description: "Preparing the video and generating captions...",
        variant: "default",
      });

      const captionResponse = await fetch("/api/generate-captions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoPath }),
      });

      if (!captionResponse.ok) {
        throw new Error("Failed to generate captions");
      }

      // Wait for captions to be generated (poll the status)
      const videoFileName = videoPath.split('/').pop()?.replace(/\.[^/.]+$/, "");
      const captionsPath = `/subs/${videoFileName}.json`;
      
      let captionsReady = false;
      let retries = 0;
      const maxRetries = 30; // Maximum 30 seconds wait
      
      while (!captionsReady && retries < maxRetries) {
        try {
          const captionsResponse = await fetch(captionsPath);
          if (captionsResponse.ok) {
            captionsReady = true;
            const loadedCaptions = await captionsResponse.json();
            console.log('Loaded captions:', loadedCaptions);

            // Convert timestamps to milliseconds
            const processedCaptions: Caption[] = loadedCaptions.map((caption: any) => ({
              text: caption.text,
              startMs: caption.startMs || caption.start * 1000,
              endMs: caption.endMs || caption.end * 1000
            }));

            console.log('Processed captions:', processedCaptions);
            setCaptions(processedCaptions);

            // Set video source and get metadata only after captions are ready
            setVideoSrc(videoPath);
            const video = document.createElement('video');
            video.src = videoPath;
            await new Promise((resolve, reject) => {
              video.onloadedmetadata = () => {
                const durationInSeconds = video.duration;
                const frames = Math.floor(durationInSeconds * VIDEO_FPS);
                setVideoDuration(frames);
                resolve(frames);
              };
              video.onerror = () => reject(new Error('Failed to load video metadata'));
            });

            toast({
              title: "Success",
              description: "Video processed and captions generated successfully!",
              variant: "default",
            });
            break;
          }
        } catch (error) {
          console.log('Waiting for captions...', error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        retries++;
      }

      if (!captionsReady) {
        throw new Error("Timed out waiting for captions to be generated");
      }

    } catch (error) {
      console.error('Error handling video upload:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process video",
        variant: "destructive",
      });
      // Reset to sample video on error
      setVideoSrc("/sample-video.mp4");
      setVideoDuration(DURATION_IN_FRAMES);
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  // Video props memoization
  const captionedVideoProps = useMemo(
    () => ({
      src: videoSrc || "",
      fontSize: fontSize || 120,
      color: fontColor || "white",
      strokeColor: strokeColor || "black",
      stroke: stroke || "m",
      fontFamily: fontFamily || "Inter",
      fontWeight: fontWeight || 700,
      fontUppercase: isUppercase || false,
      fontShadow: fontShadow || "s",
      animation: animation || "none",
      isAnimationActive: isAnimationActive || false,
      isMotionBlurActive: isMotionBlurActive || false,
      highlightKeywords: false,
      mainHighlightColor: mainHighlightColor || "#39E508",
      secondHighlightColor: secondHighlightColor || "#fdfa14",
      thirdHighlightColor: thirdHighlightColor || "#f01916",
      top: captionYPosition || 1000,
      aspectRatio: aspectRatio as "16:9" | "9:16" | "4:5" | "1:1",
      chunkSize: wordsPerCaption || 2,
      left: 0,
      className: className || "",
      photos: photos.map((photo, index) => ({
        id: `photo-${index}`,
        src: photo.src,
        startFrame: photo.startFrame,
        durationInFrames: photo.durationInFrames,
      })),
      durationInFrames: videoDuration || DURATION_IN_FRAMES,
      fitMode: fitMode || "fit",
      captions: captions,
    }),
    [
      videoSrc,
      fontSize,
      fontColor,
      strokeColor,
      stroke,
      fontFamily,
      fontWeight,
      isUppercase,
      fontShadow,
      animation,
      isAnimationActive,
      isMotionBlurActive,
      mainHighlightColor,
      secondHighlightColor,
      thirdHighlightColor,
      captionYPosition,
      aspectRatio,
      wordsPerCaption,
      className,
      photos,
      videoDuration,
      fitMode,
      captions,
    ],
  );

  const handlePhotosSelected = async (files: File[]) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("photos", file);
      });

      const response = await fetch("/api/upload-photos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photos");
      }

      const { paths } = await response.json();

      // Add new photos to timeline at the end
      const lastPhoto = photos[photos.length - 1];
      const startFrame = lastPhoto
        ? lastPhoto.startFrame + lastPhoto.durationInFrames
        : 0;

      const newPhotos = paths.map((path: string, index: number) => ({
        id: crypto.randomUUID(),
        src: path,
        startFrame: startFrame + index * 120, // 4 seconds gap between photos
        durationInFrames: 120, // 4 seconds default duration
      }));

      setPhotos([...photos, ...newPhotos]);
      toast({
        title: "Success",
        description: `${files.length} photo${files.length !== 1 ? "s" : ""} uploaded successfully`,
      });
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast({
        title: "Error",
        description: "Failed to upload photos",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Load captions when video is loaded
  useEffect(() => {
    const loadCaptions = async () => {
      try {
        const response = await fetch(`/api/generate-captions?videoSrc=${encodeURIComponent(videoSrc)}`);
        if (!response.ok) throw new Error('Failed to load captions');
        const data = await response.json();
        setCaptions(data.captions);
      } catch (error) {
        console.error('Error loading captions:', error);
        toast({
          title: "Error",
          description: "Failed to load captions. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (videoSrc && isReady) {
      loadCaptions();
    }
  }, [videoSrc, isReady, toast]);

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

      {/* Add CaptionControls below the video player */}
      <div className="mt-4">
        <CaptionControls
          captions={captions}
          isEditing={isEditing}
          onEditingChange={setIsEditing}
          onCaptionsChange={setCaptions}
          className="w-full"
        />
      </div>

      {/* Photo Upload */}
      <div className="mb-4">
        {photos.length > 0 && (
          <div className="mt-4 space-y-4">
            <Timeline
              photos={photos}
              onPhotosChange={setPhotos}
              totalFrames={videoDuration}
            />
          </div>
        )}
      </div>

      {/* Controls Section */}
      <div>
        <div className="bg-white  border-b-2 border-gray-200/60 rounded-3xl border p-3 sticky top-6">
          {/* Theme Selection */}

          <div className="flex space-x-2">         
          <PhotoUploader
                onPhotosSelected={handlePhotosSelected}
                isUploading={isUploading}
                className="mb-4"
              />

          {photos.length > 0 && <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <Button
              variant="ghost"
              className="text-base rounded-2xl p-3 bg-gray-100/60"
            >
              <Squircle className="h-6 w-6 scale-[1.2] sm:mr-1" />
              <span className="capitalize">{fitMode}</span>
            </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-2xl shadow-none text-gray-600 shadow-gray-100 border-gray-100">
                    {["fit", "fill"].map((value) => (
                      <DropdownMenuItem className="rounded-xl text-base"
                        key={value}
                        onClick={() => setFitMode(value as PhotoFitMode)}
                      >
                        {value}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu></div>}
              </div>

          <div className="flex flex-col gap-4 p-2">
            <div className="gap-2">
              <label className="block font-medium text-lg text-gray-300 mb-2">Theme</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button
              variant="ghost"
              className="text-lg rounded-2xl py-5 pl-4 pr-6 bg-gray-100/60"
            >
              <Package2 className="h-6 w-6 scale-[1.2] sm:mr-1" />
              <span className="capitalize">{activeTheme}</span>
            </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-2xl text-gray-600 shadow-gray-100 border-gray-100">
                  {allThemes.map((theme) => (
                    <DropdownMenuItem
                      key={theme.config.name}
                      onClick={() => handleThemeChange(theme.config.name)}
                      className="rounded-lg text-base"
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
              <label className="block font-medium text-lg text-gray-300 mb-2">Stroke Style</label>
              <div className="flex gap-2">
                {(["none", "s", "m", "l"] as const).map((s) => (
                  <Button
                    key={s}
                    variant="ghost"

                    onClick={() => setStroke(s)}

                    className={cn('text-lg rounded-2xl p-3 px-6 bg-gray-100/60', stroke === s && 'bg-gray-100')}>

<span className="capitalize"> {s.toUpperCase()}</span>
                   
                  </Button>
                ))}
              </div>
            </div>

            {/* Font Shadow Controls */}
            <div className="flex flex-col gap-2">
              <label className="block font-medium text-lg text-gray-300 mb-2">Font Shadow</label>
              <div className="flex gap-2">
                {(["none", "s", "m", "l"] as const).map((s) => (
                  <Button
                    key={s}
                    variant="ghost"

                    onClick={() => setFontShadow(s)}
                    className={cn('text-lg rounded-2xl p-3 px-6 bg-gray-100/60', fontShadow === s && 'bg-gray-100')}>

<span className="capitalize"> {s.toUpperCase()}</span>
                   
                  </Button>
                ))}
              </div>
            </div>

            {/* Animation Controls */}
            <div className="flex flex-col gap-2">
              <label className="block font-medium text-lg text-gray-300 mb-2">Animation</label>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <Button
              variant="ghost"
              className="text-lg rounded-2xl p-3 bg-gray-100/60"
            >
              <Flame className="h-6 w-6 scale-[1.4] sm:mr-1" />
              <span className="capitalize">{animation}</span>
            </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-2xl text-gray-600 shadow-gray-100 border-gray-100">
                    {["none", "updown", "bounce", "shake"].map((anim) => (
                      <DropdownMenuItem className="rounded-lg text-base"
                        key={anim}
                        onClick={() => setAnimation(anim)}
                      >
                        {anim}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">

              <div>
              <label className="block font-medium text-lg text-gray-300 mb-2">
                  Font Family
                </label>
                <input
                  type="text"
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="mt-1 block w-full rounded-2xl border-none bg-gray-100/50 p-2 text-[20px] font-medium px-4"
                />
              </div>
            </div>

            <div className="justify-between my-4 flex">
              <div className="flex space-x-2 items-center">
                <input
                  type="checkbox"
                  checked={isAnimationActive}
                  onChange={(e) => setIsAnimationActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label className="block font-medium text-lg text-gray-300 mb-2">
                  Animation
                </label>
              </div>
              <div className="flex space-x-2 items-center">
                <input
                  type="checkbox"
                  checked={isMotionBlurActive}
                  onChange={(e) => setIsMotionBlurActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label className="block font-medium text-lg text-gray-300 mb-2">
                  Motion Blur
                </label>
              </div>
              <div className="flex space-x-2 items-center">
                <input
                  type="checkbox"
                  checked={isUppercase}
                  onChange={(e) => setIsUppercase(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label className="block font-medium text-lg text-gray-300 mb-2">
                  Uppercase
                </label>
              </div>
            </div>

            {/* Words Per Caption Control */}
            <div className="mb-3 space-y-4">
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
            <div className="space-y-8">
              <div>
                <label className="block font-medium text-lg text-gray-300 mb-2">
                  Font Size {fontSize}px
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

              <div className="flex space-x-2">
                <div>
                  <label className="block font-medium text-lg text-gray-300 mb-2">
                    Second Color
                  </label>
                  <input
                    type="color"
                    value={secondHighlightColor}
                    onChange={(e) => setSecondHighlightColor(e.target.value)}
                    className="h-10 rounded border-none cursor-pointer bg-transparent"
                  />
                </div>

                <div>
                  <label className="block font-medium text-lg text-gray-300 mb-2">
                    Third Color
                  </label>
                  <input
                    type="color"
                    value={thirdHighlightColor}
                    onChange={(e) => setThirdHighlightColor(e.target.value)}
                    className="h-10 rounded border-none cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              <div className="w-full">
                <label className="block font-medium text-lg text-gray-300 mb-2">
                  Position Y {captionYPosition}px
                </label>
                <input
                  type="range"
                  min="0"
                  max={getVideoHeight(aspectRatio)}
                  value={captionYPosition}
                  onChange={(e) =>
                    handleYPositionChange(Number(e.target.value))
                  }
                  className=" h-4 w-full border-none bg-gray-100/60 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-gray-800"
                />
              </div>
            </div>
            <div className="flex mt-6 gap-2">

<Button
              variant="ghost"
              className="text-lg rounded-2xl py-5 px-4 bg-gray-100/60"
              onClick={handleExportTheme}

            >
              <PackagePlus className="h-6 w-6 scale-[1.2] sm:mr-1" />
              <span className="capitalize">Export</span>
            </Button>

<Button
              variant="ghost"
              className="text-lg rounded-2xl py-5 px-4 bg-gray-100/60"
              onClick={() =>
                document.getElementById("theme-file-input")?.click()
              }

            >
              <PackageOpen className="h-6 w-6 scale-[1.2] sm:mr-1" />
              <span className="capitalize">Import</span>
            </Button>

              <input
                type="file"
                id="theme-file-input"
                accept=".json"
                onChange={handleImportTheme}
                style={{ display: "none" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
