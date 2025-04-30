import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 5 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const searchResponse = await fetch('http://localhost:3000/api/mcp/firecrawl/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit,
      }),
    });

    if (!searchResponse.ok) {
      throw new Error('Failed to fetch search results');
    }

    const searchResults = await searchResponse.json();

    // Get detailed content for each result
    const detailedResults = await Promise.all(
      searchResults.map(async (result: any) => {
        try {
          const scrapeResponse = await fetch('http://localhost:3000/api/mcp/firecrawl/scrape', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: result.url,
              formats: ['markdown'],
              onlyMainContent: true,
            }),
          });

          if (!scrapeResponse.ok) {
            return {
              ...result,
              content: null,
            };
          }

          const scrapeData = await scrapeResponse.json();
          return {
            ...result,
            content: scrapeData.markdown || scrapeData.content,
          };
        } catch (error) {
          console.error(`Error scraping ${result.url}:`, error);
          return {
            ...result,
            content: null,
          };
        }
      })
    );

    return NextResponse.json(detailedResults);
  } catch (error) {
    console.error('Error in firecrawl route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
} 