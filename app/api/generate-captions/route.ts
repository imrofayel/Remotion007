import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

const execAsync = promisify(exec);

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
    const { stdout, stderr } = await execAsync(
      `node sub.mjs "${absoluteVideoPath}"`
    ).catch((error) => {
      throw new Error(`Caption generation error: ${error.message}`);
    });

    if (stderr && !stderr.includes('Extracting audio from file')) {
      throw new Error(`Caption generation error: ${stderr}`);
    }

    // Get the expected caption file path
    const captionsPath = absoluteVideoPath
      .replace(/\.[^/.]+$/, '.json')
      .replace('uploads', 'subs');

    // Verify the caption file was created
    if (!existsSync(captionsPath)) {
      throw new Error('Caption file was not generated');
    }

    return NextResponse.json({ 
      captionsPath: captionsPath.replace(publicDir, '').replace(/\\/g, '/'),
      success: true 
    });
  } catch (error) {
    console.error('Error generating captions:', error);
    return NextResponse.json(
      { error: `Error generating captions: ${error.message}` },
      { status: 500 }
    );
  }
}
