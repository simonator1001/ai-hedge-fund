import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { query } = await req.json();

    // Use the RAG Web Browser to search and scrape news
    const response = await fetch('https://api.apify.com/v2/acts/apify~rag-web-browser/run-sync-get-dataset-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.APIFY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        maxResults: 10,
        outputFormats: ['markdown'],
        htmlTransformer: 'readable',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }

    const results = await response.json();

    // Transform the results into a more usable format
    const articles = results.map((result: any) => ({
      title: result.title || '',
      description: result.snippet || '',
      url: result.url || '',
      publishedAt: result.publishedAt || new Date().toISOString(),
      content: result.markdown || '',
    }));

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error searching web:', error);
    return NextResponse.json(
      { error: 'Failed to search web' },
      { status: 500 }
    );
  }
} 