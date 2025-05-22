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

    // List of valid US stock tickers and their company names
    const stocksMap: Record<string, {name: string, industry: string}> = {
      'AAPL': {name: 'Apple', industry: 'Technology'},
      'MSFT': {name: 'Microsoft', industry: 'Technology'},
      'GOOGL': {name: 'Google', industry: 'Technology'},
      'AMZN': {name: 'Amazon', industry: 'Retail/Technology'},
      'TSLA': {name: 'Tesla', industry: 'Automotive/Energy'},
      'NVDA': {name: 'NVIDIA', industry: 'Technology'},
      'META': {name: 'Meta', industry: 'Technology'},
      'NFLX': {name: 'Netflix', industry: 'Entertainment'},
      'JPM': {name: 'JPMorgan', industry: 'Finance'},
      'BAC': {name: 'Bank of America', industry: 'Finance'},
      'WMT': {name: 'Walmart', industry: 'Retail'},
      'JNJ': {name: 'Johnson & Johnson', industry: 'Healthcare'},
      'PG': {name: 'Procter & Gamble', industry: 'Consumer Goods'},
      'V': {name: 'Visa', industry: 'Finance'},
      'MA': {name: 'Mastercard', industry: 'Finance'},
      'DIS': {name: 'Disney', industry: 'Entertainment'},
      'COIN': {name: 'Coinbase', industry: 'Cryptocurrency'},
      'GS': {name: 'Goldman Sachs', industry: 'Finance'},
      'T': {name: 'AT&T', industry: 'Telecommunications'},
      'VZ': {name: 'Verizon', industry: 'Telecommunications'},
      'SBUX': {name: 'Starbucks', industry: 'Retail'},
      'NKE': {name: 'Nike', industry: 'Retail'},
      'ADBE': {name: 'Adobe', industry: 'Technology'},
      'AMD': {name: 'AMD', industry: 'Technology'},
      'INTC': {name: 'Intel', industry: 'Technology'},
      'IBM': {name: 'IBM', industry: 'Technology'},
      'CRM': {name: 'Salesforce', industry: 'Technology'},
      'PYPL': {name: 'PayPal', industry: 'Finance/Technology'},
      'SQ': {name: 'Block', industry: 'Finance/Technology'},
      'HD': {name: 'Home Depot', industry: 'Retail'},
      'MCD': {name: 'McDonald\'s', industry: 'Restaurants'},
      'COST': {name: 'Costco', industry: 'Retail'},
      'TGT': {name: 'Target', industry: 'Retail'},
      'F': {name: 'Ford', industry: 'Automotive'},
      'GM': {name: 'General Motors', industry: 'Automotive'},
      'MRNA': {name: 'Moderna', industry: 'Healthcare'},
      'PFE': {name: 'Pfizer', industry: 'Healthcare'},
      'CVX': {name: 'Chevron', industry: 'Energy'},
      'XOM': {name: 'Exxon Mobil', industry: 'Energy'},
      'UNH': {name: 'UnitedHealth', industry: 'Healthcare'},
      'BMY': {name: 'Bristol Myers Squibb', industry: 'Healthcare'},
      'ABT': {name: 'Abbott Laboratories', industry: 'Healthcare'},
      'MRK': {name: 'Merck', industry: 'Healthcare'},
      'LMT': {name: 'Lockheed Martin', industry: 'Aerospace/Defense'},
      'BA': {name: 'Boeing', industry: 'Aerospace/Defense'},
      'RTX': {name: 'Raytheon', industry: 'Aerospace/Defense'},
      'CAT': {name: 'Caterpillar', industry: 'Construction'},
      'DE': {name: 'John Deere', industry: 'Agriculture'},
      'UAL': {name: 'United Airlines', industry: 'Airlines'},
      'DAL': {name: 'Delta Airlines', industry: 'Airlines'},
      'LUV': {name: 'Southwest Airlines', industry: 'Airlines'},
      'AAL': {name: 'American Airlines', industry: 'Airlines'},
      'UBER': {name: 'Uber', industry: 'Transportation'},
      'LYFT': {name: 'Lyft', industry: 'Transportation'},
      'PLTR': {name: 'Palantir', industry: 'Technology'},
      'ZM': {name: 'Zoom', industry: 'Technology'},
      'ORCL': {name: 'Oracle', industry: 'Technology'},
      'CSCO': {name: 'Cisco', industry: 'Technology'},
      'MU': {name: 'Micron', industry: 'Technology'},
      'MSTR': {name: 'MicroStrategy', industry: 'Technology/Cryptocurrency'},
    };
    
    const validTickers = new Set(Object.keys(stocksMap));
    
    // Find relevant industries based on keywords
    const industryKeywords: Record<string, string[]> = {
      'Technology': ['tech', 'software', 'hardware', 'ai', 'artificial intelligence', 'app', 'digital', 'cloud', 'computing', 'semiconductor', 'chip', 'internet', 'online', 'data', 'cyber', 'mobile', 'smartphone'],
      'Finance': ['bank', 'finance', 'financial', 'invest', 'stock', 'market', 'trading', 'loan', 'credit', 'payment', 'money', 'economic', 'economy', 'fed', 'interest rate', 'inflation'],
      'Retail': ['retail', 'store', 'shop', 'ecommerce', 'e-commerce', 'consumer', 'shopping', 'merchandise', 'product', 'price', 'customer'],
      'Healthcare': ['health', 'medical', 'medicine', 'drug', 'pharma', 'vaccine', 'patient', 'hospital', 'doctor', 'clinic', 'therapy', 'treatment'],
      'Energy': ['energy', 'oil', 'gas', 'power', 'electricity', 'fuel', 'renewable', 'solar', 'wind', 'battery', 'electric'],
      'Automotive': ['car', 'auto', 'vehicle', 'motor', 'drive', 'ev', 'electric vehicle', 'autonomous', 'self-driving'],
      'Entertainment': ['media', 'movie', 'film', 'tv', 'television', 'stream', 'video', 'game', 'gaming', 'entertainment', 'music', 'show'],
      'Telecommunications': ['telecom', 'phone', 'cellular', '5g', 'network', 'wireless', 'broadband', 'internet service'],
      'Cryptocurrency': ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'token', 'coin', 'mining', 'wallet', 'exchange', 'defi', 'nft'],
      'Aerospace/Defense': ['defense', 'military', 'aerospace', 'aircraft', 'space', 'rocket', 'satellite', 'missile', 'drone'],
      'Agriculture': ['farm', 'agriculture', 'crop', 'food', 'grain', 'livestock', 'seed', 'farming'],
      'Transportation': ['transport', 'shipping', 'logistics', 'delivery', 'freight', 'supply chain', 'warehouse', 'distribution'],
      'Construction': ['build', 'construction', 'infrastructure', 'housing', 'real estate', 'property', 'home', 'commercial'],
      'Airlines': ['airline', 'flight', 'travel', 'airplane', 'aviation', 'airport', 'passenger']
    };
    
    // Extract stock tickers AND company names from real news articles
    const stockRegex = /\b[A-Z]{1,5}\b/g;
    const tickerCounts: Record<string, { 
      count: number, 
      newsRefs: string[], 
      directMention: boolean,
      companyNameMention: boolean,
      industryRelevance: number
    }> = {};
    
    // Analyze content for all types of mentions
    news.forEach((item: any) => {
      const content = `${item.title} ${item.description} ${item.content || ''}`.toLowerCase();
      const contentUpper = `${item.title} ${item.description} ${item.content || ''}`;
      
      // 1. Look for direct ticker mentions
      const matches = (contentUpper.match(stockRegex) || []) as string[];
      matches.forEach(match => {
        if (validTickers.has(match)) {
          if (!tickerCounts[match]) {
            tickerCounts[match] = { 
              count: 0, 
              newsRefs: [], 
              directMention: true,
              companyNameMention: false,
              industryRelevance: 0
            };
          }
          tickerCounts[match].count += 3; // Direct ticker mention gets high weight
          tickerCounts[match].newsRefs.push(item.title);
        }
      });
      
      // 2. Look for company name mentions
      Object.entries(stocksMap).forEach(([ticker, data]) => {
        if (content.includes(data.name.toLowerCase())) {
          if (!tickerCounts[ticker]) {
            tickerCounts[ticker] = { 
              count: 0, 
              newsRefs: [], 
              directMention: false,
              companyNameMention: true,
              industryRelevance: 0
            };
          }
          tickerCounts[ticker].count += 2; // Company name mention gets medium weight
          tickerCounts[ticker].companyNameMention = true;
          if (!tickerCounts[ticker].newsRefs.includes(item.title)) {
            tickerCounts[ticker].newsRefs.push(item.title);
          }
        }
      });
      
      // 3. Calculate industry relevance for each ticker
      Object.entries(industryKeywords).forEach(([industry, keywords]) => {
        // Check if content contains industry keywords
        const industryRelevance = keywords.reduce((score, keyword) => {
          return score + (content.includes(keyword) ? 1 : 0);
        }, 0);
        
        if (industryRelevance > 0) {
          // Add relevance score to all tickers in this industry
          Object.entries(stocksMap).forEach(([ticker, data]) => {
            if (data.industry.includes(industry)) {
              if (!tickerCounts[ticker]) {
                tickerCounts[ticker] = { 
                  count: 0, 
                  newsRefs: [], 
                  directMention: false,
                  companyNameMention: false,
                  industryRelevance: 0
                };
              }
              tickerCounts[ticker].industryRelevance += industryRelevance;
              // Industry-based relevance gets lowest weight
              tickerCounts[ticker].count += industryRelevance * 0.5;
              if (!tickerCounts[ticker].newsRefs.includes(item.title) && industryRelevance > 1) {
                tickerCounts[ticker].newsRefs.push(item.title);
              }
            }
          });
        }
      });
    });
    
    // If no direct or company mentions found, suggest based on industry relevance
    // Only use fallback if truly nothing relevant is found
    let useFallback = false;
    
    // Filter for tickers with direct mentions or significant industry relevance
    const relevantTickers = Object.entries(tickerCounts).filter(([_, data]) => {
      return data.directMention || data.companyNameMention || data.industryRelevance > 2;
    });
    
    if (relevantTickers.length === 0) {
      useFallback = true;
      // Use top industry related to keywords to pick fallback stocks
      const keywordsLower = keywords.toLowerCase();
      let bestIndustry = '';
      let bestScore = 0;
      
      Object.entries(industryKeywords).forEach(([industry, keywords]) => {
        const score = keywords.reduce((acc, keyword) => {
          return acc + (keywordsLower.includes(keyword) ? 1 : 0);
        }, 0);
        
        if (score > bestScore) {
          bestScore = score;
          bestIndustry = industry;
        }
      });
      
      // If we found a relevant industry, use top 3 stocks from that industry
      if (bestIndustry) {
        const industryStocks = Object.entries(stocksMap)
          .filter(([_, data]) => data.industry.includes(bestIndustry))
          .map(([ticker]) => ticker)
          .slice(0, 3);
        
        industryStocks.forEach(ticker => {
          tickerCounts[ticker] = { 
            count: 1, 
            newsRefs: [], 
            directMention: false,
            companyNameMention: false,
            industryRelevance: 5
          };
        });
      } else {
        // Absolute last resort - use top market cap stocks
        ['AAPL', 'MSFT', 'GOOGL'].forEach(ticker => {
          tickerCounts[ticker] = { 
            count: 1, 
            newsRefs: [], 
            directMention: false,
            companyNameMention: false,
            industryRelevance: 0
          };
        });
      }
    }

    // Rank stocks by total relevance score
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
        const contentLower = content.toLowerCase();
        
        // Check for ticker symbol, company name, or significant industry relevance
        const hasTickerSymbol = (content.match(stockRegex) || []) as string[];
        const hasCompanyName = stocksMap[ticker] && contentLower.includes(stocksMap[ticker].name.toLowerCase());
        
        return hasTickerSymbol.includes(ticker) || hasCompanyName;
      });
      
      // Build references
      const references = relatedArticles.map((item: any) => {
        const snippet = item.description || item.content || '';
        const sentiment = getSentiment(snippet);
        return {
          title: item.title,
          url: item.url,
          snippet: snippet.substring(0, 150) + '...',
          sentiment
        };
      });
      
      // Construct detailed rationale
      let rationale = '';
      
      if (data.directMention) {
        rationale = `${ticker} (${stocksMap[ticker]?.name}) is directly mentioned in the news articles about ${keywords}.`;
      } else if (data.companyNameMention) {
        rationale = `${stocksMap[ticker]?.name} (${ticker}) is mentioned by name in news about ${keywords}.`;
      } else if (data.industryRelevance > 0) {
        rationale = `${ticker} (${stocksMap[ticker]?.name}) is in the ${stocksMap[ticker]?.industry} industry, which is relevant to "${keywords}".`;
      } else if (useFallback) {
        rationale = `${ticker} is suggested as it's a major player in the ${stocksMap[ticker]?.industry} industry, which may be relevant to "${keywords}".`;
      }
      
      if (references.length > 0) {
        rationale += ' See the specific news references below.';
      }
      
      // Add selection reason
      const selectionReason = data.directMention ? 
        `Directly mentioned in news articles (${data.count/3} mentions)` :
        data.companyNameMention ? 
          `Company name found in news articles (${Math.floor(data.count/2)} mentions)` :
          data.industryRelevance > 0 ?
            `Industry relevance (${data.industryRelevance} industry keywords in news)` :
            `Market leader in relevant industry`;
      
      const reasons = [
        `${ticker} (${stocksMap[ticker]?.name}) relates to ${keywords}`,
        selectionReason,
        rationale
      ];
      
      const isFallback = !data.directMention && !data.companyNameMention && data.industryRelevance < 2;
      
      return {
        ticker,
        confidence: Math.min(99, Math.floor(data.count * 5 + (data.directMention ? 30 : 0) + (data.companyNameMention ? 20 : 0) + (data.industryRelevance * 2))),
        reasons,
        newsReferences: references,
        rationale,
        isFallback,
        selectionMethod: data.directMention ? "ticker" : data.companyNameMention ? "company_name" : data.industryRelevance > 0 ? "industry" : "fallback"
      };
    });

    // Enrich each news item with sentiment and relevant stocks
    const enrichedNews = news.map((item: any) => {
      // Assign relevant stocks if mentioned in the article
      const content = `${item.title} ${item.description} ${item.content || ''}`;
      const contentLower = content.toLowerCase();
      const matches = (content.match(stockRegex) || []) as string[];
      
      // Check for both ticker and company name mentions
      const relevantStocks = Array.from(new Set([
        ...matches.filter(match => validTickers.has(match)),
        ...Object.entries(stocksMap)
          .filter(([_, data]) => contentLower.includes(data.name.toLowerCase()))
          .map(([ticker]) => ticker)
      ]));
      
      return {
        ...item,
        sentiment: getSentiment(content),
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