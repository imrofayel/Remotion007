import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoSrc = searchParams.get('videoSrc');
    
    if (!videoSrc) {
      return NextResponse.json(
        { error: 'No video source provided' },
        { status: 400 }
      );
    }

    // Get absolute paths
    const publicDir = path.join(process.cwd(), 'public');
    const absoluteVideoPath = path.join(publicDir, videoSrc.replace(/^\//, ''));
    
    // For sample video, use the JSON file directly
    if (videoSrc === '/sample-video.mp4') {
      const sampleCaptionsPath = path.join(publicDir, 'sample-video.json');
      if (existsSync(sampleCaptionsPath)) {
        const captionsContent = await readFile(sampleCaptionsPath, 'utf-8');
        const captions = JSON.parse(captionsContent);
        return NextResponse.json({ captions });
      }
    }

    // Verify video exists
    if (!existsSync(absoluteVideoPath)) {
      return NextResponse.json(
        { error: 'Video file not found' },
        { status: 404 }
      );
    }

    // Get the expected caption file path
    const captionsPath = absoluteVideoPath
      .replace(/\.[^/.]+$/, '.json')
      .replace('uploads', 'subs');

    // If captions don't exist, generate them
    if (!existsSync(captionsPath)) {
      // Process the video with sub.mjs
      const { stderr } = await execAsync(
        `node sub.mjs "${absoluteVideoPath}"`
      ).catch((error: Error) => {
        throw new Error(`Caption generation error: ${error.message}`);
      });

      if (stderr && !stderr.includes('Extracting audio from file')) {
        throw new Error(`Caption generation error: ${stderr}`);
      }
    }

    // Read and return the captions
    const captionsContent = await readFile(captionsPath, 'utf-8');
    const captions = JSON.parse(captionsContent);
    return NextResponse.json({ captions });

  } catch (error) {
    console.error('Error processing captions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { videoPath } = await request.json();
    if (!videoPath) {
      return NextResponse.json(
        { error: 'No video path provided' },
        { status: 400 }
      );
    }

    // Get absolute paths
    const publicDir = path.join(process.cwd(), 'public');
    const absoluteVideoPath = path.join(publicDir, videoPath.replace(/^\//, ''));
    
    // Verify video exists
    if (!existsSync(absoluteVideoPath)) {
      return NextResponse.json(
        { error: 'Video file not found' },
        { status: 404 }
      );
    }

    // Process the video directly with sub.mjs
    const { stderr } = await execAsync(
      `node sub.mjs "${absoluteVideoPath}"`
    ).catch((error: Error) => {
      throw new Error(`Caption generation error: ${error.message}`);
    });

    if (stderr && !stderr.includes('Extracting audio from file')) {
      throw new Error(`Caption generation error: ${stderr}`);
    }

    // Get the expected caption file path
    const captionsPath = absoluteVideoPath
      .replace(/\.[^/.]+$/, '.json')
      .replace('uploads', 'subs');

    // Read and return the captions
    const captionsContent = await readFile(captionsPath, 'utf-8');
    const captions = JSON.parse(captionsContent);
    return NextResponse.json({ captions });

  } catch (error) {
    console.error('Error processing captions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
