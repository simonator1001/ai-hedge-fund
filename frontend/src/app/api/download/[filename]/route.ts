import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || !filename.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Get the file path
    const filePath = path.join(process.cwd(), '../..', filename);

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Create response with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
} 