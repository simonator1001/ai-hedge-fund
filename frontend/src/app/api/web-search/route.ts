import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { query } = await req.json();
    console.log('Web search query:', query);

    // Check if APIFY_API_KEY is set
    if (!process.env.APIFY_API_KEY) {
      console.error('APIFY_API_KEY is not set');
      throw new Error('APIFY_API_KEY is not configured');
    }

    const apiUrl = 'https://api.apify.com/v2/acts/apify~rag-web-browser/run-sync-get-dataset-items';
    console.log('Calling Apify API:', apiUrl);

    const response = await fetch(apiUrl, {
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
      const errorText = await response.text();
      console.error('Apify API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch search results: ${response.status} ${response.statusText}`);
    }

    const results = await response.json();
    console.log('Apify results count:', results.length);

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
    console.error('Error in web search:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search web' },
      { status: 500 }
    );
  }
} 