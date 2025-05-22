import { useState } from 'react';
import { Timeline } from "./ui/timeline";

interface NewsItem {
  title: string;
  description: string;
  url: string;
  content?: string | null;
  publishedAt?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevantStocks?: string[];
}

interface OpportunityItem {
  ticker: string;
  confidence: number;
  reasons: string[];
  newsReferences: {
    title: string;
    url: string;
    snippet: string;
    sentiment: string;
  }[];
  rationale?: string;
  isFallback?: boolean;
  selectionMethod?: 'ticker' | 'company_name' | 'industry' | 'fallback';
}

interface ErrorResponse {
  error: string;
  timestamp?: string;
}

export default function NewsAnalysis({
  onStockSelect
}: {
  onStockSelect: (tickers: string[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [keywords, setKeywords] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // First, get news using Google News
      const googleNewsResponse = await fetch('/api/google-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: keywords,
          num: 20,
        }),
      });

      if (!googleNewsResponse.ok) {
        throw new Error('Failed to fetch news');
      }

      const googleNewsResults = await googleNewsResponse.json();
      // googleNewsResults is expected to be { news: [...] } or just [...], handle all
      const articles = Array.isArray(googleNewsResults)
        ? googleNewsResults
        : googleNewsResults.news || googleNewsResults.results || googleNewsResults.articles || [];

      // Filter by date range (if publishedAt/date is available)
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      let filteredArticles = articles.filter((item: any) => {
        const dateStr = item.publishedAt || item.date;
        if (!dateStr) return true; // If no date, include
        const d = new Date(dateStr);
        return d >= startDate && d <= endDate;
      });

      // If no articles in range, find the article with the nearest date
      if (filteredArticles.length === 0 && articles.length > 0) {
        // Find the article with the date closest to the selected range
        let minDiff = Infinity;
        let nearestArticle = null;
        articles.forEach((item: any) => {
          const dateStr = item.publishedAt || item.date;
          if (!dateStr) return;
          const d = new Date(dateStr);
          // Calculate distance to the middle of the selected range
          const rangeMid = new Date((startDate.getTime() + endDate.getTime()) / 2);
          const diff = Math.abs(d.getTime() - rangeMid.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            nearestArticle = item;
          }
        });
        // If still no article with a date, fallback to all articles without a date
        if (!nearestArticle) {
          filteredArticles = articles.filter((item: any) => {
            const dateStr = item.publishedAt || item.date;
            return !dateStr;
          });
        } else {
          filteredArticles = [nearestArticle];
        }
      }

      // Map to NewsItem format
      const newsResults: NewsItem[] = filteredArticles.map((item: any) => ({
        title: item.title || item.headline || 'Untitled',
        description: item.description || item.snippet || item.summary || '',
        url: item.url || item.link,
        content: item.content || item.snippet || '',
        publishedAt: item.publishedAt || item.date || '',
      }));
      
      // Debug: log the news results
      console.log('Fetched news articles:', newsResults);

      // Then analyze the news for opportunities
      const analysisResponse = await fetch('/api/analyze-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          news: newsResults,
          startDate: dateRange.start,
          endDate: dateRange.end,
          keywords,
        }),
      });

      const analysisData = await analysisResponse.json();

      if (!analysisResponse.ok) {
        throw new Error(analysisData.error || 'Failed to analyze news');
      }

      if (analysisData.error) {
        throw new Error(analysisData.error);
      }
      
      setNews(newsResults);
      setOpportunities(analysisData.opportunities || []);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze news. Please try again.');
      setNews([]);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeStocks = (opportunity: OpportunityItem) => {
    onStockSelect([opportunity.ticker]);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Market News Analysis</h2>
        
        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-200">
              Search Keywords
            </label>
            <input
              type="text"
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="AI, Blockchain, Electric Vehicles..."
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-200">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-200">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze News'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-md">
            <p className="text-red-200">{error}</p>
          </div>
        )}
      </div>

      {opportunities.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Investment Opportunities</h3>
          <div className="space-y-4">
            {opportunities.map((opportunity, index) => (
              <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-white">
                      {opportunity.ticker}
                      {opportunity.selectionMethod && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          opportunity.selectionMethod === 'ticker' ? 'bg-green-700 text-green-100' :
                          opportunity.selectionMethod === 'company_name' ? 'bg-blue-700 text-blue-100' :
                          opportunity.selectionMethod === 'industry' ? 'bg-purple-700 text-purple-100' :
                          'bg-gray-700 text-gray-100'
                        }`}>
                          {opportunity.selectionMethod === 'ticker' ? 'ticker mention' :
                           opportunity.selectionMethod === 'company_name' ? 'company name' :
                           opportunity.selectionMethod === 'industry' ? 'industry relevance' :
                           'suggested'}
                        </span>
                      )}
                    </h4>
                    <div className="mt-1 flex items-center">
                      <div className="h-2 w-20 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            opportunity.isFallback ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${opportunity.confidence}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm text-gray-400">
                        {opportunity.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAnalyzeStocks(opportunity)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Analyze Stock
                  </button>
                </div>
                <ul className="mt-3 space-y-1">
                  {opportunity.reasons.map((reason, idx) => (
                    <li key={idx} className="text-sm text-gray-300">• {reason}</li>
                  ))}
                </ul>
                {opportunity.rationale && (
                  <div className="mt-2 text-xs text-gray-400 whitespace-pre-line">
                    <strong>Rationale:</strong> {opportunity.rationale}
                  </div>
                )}
                {opportunity.newsReferences && opportunity.newsReferences.length > 0 && (
                  <div className="mt-2">
                    <strong className="text-xs text-indigo-300">References:</strong>
                    <ul className="mt-1 space-y-1">
                      {opportunity.newsReferences.map((ref, refIdx) => (
                        <li key={refIdx} className="text-xs text-gray-300">
                          <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline font-bold hover:text-indigo-300">
                            {ref.title}
                          </a>
                          {ref.snippet && <span className="ml-1 text-gray-400">- {ref.snippet}</span>}
                          {ref.sentiment && (
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${ref.sentiment === 'positive' ? 'bg-green-900 text-green-200' : ref.sentiment === 'negative' ? 'bg-red-900 text-red-200' : 'bg-gray-900 text-gray-200'}`}>{ref.sentiment}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {opportunity.isFallback && (
                  <div className="mt-2 text-xs text-yellow-400">
                    (No direct news correlation found, included for context)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {news.length > 0 && (
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Related News</h3>
          <Timeline
            data={news.map((item) => ({
              title: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : item.title,
              content: (
                <div>
                <h4 className="text-md font-medium text-white">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-bold hover:text-indigo-300">
                    {item.title}
                  </a>
                </h4>
                <p className="mt-1 text-sm text-gray-300">{item.description}</p>
                {item.content && (
                  <div className="mt-2 text-sm text-gray-400 max-h-40 overflow-y-auto">
                    {item.content}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {item.sentiment && (
                      <span className={`px-2 py-1 text-xs rounded ${
                        item.sentiment === 'positive' ? 'bg-green-900 text-green-200' :
                        item.sentiment === 'negative' ? 'bg-red-900 text-red-200' :
                        'bg-gray-900 text-gray-200'
                      }`}>
                        {item.sentiment}
                      </span>
                    )}
                    {item.relevantStocks && item.relevantStocks.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {item.relevantStocks.map((stock, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-blue-900 text-blue-200 rounded">
                            {stock}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {item.publishedAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              ),
            }))}
          />
        </div>
      )}

      {news.length === 0 && !loading && !error && (
        <div className="mt-4 p-4 bg-yellow-900/50 border border-yellow-700 rounded-md">
          <p className="text-yellow-200">No news articles found for the given keywords and date range.</p>
        </div>
      )}
    </div>
  );
} 