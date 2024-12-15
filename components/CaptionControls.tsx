import React from "react";
import { CaptionEditor } from "./CaptionEditor";
import { Button } from "./ui/button";
import { Caption } from "@remotion/captions";
import { cn } from "../lib/utils";
import { EyeOff, MousePointerClickIcon, Pencil } from "lucide-react";

interface CaptionControlsProps {
  captions: Caption[];
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  onCaptionsChange: (captions: Caption[]) => void;
  className?: string;
}

export const CaptionControls: React.FC<CaptionControlsProps> = ({
  captions,
  isEditing,
  onEditingChange,
  onCaptionsChange,
  className,
}) => {
  const handleSave = () => {
    // Here we can add logic to save the captions back to the JSON file
    onEditingChange(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <h2 className="block font-medium text-2xl text-gray-300 mb-">
          Captions
        </h2>
        <div className="space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                className="text-lg rounded-2xl py-5 px-3 bg-gray-100/60"
                onClick={() => onEditingChange(false)}
              >
                <EyeOff className="h-6 w-6 scale-[1.2] sm:mr-1 drop-shadow-sm" />
              </Button>

              <Button
                variant="ghost"
                className="text-lg rounded-2xl py-5 px-3 bg-gray-100/60"
                onClick={handleSave}
              >
                <MousePointerClickIcon className="h-6 w-6 scale-[1.2] sm:mr-1 drop-shadow-sm" />
                <span className="capitalize drop-shadow-sm">Save</span>
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              className="text-lg rounded-2xl py-5 px-3 bg-gray-100/60"
              onClick={() => onEditingChange(true)}
            >
              <Pencil className="h-6 w-6 scale-[1.2] sm:mr-1" />
              <span className="capitalize">Edit</span>
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <CaptionEditor
          captions={captions}
          // FIX: AS ANY
          onCaptionsChange={onCaptionsChange as any}
          className="mt-4"
        />
      )}
    </div>
  );
};
