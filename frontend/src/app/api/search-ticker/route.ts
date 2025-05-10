import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter.' }, { status: 400 });
  }
  try {
    const results = await yahooFinance.search(query);
    // Return only the most relevant fields for autocomplete
    const matches = (results.quotes || []).map((item: any) => ({
      symbol: item.symbol,
      shortname: item.shortname,
      exchDisp: item.exchDisp,
      typeDisp: item.typeDisp,
    }));
    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Ticker search error:', error);
    return NextResponse.json({ error: 'Failed to search for ticker.' }, { status: 500 });
  }
} 