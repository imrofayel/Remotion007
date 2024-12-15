import React from 'react';
import { AbsoluteFill, Img, Sequence } from 'remotion';
import { cn } from '../lib/utils';

export type PhotoFitMode = 'fill' | 'fit';

export interface TimelinePhoto {
  id: string;
  src: string;
  startFrame: number;
  durationInFrames: number;
  // TODO:: FIT MODE SHOULD BE IMAGE PROPERTY
}

export interface PhotoTransitionProps extends Record<string, unknown> {
  photos: TimelinePhoto[];
  className?: string;
  fitMode?: PhotoFitMode;
}

export const PhotoTransition: React.FC<PhotoTransitionProps> = ({
  photos,
  className,
  fitMode = 'fit',
  ...props
}) => {
  if (!photos.length) return null;

  return (
    // TODO:: We can add spring animations (transitions) into it using trasnform.
    <AbsoluteFill className={className} {...props}>
      {photos.map((photo) => (
        <Sequence
          key={photo.id}
          from={photo.startFrame}
          durationInFrames={photo.durationInFrames}
        >
          <AbsoluteFill
            className='flex justify-center items-center w-full h-full'
          >
            <Img
              src={photo.src}
              className={cn('w-full h-full', fitMode === 'fill' ? 'object-cover' : 'object-contain')}
            />
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
