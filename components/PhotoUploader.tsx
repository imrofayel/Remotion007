import React from "react";
import { Button } from "./ui/button";
import { Zap } from "lucide-react";
import { cn } from "../lib/utils";

interface PhotoUploaderProps {
  // TODO:: how these files being accessed in page.tsx?
  onPhotosSelected: (files: File[]) => void;
  isUploading?: boolean;
  className?: string;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onPhotosSelected,
  isUploading = false,
  className,
}) => {
  // TODO:: React.ChangeEvent<HTMLInputElement> ??
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
        variant="ghost"
        disabled={isUploading}
        className="text-lg rounded-2xl p-3 bg-gray-100/60"
      >
        <Zap className="h-6 w-6 scale-[1.2] text-muted sm:mr-1" />

        <span className="capitalize">
          {isUploading ? "Uploading..." : "B-rolls"}
        </span>
      </Button>
      <input
        type="file"
        id="photo-upload"
        accept="image/*"
        multiple={true}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
