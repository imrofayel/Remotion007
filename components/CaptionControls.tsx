import React from 'react';
import { CaptionEditor } from './CaptionEditor';
import { Button } from './ui/button';
import { Caption } from '@remotion/captions';
import { cn } from '../lib/utils';

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
    // Here you could add logic to save the captions back to the JSON file
    onEditingChange(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Captions</h2>
        <div className="space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => onEditingChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              onClick={() => onEditingChange(true)}
            >
              Edit Captions
            </Button>
          )}
        </div>
      </div>
      
      {isEditing && (
        <CaptionEditor
          captions={captions}
          onCaptionsChange={onCaptionsChange}
          className="mt-4"
        />
      )}
    </div>
  );
};
