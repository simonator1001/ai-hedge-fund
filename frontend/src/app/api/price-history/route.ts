import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!ticker || !start || !end) {
    return NextResponse.json({ error: 'Missing required query parameters.' }, { status: 400 });
  }

  try {
    // TODO: Replace with actual backend API endpoint
    // Ensure backendUrl uses port 8000 (FastAPI), not 3001
    const backendUrl = `http://localhost:8000/api/price-history?ticker=${encodeURIComponent(ticker)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    const res = await fetch(backendUrl);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch price data from backend.' }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
} 