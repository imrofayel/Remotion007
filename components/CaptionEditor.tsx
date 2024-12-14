import React, { useState } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { Caption } from '../types/Caption';

interface CaptionEditorProps {
  captions: Caption[];
  onCaptionsChange: (newCaptions: Caption[]) => void;
  className?: string;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({
  captions,
  onCaptionsChange,
  className,
}) => {
  const [selectedCaption, setSelectedCaption] = useState<number | null>(null);

  const handleTextChange = (index: number, newText: string) => {
    const newCaptions = [...captions];
    newCaptions[index] = {
      ...newCaptions[index],
      text: newText,
    };
    onCaptionsChange(newCaptions);
  };

  const handleTimeChange = (index: number, field: 'startMs' | 'endMs', value: number) => {
    const newCaptions = [...captions];
    newCaptions[index] = {
      ...newCaptions[index],
      [field]: value,
    };
    onCaptionsChange(newCaptions);
  };

  const handleLineBreak = (index: number) => {
    const caption = captions[index];
    const words = caption.text.split(' ');
    if (words.length <= 1) return;

    const midPoint = Math.floor(words.length / 2);
    const firstHalf = words.slice(0, midPoint).join(' ');
    const secondHalf = words.slice(midPoint).join(' ');

    const midTime = caption.startMs + (caption.endMs - caption.startMs) / 2;

    const newCaptions = [...captions];
    newCaptions[index] = {
      ...caption,
      text: firstHalf,
      endMs: midTime,
    };
    newCaptions.splice(index + 1, 0, {
      ...caption,
      text: secondHalf,
      startMs: midTime,
    });

    onCaptionsChange(newCaptions);
  };

  const handleMergeWithNext = (index: number) => {
    if (index >= captions.length - 1) return;

    const newCaptions = [...captions];
    newCaptions[index] = {
      ...newCaptions[index],
      text: `${newCaptions[index].text} ${newCaptions[index + 1].text}`,
      endMs: newCaptions[index + 1].endMs,
    };
    newCaptions.splice(index + 1, 1);
    onCaptionsChange(newCaptions);
  };

  const handleAddCaption = () => {
    const lastCaption = captions[captions.length - 1];
    const newStart = lastCaption ? lastCaption.endMs : 0;
    const newCaption: Caption = {
      text: "",
      startMs: newStart,
      endMs: newStart + 2000, // Default 2 seconds duration
    };
    onCaptionsChange([...captions, newCaption]);
  };

  const handleDeleteCaption = (index: number) => {
    const newCaptions = [...captions];
    newCaptions.splice(index, 1);
    onCaptionsChange(newCaptions);
    setSelectedCaption(null);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Caption Editor</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddCaption}
        >
          Add Caption
        </Button>
      </div>
      <div className="grid gap-4 grid-cols-1">
        {captions.map((caption, index) => (
          <div
            key={index}
            className={cn(
              "p-4 rounded-lg border transition-all hover:shadow-md",
              selectedCaption === index
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            )}
            onClick={() => setSelectedCaption(index)}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Start Time (ms)</label>
                    <input
                      type="number"
                      value={caption.startMs}
                      onChange={(e) => handleTimeChange(index, 'startMs', Number(e.target.value))}
                      className="w-24 px-2 py-1 rounded border-gray-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">End Time (ms)</label>
                    <input
                      type="number"
                      value={caption.endMs}
                      onChange={(e) => handleTimeChange(index, 'endMs', Number(e.target.value))}
                      className="w-24 px-2 py-1 rounded border-gray-200"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLineBreak(index);
                    }}
                  >
                    Split Line
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMergeWithNext(index);
                    }}
                    disabled={index === captions.length - 1}
                  >
                    Merge Next
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCaption(index);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <textarea
                value={caption.text}
                onChange={(e) => handleTextChange(index, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full p-3 rounded border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[80px] resize-y"
                placeholder="Enter caption text..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
