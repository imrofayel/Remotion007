import React from 'react';
import { AbsoluteFill, Img, Sequence, staticFile, useVideoConfig } from 'remotion';
import { Button } from './ui/button';
import { UploadCloud } from 'lucide-react';
import { cn } from '../lib/utils';

interface BRoll {
  src: string;
  startFrame: number;
  durationInFrames: number;
  scale?: number;
  xPosition?: number;
  yPosition?: number;
  style?: React.CSSProperties;
}

export interface PhotoTransitionProps extends Record<string, unknown> {
  photos: string[];
  durationInFrames: number;
  bRolls?: BRoll[];
  videoConfig?: {
    width: number;
    height: number;
  };
  className?: string;
}

export const PhotoTransition: React.FC<PhotoTransitionProps> = ({
  photos,
  durationInFrames,
  bRolls = [],
  videoConfig,
  className,
  ...props
}) => {
  const config = useVideoConfig();
  const width = videoConfig?.width ?? config.width;
  const height = videoConfig?.height ?? config.height;

  if (!photos.length) return null;

  return (
    <AbsoluteFill className={className} {...props}>
      {photos.map((photo, index) => {
        // Calculate position for spider-man style frames
        const isTopFrame = index % 2 === 0;
        const frameStyle = {
          position: 'absolute' as const,
          width: width * 0.2, // 20% of video width
          height: height * 0.2, // 20% of video height
          top: isTopFrame ? '5%' : '75%',
          left: `${(index % 3) * 33 + 5}%`,
          borderRadius: '50%',
          border: '4px solid #ff0000',
          overflow: 'hidden',
          zIndex: 10,
        };

        return (
          <Sequence key={photo} durationInFrames={durationInFrames} from={index * 20}>
            <AbsoluteFill style={frameStyle}>
              <Img
                src={photo.startsWith('http') ? photo : staticFile(photo)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      
      {bRolls.map((bRoll, index) => (
        <Sequence
          key={`broll-${index}`}
          from={bRoll.startFrame}
          durationInFrames={bRoll.durationInFrames}
        >
          <AbsoluteFill
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              left: bRoll.xPosition ?? 0,
              top: bRoll.yPosition ?? 0,
              ...bRoll.style,
            }}
          >
            <Img
              src={bRoll.src.startsWith('http') ? bRoll.src : staticFile(bRoll.src)}
              style={{
                objectFit: 'contain',
                maxWidth: '100%',
                maxHeight: '100%',
                transform: bRoll.scale ? `scale(${bRoll.scale})` : undefined,
              }}
            />
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

interface PhotoUploaderProps {
  onPhotosSelected: (files: File[]) => void;
  isUploading?: boolean;
  className?: string;
  accept?: string;
  multiple?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onPhotosSelected,
  isUploading = false,
  className,
  accept = "image/*",
  multiple = true,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onPhotosSelected(files);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        onClick={() => document.getElementById("photo-upload")?.click()}
        variant="outline"
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        <UploadCloud className="w-4 h-4" />
        {isUploading ? "Uploading..." : "Upload Photos"}
      </Button>
      <input
        type="file"
        id="photo-upload"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
