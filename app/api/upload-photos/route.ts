import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('photos') as File[];

    if (!files.length) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const paths: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        continue;
      }

      const bytes = await file.arrayBuffer();
      const uint8Array = new Uint8Array(bytes);
      const fileName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const filePath = path.join(uploadDir, fileName);
      
      await writeFile(filePath, uint8Array);
      paths.push(`/uploads/${fileName}`);
    }

    if (!paths.length) {
      return NextResponse.json(
        { error: 'No valid images uploaded' },
        { status: 400 }
      );
    }

    return NextResponse.json({ paths });
  } catch (error) {
    console.error('Error uploading photos:', error);
    return NextResponse.json(
      { error: 'Failed to upload photos' },
      { status: 500 }
    );
  }
}
