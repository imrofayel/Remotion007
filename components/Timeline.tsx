import React from 'react';
import { cn } from '../lib/utils';
import { TimelinePhoto } from './PhotoTransition';
import { Button } from './ui/button';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';
import { VIDEO_FPS } from '../types/constants';
import { Slider } from './ui/slider';

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
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === photos.length - 1)
    ) {
      return;
    }

    const newPhotos = [...photos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newPhotos[index], newPhotos[targetIndex]] = [newPhotos[targetIndex], newPhotos[index]];
    onPhotosChange(newPhotos);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-sm font-medium">Timeline</div>
      <div className="space-y-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg"
          >
            <img
              src={photo.src}
              alt={`Photo ${index + 1}`}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-sm">Start Time:</div>
                <Input
                  type="number"
                  min={0}
                  max={totalFrames - photo.durationInFrames}
                  value={photo.startFrame}
                  onChange={(e) => handleStartFrameChange(photo.id, parseInt(e.target.value))}
                  className="w-24"
                />
                <div className="text-xs text-gray-500">
                  ({(photo.startFrame / VIDEO_FPS).toFixed(2)}s)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm">Duration:</div>
                <Input
                  type="number"
                  min={1}
                  max={totalFrames - photo.startFrame}
                  value={photo.durationInFrames}
                  onChange={(e) => handleDurationChange(photo.id, parseInt(e.target.value))}
                  className="w-24"
                />
                <div className="text-xs text-gray-500">
                  ({(photo.durationInFrames / VIDEO_FPS).toFixed(2)}s)
                </div>
              </div>
              <div className="w-full">
                <Slider
                  min={0}
                  max={totalFrames}
                  step={1}
                  value={[photo.startFrame, photo.startFrame + photo.durationInFrames]}
                  onValueChange={([start, end]) => {
                    handleStartFrameChange(photo.id, start);
                    handleDurationChange(photo.id, end - start);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => movePhoto(photo.id, 'up')}
                disabled={index === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => movePhoto(photo.id, 'down')}
                disabled={index === photos.length - 1}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDelete(photo.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
