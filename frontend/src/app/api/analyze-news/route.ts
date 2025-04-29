import { NextRequest, NextResponse } from 'next/server';
import { callDeepSeek } from '@/utils/deepseek';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { startDate, endDate, keywords } = await req.json();

    // Fetch news using web search
    const searchQuery = `${keywords} stock market news from ${startDate} to ${endDate}`;
    const newsResponse = await fetch('http://localhost:3000/api/web-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: searchQuery }),
    });

    if (!newsResponse.ok) {
      throw new Error('Failed to fetch news');
    }

    const newsData = await newsResponse.json();

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

    const analysis = JSON.parse(analysisResult);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing news:', error);
    return NextResponse.json(
      { error: 'Failed to analyze news' },
      { status: 500 }
    );
  }
} 