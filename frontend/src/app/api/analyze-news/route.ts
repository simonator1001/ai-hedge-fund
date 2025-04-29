import { NextRequest, NextResponse } from 'next/server';
import { callDeepSeek } from '@/utils/deepseek';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { startDate, endDate, keywords } = await req.json();
    console.log('Analyzing news for:', { startDate, endDate, keywords });

    // Fetch news using web search
    const searchQuery = `${keywords} stock market news from ${startDate} to ${endDate}`;
    console.log('Search query:', searchQuery);

    const newsResponse = await fetch(new URL('/api/web-search', req.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: searchQuery }),
    });

    if (!newsResponse.ok) {
      const errorText = await newsResponse.text();
      console.error('Web search error:', {
        status: newsResponse.status,
        statusText: newsResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to fetch news: ${newsResponse.status} ${newsResponse.statusText}`);
    }

    const newsData = await newsResponse.json();
    console.log('News articles found:', newsData.length);

    if (newsData.error) {
      throw new Error(`Web search failed: ${newsData.error}`);
    }

    // Analyze news with DeepSeek
    const analysisPrompt = `
      Analyze the following news articles and identify potential investment opportunities:
      ${JSON.stringify(newsData, null, 2)}

      Please provide:
      1. A list of relevant stock tickers mentioned
      2. Sentiment analysis for each article
      3. Investment opportunities with confidence scores
      4. Reasoning for each opportunity

      Format the response as JSON with the following structure:
      {
        "news": [
          {
            "title": "Article title",
            "description": "Article description",
            "url": "Article URL",
            "publishedAt": "Publication date",
            "sentiment": "positive/negative/neutral",
            "relevantStocks": ["TICKER1", "TICKER2"]
          }
        ],
        "opportunities": [
          {
            "ticker": "TICKER",
            "confidence": 85,
            "reasons": ["Reason 1", "Reason 2"],
            "newsReferences": ["Article title 1", "Article title 2"]
          }
        ]
      }
    `;

    console.log('Calling DeepSeek for analysis...');
    const analysisResult = await callDeepSeek([
      {
        role: "system",
        content: "You are a financial analyst expert. Analyze news articles and identify investment opportunities. Be thorough but concise in your analysis."
      },
      {
        role: "user",
        content: analysisPrompt
      }
    ]);

    console.log('Parsing DeepSeek response...');
    const analysis = JSON.parse(analysisResult);
    console.log('Analysis complete:', {
      newsCount: analysis.news?.length || 0,
      opportunitiesCount: analysis.opportunities?.length || 0
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing news:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze news',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 