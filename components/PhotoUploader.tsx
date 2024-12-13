import React from 'react';
import { Button } from './ui/button';
import { UploadCloud } from 'lucide-react';
import { cn } from '../lib/utils';

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
