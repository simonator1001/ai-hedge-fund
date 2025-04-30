import { NextRequest, NextResponse } from 'next/server';

interface PerplexityResult {
  title: string;
  url: string;
  snippet?: string;
  text?: string;
  published_date?: string;
  source?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { tool, input } = await req.json();

    if (!tool) {
      return NextResponse.json({ error: 'Tool name is required' }, { status: 400 });
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Handle different tools
    if (tool === 'easyapi~all-in-one-rednote-xiaohongshu-scraper') {
      const { searchKeywords } = input;
      if (!searchKeywords || !Array.isArray(searchKeywords) || searchKeywords.length === 0) {
        return NextResponse.json({ error: 'Search keywords are required' }, { status: 400 });
      }

      const query = searchKeywords[0]; // Use the first keyword
      const response = await fetch('https://api.perplexity.ai/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          max_results: input.maxPostsPerKeyword || 10,
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
        throw new Error(`Failed to call Perplexity API: ${response.statusText}`);
      }

      const searchData = await response.json();
      
      if (!searchData.results || !Array.isArray(searchData.results)) {
        return NextResponse.json([]);
      }

      // Transform Perplexity results to match expected format
      const results = searchData.results.map((result: PerplexityResult) => ({
        title: result.title,
        desc: result.snippet || result.text,
        url: result.url,
        noteUrl: result.url,
        content: result.text,
        postedAt: result.published_date || new Date().toISOString(),
        authorName: result.source || new URL(result.url).hostname,
        likes: 0,
        views: 0,
        images: []
      }));

      return NextResponse.json(results);
    }

    // Handle other tools or return error for unsupported tools
    return NextResponse.json(
      { error: 'Unsupported tool' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in MCP route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
} 