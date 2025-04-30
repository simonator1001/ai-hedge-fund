import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, num = 5 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Add news-specific terms to the query
    const newsQuery = `${query} news articles`;

    // Call the MCP Google Search tool
    const response = await fetch('/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'google-search',
        input: {
          query: newsQuery,
          num: num
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Search error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error('Failed to fetch search results');
    }

    const results = await response.json();
    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in google-search route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search' },
      { status: 500 }
    );
  }
} 