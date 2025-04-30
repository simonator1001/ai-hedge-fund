import { NextRequest, NextResponse } from 'next/server';

interface PerplexityResult {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  citations?: string[];
}

interface NewsArticle {
  id: string;
  category: string;
  headline: string;
  summary: string;
  content: string;
  publishedAt: string;
  author: {
    name: string;
    avatar?: string;
  };
  metadata: {
    readTime: string;
    analysisType: string;
    confidence: string;
    dataProvider: string;
    researchCategory: string;
  };
  stats: {
    views: number;
    likes: number;
    shares: number;
  };
  relatedLinks: Array<{
    title: string;
    url: string;
  }>;
  sources: string[];
  tags: string[];
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
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content: `You are an AI investment research analyst. Analyze the provided information and present it in a professional, structured format suitable for investors and financial professionals. Follow these guidelines:

1. Start with a clear, concise headline
2. Provide a brief executive summary (2-3 sentences)
3. Break down the analysis into these sections:
   - Key Highlights (bullet points)
   - Market Impact
   - Industry Analysis
   - Risk Factors
   - Future Outlook
4. Use professional financial terminology
5. Include specific dates, numbers, and metrics
6. Cite sources and provide context
7. Tag relevant sectors and themes

Current analysis date: ${new Date().toISOString().split('T')[0]}`
            },
            {
              role: "user",
              content: query
            }
          ],
          max_tokens: 2048,
          temperature: 0.7,
          web_search_options: {
            search_context_size: "high"
          }
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

      const searchData: PerplexityResult = await response.json();
      
      if (!searchData.choices || !Array.isArray(searchData.choices)) {
        return NextResponse.json([]);
      }

      const content = searchData.choices[0]?.message?.content || '';
      const currentDate = new Date();

      // Transform Perplexity results to match news app format
      const article: NewsArticle = {
        id: `article-${Date.now()}`,
        category: 'Investment Research',
        headline: `Investment Analysis: ${query}`,
        summary: content.split('\n')[0] || '', // First line as summary
        content: content,
        publishedAt: currentDate.toISOString(),
        author: {
          name: '21.dev Research',
          avatar: '/images/research-avatar.png'
        },
        metadata: {
          readTime: `${Math.ceil(content.split(' ').length / 200)} min read`,
          analysisType: 'Investment Research',
          confidence: 'High',
          dataProvider: 'Perplexity AI',
          researchCategory: 'Market Analysis'
        },
        stats: {
          views: 0,
          likes: 0,
          shares: 0
        },
        relatedLinks: searchData.citations?.map(citation => ({
          title: new URL(citation).hostname,
          url: citation
        })) || [],
        sources: searchData.citations || [],
        tags: ['Investment', 'Market Analysis', query]
      };

      return NextResponse.json([article]);
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