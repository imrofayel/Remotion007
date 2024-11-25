import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    
    if (!video) {
      return NextResponse.json(
        { error: 'No video uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(video.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP4, MOV, and AVI files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (video.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = video.name.replace(/\.[^/.]+$/, "") + '-' + uniqueSuffix + path.extname(video.name);
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Save to public directory
    const videoPath = path.join(uploadsDir, filename);
    await writeFile(videoPath, buffer);
    
    // Return the public URL path
    return NextResponse.json({ 
      videoPath: `/uploads/${filename}`,
      success: true 
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Error uploading video. Please try again.' },
      { status: 500 }
    );
  }
}
