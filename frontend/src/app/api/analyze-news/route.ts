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

    // Always use mock analysis since we don't have a valid OpenAI API key
    console.log('Using mock analysis for news');
    
    // Generate more relevant mock data based on the actual news
    const mockAnalysis = generateMockAnalysis(news, keywords);
    return NextResponse.json(mockAnalysis);
  } catch (error) {
    console.error('Error in analyze-news:', error);
    return NextResponse.json(
      { error: 'Failed to analyze news' },
      { status: 500 }
    );
  }
}

function generateMockAnalysis(news: any[], keywords: string) {
  // Extract any stock tickers mentioned in the news
  const stockRegex = /\b[A-Z]{1,5}\b/g;
  const mentionedStocks = new Set<string>();
  
  news.forEach((item: any) => {
    const content = `${item.title} ${item.description} ${item.content || ''}`;
    const matches = content.match(stockRegex) || [];
    matches.forEach(match => {
      // Filter out common acronyms that aren't stocks
      if (!['CEO', 'CFO', 'CTO', 'IPO', 'GDP', 'USA', 'UK', 'EU', 'AI'].includes(match)) {
        mentionedStocks.add(match);
      }
    });
  });
  
  // If no stocks found, use some common ones
  if (mentionedStocks.size === 0) {
    ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'].forEach(s => mentionedStocks.add(s));
  }
  
  const stocksArray = Array.from(mentionedStocks);
  
  // Enrich each news item with sentiment and relevant stocks
  const enrichedNews = news.map((item: any) => {
    // Randomly assign 1-3 stocks to each news article
    const stockCount = Math.floor(Math.random() * 3) + 1;
    const relevantStocks: string[] = [];
    for (let i = 0; i < stockCount; i++) {
      if (stocksArray.length > 0) {
        const randomIndex = Math.floor(Math.random() * stocksArray.length);
        const stock = stocksArray[randomIndex];
        if (!relevantStocks.includes(stock)) {
          relevantStocks.push(stock);
        }
      }
    }
    
    return {
      ...item,
      sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
      relevantStocks
    };
  });
  
  // Generate mock investment opportunities
  const opportunities = stocksArray.slice(0, 3).map(ticker => {
    // Find news mentioning this ticker
    const relevantNews = enrichedNews.filter(item => 
      item.relevantStocks && item.relevantStocks.includes(ticker)
    );
    
    const reasons = [
      `${ticker} shows strong positioning in ${keywords} market`,
      `Recent ${keywords} developments favor ${ticker}'s business model`,
      `${ticker} has competitive advantage in this sector`,
      `Market trends align with ${ticker}'s strategy`
    ];
    
    return {
      ticker,
      confidence: Math.floor(Math.random() * 30) + 70, // 70-99 confidence
      reasons: reasons.slice(0, 2 + Math.floor(Math.random() * 2)), // 2-3 reasons
      newsReferences: relevantNews.map(n => n.title).slice(0, 2) // Reference up to 2 news items
    };
  });
  
  return {
    news: enrichedNews,
    opportunities
  };
} 