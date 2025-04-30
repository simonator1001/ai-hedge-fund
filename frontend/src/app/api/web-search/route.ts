import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { query } = await req.json();
    console.log('Web search query:', query);

    // Call mcp_google_search_search directly
    const searchResponse = await fetch('https://api.cursor.sh/api/v1/tools/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CURSOR_API_KEY}`
      },
      body: JSON.stringify({
        tool: 'mcp_google_search_search',
        args: {
          query: query,
          num: 10
        }
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Google Search API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch search results: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search results:', searchData);

    if (!searchData.items || !Array.isArray(searchData.items)) {
      console.warn('No search results found or invalid response format');
      return NextResponse.json([]);
    }

    // Transform the results into a more usable format
    const articles = searchData.items.map((result: any) => ({
      title: result.title || '',
      description: result.snippet || '',
      url: result.link || '',
      publishedAt: new Date().toISOString(), // Google doesn't provide publish dates
      content: result.snippet || '',
    }));

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error in web search:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search web' },
      { status: 500 }
    );
  }
} 