import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!ticker || !start || !end) {
    return NextResponse.json({ error: 'Missing required query parameters.' }, { status: 400 });
  }

  try {
    // Yahoo Finance expects dates as YYYY-MM-DD
    const result = await yahooFinance.chart(ticker, {
      period1: start,
      period2: end,
      interval: '1d',
    });
    // The chart API returns a different structure
    const prices = (result?.quotes || []).map((row: any) => ({
      open: row.open,
      close: row.close,
      high: row.high,
      low: row.low,
      volume: row.volume,
      time: row.date ? new Date(row.date).toISOString().slice(0, 10) : '',
    }));
    return NextResponse.json({ prices });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch price data from Yahoo Finance.' }, { status: 500 });
  }
} 