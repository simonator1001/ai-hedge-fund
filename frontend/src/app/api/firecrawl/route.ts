import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 5 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Get the base URL from the request
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.get('host') || 'localhost:3001';
    const baseUrl = `${protocol}://${host}`;

    // Call the MCP endpoint with Xiaohongshu scraper
    const searchResponse = await fetch(`${baseUrl}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tool: 'easyapi~all-in-one-rednote-xiaohongshu-scraper',
        input: {
          searchKeywords: [query],
          maxPostsPerKeyword: limit,
          scrapeComments: false,
          proxyConfiguration: {
            useApifyProxy: true
          }
        }
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Search response error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch search results: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchResults = await searchResponse.json();
    
    // Transform the Xiaohongshu results to match our NewsItem interface
    const formattedResults = Array.isArray(searchResults) ? searchResults.map((result: any) => ({
      title: result.title || result.desc || 'Untitled',
      description: result.desc || '',
      url: result.url || result.noteUrl,
      content: result.content || result.desc,
      publishedAt: result.postedAt || new Date().toISOString(),
      // Additional Xiaohongshu specific fields
      author: result.authorName,
      likes: result.likes,
      views: result.views,
      images: result.images
    })) : [];

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