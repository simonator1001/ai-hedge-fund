import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { query, num = 10 } = await req.json();
    console.log('Google search query:', query);

    // Use the mcp_google_search_search tool
    const response = await fetch('http://localhost:3000/api/mcp/google-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        num
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MCP Google Search error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch search results: ${response.status} ${response.statusText}`);
    }

    const results = await response.json();
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in Google search:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search Google' },
      { status: 500 }
    );
  }
} 