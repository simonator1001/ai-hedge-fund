import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  console.log('Web search query:', query);

  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not configured');
    }

    const response = await fetch('https://api.perplexity.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        max_results: 10,
        highlight: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch search results: ${response.status} ${response.statusText}`);
    }

    const searchData = await response.json();
    console.log('Search results:', searchData);

    if (!searchData.results || !Array.isArray(searchData.results)) {
      console.warn('No search results found or invalid response format');
      return NextResponse.json({ articles: [] });
    }

    const articles = searchData.results.map((result: any) => ({
      title: result.title,
      link: result.url,
      snippet: result.snippet || result.text,
      source: result.source || new URL(result.url).hostname,
      date: result.published_date || null
    }));

    return NextResponse.json({ articles });

  } catch (error) {
    console.error('Error in web search:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search web' },
      { status: 500 }
    );
  }
} 