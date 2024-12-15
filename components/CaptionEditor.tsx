import React, { useState } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { Caption } from '../types/Caption';
import { GitMerge, Plus, Trash } from 'lucide-react';

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
      <div className="flex justify-end items-center mb-4">

        <Button
              variant="ghost"
              className="text-lg rounded-2xl py-5 px-3 bg-gray-100/60"
              onClick={handleAddCaption}
              >
              <Plus className="h-6 w-6 scale-[1.2] sm:mr-1" />
              <span className="capitalize">Add</span>
            </Button>
      </div>
      <div className="grid gap-4 grid-cols-1 h-[500px] overflow-y-scroll scrollbar" id='style-1'>
        {captions.map((caption, index) => (
          <div
            key={index}
            className={cn(
              "p-4 mr-2 rounded-2xl transition-all",
              selectedCaption === index
                ? "bg-gray-100/50"
                : "border-gray-100/60 border-2"
            )}
            onClick={() => setSelectedCaption(index)}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="flex flex-col gap-1">
                    <label className="text-[15px] drop-shadow-sm text-gray-300 mb-1 font-medium">Start Time (ms)</label>
                    <input
                      type="number"
                      value={caption.startMs}
                      onChange={(e) => handleTimeChange(index, 'startMs', Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-white/80 outline-none border-none  focus:ring-0 focus:border-none rounded-xl focus:outline-none outline-2 outline-gray-100/60"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[15px] drop-shadow-sm text-gray-300 mb-1 font-medium">End Time (ms)</label>
                    <input
                      type="number"
                      value={caption.endMs}
                      onChange={(e) => handleTimeChange(index, 'endMs', Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-white/80 outline-none border-none  focus:ring-0 focus:border-none rounded-xl focus:outline-none outline-2 outline-gray-100/60"
                    />
                  </div>
                </div>
                <div className="flex gap-2">

                  <Button
              variant="ghost"
              className="text-sm rounded-2xl border-2 border-gray-100/60 p-3 bg-white"
              onClick={(e) => {
                e.stopPropagation();
                handleLineBreak(index);
              }}            >
              <Plus className="h-6 w-6 scale-[1.2] sm:mr-1" />
              <span className="capitalize drop-shadow-sm">Add Line</span>
            </Button>

            <Button
              variant="ghost"
              className="text-sm rounded-2xl p-3 border-2 border-gray-100/60 bg-white"
              onClick={(e) => {
                e.stopPropagation();
                handleMergeWithNext(index);
              }}
              disabled={index === captions.length - 1}         >
              <GitMerge className="h-6 w-6 scale-[1.2] sm:mr-1" />
              <span className="capitalize drop-shadow-sm">Merge Next</span>
            </Button>

            <Button
              variant="ghost"
              className="text-sm border-2 border-gray-100/60 rounded-2xl p-3 bg-white"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCaption(index);
              }}>
              <Trash className="h-6 w-6 scale-[1.2]" />
            </Button>
                </div>
              </div>
              <textarea
                value={caption.text}
                onChange={(e) => handleTextChange(index, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full p-2 pl-0 border-none focus:border-none focus:ring-0 min-h-[20px] resize-none outline-none bg-transparent placeholder:text-[20px] font-medium text-lg placeholder:text-gray-300 drop-shadow-sm text-gray-500 placeholder:drop-shadow-none"
                placeholder="Enter caption text..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
