import { z } from "zod";
export const COMP_NAME = "MyComp";

// TODO:: Add all of our new compostion props to get rendered output
export const CompositionProps = z.object({
  title: z.string(),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  title: "Next.js and Remotion",
};

export const DURATION_IN_FRAMES = 800;
export const VIDEO_WIDTH = 720;
export const VIDEO_HEIGHT = 1280;
export const VIDEO_FPS = 60;

export const ASPECT_RATIOS = {
  "16:9": { width: 1920, height: 1080, label: "Landscape (16:9)" },
  "9:16": { width: 1080, height: 1920, label: "Portrait (9:16)" },
  "4:5": { width: 1080, height: 1350, label: "Instagram (4:5)" },
  "1:1": { width: 1080, height: 1080, label: "Square (1:1)" },
};