import { Caption as RemotionCaption } from "@remotion/captions";

// Re-export the Remotion Caption type
export interface Caption {
  text: string;
  startMs: number;
  endMs: number;
}

// Helper function to convert our caption format to Remotion format
export const convertToRemotionCaption = (caption: Caption): RemotionCaption => ({
  startMs: caption.startMs, 
  endMs: caption.endMs,     
  text: caption.text,
});
