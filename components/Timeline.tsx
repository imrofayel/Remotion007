import React from 'react';
import { cn } from '../lib/utils';
import { TimelinePhoto } from './PhotoTransition';
import { Button } from './ui/button';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';
import { VIDEO_FPS } from '../types/constants';
import Image from 'next/image';

interface TimelineProps {
  photos: TimelinePhoto[];
  onPhotosChange: (photos: TimelinePhoto[]) => void;
  className?: string;
  totalFrames: number;
}

export const Timeline: React.FC<TimelineProps> = ({
  photos,
  onPhotosChange,
  className,
  totalFrames,
}) => {

  const handleStartFrameChange = (id: string, value: number) => {
    onPhotosChange(
      photos.map((photo) =>
        photo.id === id ? { ...photo, startFrame: Math.max(0, value) } : photo
      )
    );
  };

  const handleDurationChange = (id: string, value: number) => {
    onPhotosChange(
      photos.map((photo) =>
        photo.id === id ? { ...photo, durationInFrames: Math.max(1, value) } : photo
      )
    );
  };

  const handleDelete = (id: string) => {
    onPhotosChange(photos.filter((photo) => photo.id !== id));
  };

  const movePhoto = (id: string, direction: 'up' | 'down') => {
    const index = photos.findIndex((photo) => photo.id === id);

    // for the last & first images
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === photos.length - 1)
    ) {
      return;
    }

    const newPhotos = [...photos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    // swapping
    [newPhotos[index], newPhotos[targetIndex]] = [newPhotos[targetIndex], newPhotos[index]];
    onPhotosChange(newPhotos);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="block font-medium text-2xl text-gray-300 mb-4">Timeline</div>
      <div className="space-y-3">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="flex items-center gap-4 relative bg-gray-100/60 p-4 rounded-2xl"
          >
            <Image
              src={photo.src}
              alt={`Photo ${index + 1}`}
              height={1000}
              width={1000}
              className="w-20 h-20 object-cover rounded-2xl border-white/80 border-4 drop-shadow-lg"
            />
            <div className="flex-1 space-y-4 items-center">
              <div className="flex items-center gap-2">
                <div className="text-gray-400 drop-shadow-sm text-lg font-medium">Start Time:</div>
                <Input
                  type="number"
                  min={0}
                  max={totalFrames - photo.durationInFrames}
                  value={photo.startFrame}
                  onChange={(e) => handleStartFrameChange(photo.id, parseInt(e.target.value))}
                  className="block w-24 rounded-2xl border-none bg-white/60 p-1 !text-lg font-medium text-gray-600 px-4"
                />
                <div className="text-gray-300 font-medium">
                  ({(photo.startFrame / VIDEO_FPS).toFixed(2)}s)
                </div>
              </div>
              <div className="flex items-center gap-2">
              <div className="text-gray-400 drop-shadow-sm text-lg font-medium">Duration:</div>
              <Input
                  type="number"
                  min={1}
                  max={totalFrames - photo.startFrame}
                  value={photo.durationInFrames}
                  onChange={(e) => handleDurationChange(photo.id, parseInt(e.target.value))}
                  className="block w-24 rounded-2xl border-none bg-white/60 p-1 !text-lg font-medium text-gray-600 px-4"
                />
                <div className="text-gray-300 font-medium">
                  ({(photo.durationInFrames / VIDEO_FPS).toFixed(2)}s)
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => movePhoto(photo.id, 'up')}
                disabled={index === 0}
                className='[&_svg]:size-5'

              >
                <ChevronUp />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => movePhoto(photo.id, 'down')}
                disabled={index === photos.length - 1}
                className='[&_svg]:size-5'
              >
                <ChevronDown />
              </Button>
            </div>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDelete(photo.id)}
              className='[&_svg]:size-5 absolute -right-1 -top-2 shadow-none bg-red-500 text-white rounded-full'
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
