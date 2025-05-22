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

    // List of valid US stock tickers (expand as needed)
    const validTickers = new Set([
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC', 'PYPL', 'SQ', 'PLTR', 'MSTR', 'COIN',
      'BRK', 'JPM', 'V', 'UNH', 'HD', 'DIS', 'BAC', 'VZ', 'ADBE', 'CRM', 'CSCO', 'PEP', 'T', 'WMT', 'XOM', 'CVX', 'PFE', 'ABT', 'TMO', 'MRK', 'LLY', 'NKE', 'ORCL', 'QCOM', 'TXN', 'COST', 'AVGO', 'HON', 'IBM', 'SBUX', 'GS', 'BLK', 'AXP', 'BA', 'MMM', 'GE', 'CAT', 'F', 'GM', 'FDX', 'UPS', 'LMT', 'RTX', 'MO', 'PM', 'KO', 'MCD', 'WBA', 'JNJ', 'PG', 'UNP', 'AMGN', 'MDT', 'CVS', 'GILD', 'ISRG', 'ZTS', 'VRTX', 'REGN', 'BIIB', 'BMY', 'CI', 'ANTM', 'CNC', 'HUM', 'ELV', 'DHR', 'SYK', 'BDX', 'EW', 'BSX', 'ABMD', 'ALGN', 'ILMN', 'IDXX', 'MTD', 'STE', 'RMD', 'TFX', 'A', 'BIO', 'PKI', 'TECH', 'WAT', 'BRKR', 'CRL', 'LH', 'DGX', 'NEOG', 'QDEL', 'TMO', 'WST', 'ZBH', 'COO', 'XRAY', 'ALC', 'BAX', 'BCR', 'CERN', 'DVA', 'HCA', 'UHS', 'UNH', 'VTRS', 'WBA', 'ZTS'
    ]);

    // Extract stock tickers from real news articles
    const stockRegex = /\b[A-Z]{1,5}\b/g;
    const tickerCounts: Record<string, { count: number, newsRefs: string[] }> = {};
    news.forEach((item: any) => {
      const content = `${item.title} ${item.description} ${item.content || ''}`;
      const matches = content.match(stockRegex) || [];
      matches.forEach(match => {
        // Only count if in valid tickers
        if (validTickers.has(match)) {
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

    // Helper: basic sentiment analysis
    function getSentiment(text: string) {
      const positiveWords = ["gain", "growth", "positive", "up", "increase", "profit", "strong", "bull", "record", "surge", "beat", "outperform", "success", "good", "win", "rise", "improve", "expand", "optimistic", "benefit", "support", "favorable", "advantage", "leadership", "innovate", "opportunity"];
      const negativeWords = ["loss", "decline", "negative", "down", "decrease", "drop", "weak", "bear", "miss", "underperform", "fail", "bad", "fall", "reduce", "cut", "concern", "risk", "challenge", "problem", "lawsuit", "regulation", "penalty", "fine", "investigation", "scandal", "fraud", "bankrupt", "layoff", "close", "shut", "recession", "crisis", "volatile", "uncertain", "threat", "warning", "bearish"];
      const textLower = text.toLowerCase();
      let score = 0;
      positiveWords.forEach(word => { if (textLower.includes(word)) score++; });
      negativeWords.forEach(word => { if (textLower.includes(word)) score--; });
      if (score > 0) return "positive";
      if (score < 0) return "negative";
      return "neutral";
    }

    // Build opportunities with references and rationale
    const opportunities = sortedTickers.map(([ticker, data]) => {
      // Find all news articles that mention this ticker
      const relatedArticles = news.filter((item: any) => {
        const content = `${item.title} ${item.description} ${item.content || ''}`;
        const matches = (content.match(stockRegex) || []) as string[];
        return matches.includes(ticker);
      });
      // Build references and rationale
      const references = relatedArticles.map((item: any) => {
        const snippet = item.description || item.content || '';
        const sentiment = getSentiment(snippet);
        return {
          title: item.title,
          url: item.url,
          snippet,
          sentiment
        };
      });
      // Compose rationale
      let rationale = "";
      if (references.length > 0) {
        rationale = references.map(ref =>
          `${ticker} is mentioned in \"${ref.title}\" (${ref.url}) because: ${ref.snippet} [Sentiment: ${ref.sentiment}]`
        ).join("\n\n");
      } else {
        rationale = `${ticker} is a major stock in the market and is included for context.`;
      }
      const reasons = [
        `${ticker} is frequently mentioned in recent news about ${keywords}.`,
        `Recent developments may impact ${ticker}'s business model.`,
        `${ticker} is relevant to the topic: ${keywords}.`,
        rationale
      ];
      return {
        ticker,
        confidence: Math.floor(Math.random() * 30) + 70, // 70-99 confidence
        reasons: reasons.slice(0, 2 + Math.floor(Math.random() * 2)), // 2-3 reasons
        newsReferences: references,
        rationale,
      };
    });

    // Enrich each news item with sentiment and relevant stocks
    const enrichedNews = news.map((item: any) => {
      // Assign relevant stocks if mentioned in the article
      const content = `${item.title} ${item.description} ${item.content || ''}`;
      const matches = content.match(stockRegex) || [];
      const relevantStocks = matches.filter(match => tickerCounts[match] && validTickers.has(match));
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