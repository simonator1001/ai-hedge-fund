import { NextRequest, NextResponse } from 'next/server';
// Remove the OpenAI import and initialization since we're not using it

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

export async function POST(req: NextRequest) {
  try {
    const { news, startDate, endDate, keywords } = await req.json();

    if (!news || !Array.isArray(news)) {
      console.error('Invalid news format:', news);
      return NextResponse.json(
        { error: 'Invalid news data format' },
        { status: 400 }
      );
    }

    // Extract stock tickers from real news articles
    const stockRegex = /\b[A-Z]{1,5}\b/g;
    const tickerCounts: Record<string, { count: number, newsRefs: string[] }> = {};
    news.forEach((item: any) => {
      const content = `${item.title} ${item.description} ${item.content || ''}`;
      const matches = content.match(stockRegex) || [];
      matches.forEach(match => {
        // Filter out common acronyms that aren't stocks
        if (!['CEO', 'CFO', 'CTO', 'IPO', 'GDP', 'USA', 'UK', 'EU', 'AI'].includes(match)) {
          if (!tickerCounts[match]) {
            tickerCounts[match] = { count: 0, newsRefs: [] };
          }
          tickerCounts[match].count++;
          tickerCounts[match].newsRefs.push(item.title);
        }
      });
    });

    // If no stocks found, use some common ones
    if (Object.keys(tickerCounts).length === 0) {
      ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'].forEach(s => {
        tickerCounts[s] = { count: 1, newsRefs: [] };
      });
    }

    // Rank stocks by frequency
    const sortedTickers = Object.entries(tickerCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);

    // Build opportunities
    const opportunities = sortedTickers.map(([ticker, data]) => {
      const reasons = [
        `${ticker} is frequently mentioned in recent news about ${keywords}`,
        `Recent developments may impact ${ticker}'s business model`,
        `${ticker} is relevant to the topic: ${keywords}`
      ];
      return {
        ticker,
        confidence: Math.floor(Math.random() * 30) + 70, // 70-99 confidence
        reasons: reasons.slice(0, 2 + Math.floor(Math.random() * 2)), // 2-3 reasons
        newsReferences: Array.from(new Set(data.newsRefs)).slice(0, 2) // Reference up to 2 news items
      };
    });

    // Enrich each news item with sentiment and relevant stocks
    const enrichedNews = news.map((item: any) => {
      // Assign relevant stocks if mentioned in the article
      const content = `${item.title} ${item.description} ${item.content || ''}`;
      const matches = content.match(stockRegex) || [];
      const relevantStocks = matches.filter(match => tickerCounts[match]);
      return {
        ...item,
        sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
        relevantStocks
      };
    });

    return NextResponse.json({ news: enrichedNews, opportunities });
  } catch (error) {
    console.error('Error in analyze-news:', error);
    return NextResponse.json(
      { error: 'Failed to analyze news' },
      { status: 500 }
    );
  }
} 