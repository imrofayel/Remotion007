'use client';

import React, { useState } from 'react';
import { Player } from '@remotion/player';
import { PhotoTransition, PhotoUploader } from '../../components/PhotoTransition';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const TRANSITIONS = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'wipe', label: 'Wipe' },
  { value: 'flip', label: 'Flip' },
];

type TransitionType = 'fade' | 'slide' | 'wipe' | 'flip';

export default function PhotosPage() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [transition, setTransition] = useState<TransitionType>('fade');
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotosSelected = async (files: File[]) => {
    setIsUploading(true);
    try {
      // Create FormData and append all files
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('photos', file);
      });

      // Upload photos to server
      const response = await fetch('/api/upload-photos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photos');
      }

      const data = await response.json();
      setPhotos(data.paths);
    } catch (error) {
      console.error('Error uploading photos:', error);
      // Handle error appropriately
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 space-y-4">
        <h1 className="text-2xl font-bold">Photo Video Composer</h1>
        <div className="flex items-center gap-4">
          <PhotoUploader onPhotosSelected={handlePhotosSelected} />
          <Select
            value={transition}
            onValueChange={(value: TransitionType) => setTransition(value)}
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
        <div className="aspect-video w-full">
          <Player
            component={PhotoTransition}
            inputProps={{
              photos,
              transitionType: transition,
              durationInFrames: 60,
            }}
            durationInFrames={photos.length * 90} // 60 frames per photo + 30 frames for transition
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
  );
}
