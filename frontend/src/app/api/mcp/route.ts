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

1. Start with an "Executive Summary" section highlighting key points
2. Include a "Market Impact" section discussing potential market implications
3. Break down complex information into clear, labeled sections
4. Use bullet points for key findings and metrics
5. Include a "Risk Factors" section when relevant
6. End with "Sources & Citations" listing key references
7. Format numbers and statistics professionally
8. Use markdown formatting for better readability
9. Include relevant dates and timestamps
10. Highlight any time-sensitive information

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

      // Transform Perplexity results to match expected format
      const results = [{
        title: `Investment Analysis: ${query}`,
        desc: searchData.choices[0]?.message?.content || '',
        url: searchData.citations?.[0] || '',
        noteUrl: searchData.citations?.[0] || '',
        content: searchData.choices[0]?.message?.content || '',
        postedAt: new Date().toISOString(),
        authorName: '21.dev Research',
        likes: 0,
        views: 0,
        images: [],
        citations: searchData.citations || [],
        metadata: {
          analysisType: 'Investment Research',
          confidence: 'High',
          lastUpdated: new Date().toISOString(),
          dataProvider: 'Perplexity AI',
          researchCategory: 'Market Analysis'
        }
      }];

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