import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, num = 5 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Use Google Custom Search API
    const apiKey = process.env.GOOGLE_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    if (!apiKey || !cseId) {
      return NextResponse.json({ error: 'Google API key or CSE ID not configured' }, { status: 500 });
    }

    const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cseId}&key=${apiKey}&num=${num}`;
    const googleResponse = await fetch(searchUrl);
    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error('Google API error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch news from Google' }, { status: 500 });
    }
    const googleData = await googleResponse.json();
    // Parse items to news format
    const articles = (googleData.items || []).map((item: any) => ({
      id: item.cacheId || item.link,
      title: item.title,
      description: item.snippet,
      url: item.link,
      content: item.snippet,
      publishedAt: item.pagemap?.metatags?.[0]?.['article:published_time'] || '',
    }));
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error in google-search route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search' },
      { status: 500 }
    );
  }
}

function generateMockNews(query: string, count: number) {
  const currentDate = new Date();
  const articles = [];
  
  // Generate some random dates within the last month
  const getRandomDate = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    return date.toISOString();
  };
  
  const topics = [
    'Market Analysis', 
    'Investment Trends', 
    'Stocks to Watch', 
    'Economic Outlook',
    'Financial News',
    'Sector Analysis',
    'Market Movers'
  ];
  
  const relatedStocks = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA',
    'AMD', 'INTC', 'PLTR', 'MSTR', 'COIN', 'SQ', 'PYPL'
  ];
  
  // Create mock articles
  for (let i = 0; i < count; i++) {
    const publishedDate = getRandomDate();
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    // Get 1-3 random stocks that might be relevant
    const stockCount = Math.floor(Math.random() * 3) + 1;
    const relevantStocks: string[] = [];
    for (let j = 0; j < stockCount; j++) {
      const stock = relatedStocks[Math.floor(Math.random() * relatedStocks.length)];
      if (!relevantStocks.includes(stock)) {
        relevantStocks.push(stock);
      }
    }
    
    articles.push({
      id: `article-${Date.now()}-${i}`,
      title: `${topic}: ${query} - Impact on Markets and Investments`,
      description: `Analysis of ${query} and its implications for investors. This article examines recent developments and potential future impacts.`,
      url: `https://example.com/news/${query.replace(/\s+/g, '-').toLowerCase()}`,
      content: `
## ${topic}: ${query}

Recent developments regarding ${query} have significant implications for investors and markets. 
Our analysis suggests several key factors to watch:

1. Market sentiment is shifting rapidly
2. Institutional investors are taking notice
3. Regulatory frameworks may evolve in response
4. Long-term impacts remain uncertain

### Key Stocks to Watch

${relevantStocks.join(', ')} may be particularly affected by these developments.

### Market Outlook

Volatility is expected in the short term, while long-term trends point to stabilization.
Investors should monitor developments closely and adjust portfolios accordingly.
      `,
      publishedAt: publishedDate,
      sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
      relevantStocks: relevantStocks
    });
  }
  
  return articles;
} 