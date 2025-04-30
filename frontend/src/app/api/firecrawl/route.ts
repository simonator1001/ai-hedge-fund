import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 5 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // First, try to get news using RAG Web Browser
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3001';  // Using 3001 since 3000 is taken

    const searchResponse = await fetch(`${baseUrl}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'apify/rag-web-browser',
        input: {
          query: query,
          maxResults: limit,
          outputFormats: ['markdown'],
          removeCookieWarnings: true,
          htmlTransformer: 'readable'
        }
      }),
    });

    if (!searchResponse.ok) {
      console.error('Search response error:', await searchResponse.text());
      throw new Error(`Failed to fetch search results: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchResults = await searchResponse.json();
    
    // Transform the results to match our NewsItem interface
    const formattedResults = searchResults.map((result: any) => ({
      title: result.title || 'Untitled',
      description: result.snippet || result.description || '',
      url: result.url,
      content: result.markdown || result.content,
      publishedAt: new Date().toISOString() // Since RAG Web Browser doesn't provide dates
    }));

    return NextResponse.json(formattedResults);

    /* Commented out for testing
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
    */
  } catch (error) {
    console.error('Error in firecrawl route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch news' },
      { status: 500 }
    );
  }
} 