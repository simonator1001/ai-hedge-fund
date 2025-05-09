import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(req: NextRequest, { params }: { params: { file: string } }) {
  // The simulation output files are saved in the project root or frontend dir
  const fileName = params.file;
  // Try both locations for compatibility
  const possiblePaths = [
    path.join(process.cwd(), fileName),
    path.join(process.cwd(), '../', fileName),
  ];
  let filePath = null;
  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      filePath = p;
      break;
    } catch {}
  }
  if (!filePath) {
    return new Response('File not found', { status: 404 });
  }
  const fileBuffer = await fs.readFile(filePath);
  return new Response(fileBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
} 