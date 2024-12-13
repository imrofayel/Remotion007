import React from 'react';
import { AbsoluteFill, Img, Sequence, staticFile } from 'remotion';
import { cn } from '../lib/utils';

export type PhotoFitMode = 'fill' | 'fit';

export interface TimelinePhoto {
  id: string;
  src: string;
  startFrame: number;
  durationInFrames: number;
}

export interface PhotoTransitionProps extends Record<string, unknown> {
  photos: TimelinePhoto[];
  videoConfig?: {
    width: number;
    height: number;
  };
  className?: string;
  fitMode?: PhotoFitMode;
}

export const PhotoTransition: React.FC<PhotoTransitionProps> = ({
  photos,
  videoConfig,
  className,
  fitMode = 'fit',
  ...props
}) => {
  if (!photos.length) return null;

  return (
    <AbsoluteFill className={className} {...props}>
      {photos.map((photo) => (
        <Sequence
          key={photo.id}
          from={photo.startFrame}
          durationInFrames={photo.durationInFrames}
        >
          <AbsoluteFill
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Img
              src={photo.src}
              style={{
                width: '100%',
                height: '100%',
                objectFit: fitMode === 'fill' ? 'cover' : 'contain',
              }}
            />
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
