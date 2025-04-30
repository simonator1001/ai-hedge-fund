import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { news, startDate, endDate, keywords } = await req.json();

    if (!news || !Array.isArray(news)) {
      return NextResponse.json(
        { error: 'Invalid news data format' },
        { status: 400 }
      );
    }

    // Analyze news content using OpenAI
    const analysisPrompt = `
      Analyze the following news articles about ${keywords} from ${startDate} to ${endDate}.
      For each article, determine:
      1. The sentiment (positive, negative, or neutral)
      2. Any mentioned stock tickers
      3. Potential investment opportunities based on the news

      Articles:
      ${news.map((item: any, index: number) => `
        Article ${index + 1}:
        Title: ${item.title}
        Description: ${item.description}
        Content: ${item.content || 'No detailed content available'}
      `).join('\n\n')}

      Provide a structured response in the following format:
      {
        "news": [
          {
            "title": "article title",
            "sentiment": "positive/negative/neutral",
            "relevantStocks": ["TICKER1", "TICKER2"]
          }
        ],
        "opportunities": [
          {
            "ticker": "TICKER",
            "confidence": 85,
            "reasons": ["reason 1", "reason 2"],
            "newsReferences": ["article title 1", "article title 2"]
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst specializing in analyzing news articles for investment opportunities. Provide analysis in the exact JSON format requested."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    // Merge the analysis results with the original news data
    const enrichedNews = news.map((item: any) => {
      const analysis_item = analysis.news.find((a: any) => a.title === item.title);
      return {
        ...item,
        sentiment: analysis_item?.sentiment || 'neutral',
        relevantStocks: analysis_item?.relevantStocks || []
      };
    });

    return NextResponse.json({
      news: enrichedNews,
      opportunities: analysis.opportunities || []
    });
  } catch (error) {
    console.error('Error in analyze-news:', error);
    return NextResponse.json(
      { error: 'Failed to analyze news' },
      { status: 500 }
    );
  }
} 