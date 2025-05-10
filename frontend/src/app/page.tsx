'use client';

import { useState, useRef } from 'react';
import { format } from 'date-fns';
import NewsAnalysis from './components/NewsAnalysis';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./components/ui/table";
import StockPriceChart from './components/StockPriceChart';
import { AnalystAnalysisTable, AnalystSignal } from "./components/ui/analyst-analysis-table";
import { SimulationResultsTable } from "./components/SimulationResultsTable";

const ANALYSTS = [
  { label: 'Ben Graham', value: 'ben_graham' },
  { label: 'Bill Ackman', value: 'bill_ackman' },
  { label: 'Cathie Wood', value: 'cathie_wood' },
  { label: 'Charlie Munger', value: 'charlie_munger' },
  { label: 'Michael Burry', value: 'michael_burry' },
  { label: 'Peter Lynch', value: 'peter_lynch' },
  { label: 'Phil Fisher', value: 'phil_fisher' },
  { label: 'Stanley Druckenmiller', value: 'stanley_druckenmiller' },
  { label: 'Warren Buffett', value: 'warren_buffett' },
  { label: 'Technical Analyst', value: 'technical_analyst' },
  { label: 'Fundamentals Analyst', value: 'fundamentals_analyst' },
  { label: 'Sentiment Analyst', value: 'sentiment_analyst' },
  { label: 'Valuation Analyst', value: 'valuation_analyst' },
];
const PROVIDERS = [
  { label: 'OpenAI', value: 'OpenAI' },
  { label: 'Groq', value: 'Groq' },
  { label: 'Ollama', value: 'Ollama' },
  { label: 'DeepSeek', value: 'DeepSeek' },
];
const MODELS_BY_PROVIDER: Record<string, { label: string; value: string }[]> = {
  OpenAI: [
    { label: 'GPT-4o', value: 'gpt-4o' },
  ],
  Groq: [
    { label: 'Llama 3', value: 'llama3' },
    // Add more Groq models here if needed
  ],
  Ollama: [
    { label: 'Llama 3', value: 'llama3' },
  ],
  DeepSeek: [
    { label: 'DeepSeek Reasoner', value: 'deepseek-reasoner' },
    { label: 'DeepSeek Chat', value: 'deepseek-chat' },
  ],
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>(['ben_graham']);
  const [modelProvider, setModelProvider] = useState<string>('DeepSeek');
  const [modelChoice, setModelChoice] = useState<string>(MODELS_BY_PROVIDER['DeepSeek'][0].value);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState('confidence');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showReasoning, setShowReasoning] = useState(true);
  const [chartTickers, setChartTickers] = useState<string[]>([]);
  const [chartStart, setChartStart] = useState<string | null>(null);
  const [chartEnd, setChartEnd] = useState<string | null>(null);
  const [tickerSearch, setTickerSearch] = useState('');
  const [tickerSuggestions, setTickerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setProgress(0);
    setStatus('Running simulation...');
    if (progressInterval.current) clearInterval(progressInterval.current);

    // Build query string for SSE
    const formData = new FormData(e.currentTarget);
    const tickers = formData.get('tickers')?.toString() || '';
    let startDate = formData.get('startDate')?.toString() || '';
    let endDate = formData.get('endDate')?.toString() || '';
    // Ensure date format is yyyy-MM-dd (replace any slashes with dashes)
    startDate = startDate.replaceAll('/', '-');
    endDate = endDate.replaceAll('/', '-');
    setChartTickers(tickers.split(',').map(t => t.trim()).filter(Boolean));
    setChartStart(startDate);
    setChartEnd(endDate);
    const params = new URLSearchParams({
      tickers: tickers,
      startDate: startDate,
      endDate: endDate,
      selectedAnalysts: selectedAnalysts.join(','),
      modelChoice,
      modelProvider,
      showReasoning: showReasoning ? 'true' : 'false',
    });
    const es = new EventSource(`/api/simulate-stream?${params.toString()}`);
    es.addEventListener('progress', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setProgress(data.percent);
        setStatus(data.status);
        if (data.percent === 100) {
          es.close();
          setLoading(false);
        }
      } catch {}
    });
    es.addEventListener('error', (event: MessageEvent) => {
      setStatus('Simulation failed.');
      setProgress(0);
      setLoading(false);
      es.close();
    });
    es.addEventListener('result', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Simulation result event:', data); // Debug log
        if (data.outputFile) {
          setResult(data.outputFile);
        }
        if (data.resultJson) {
          setResultData(data.resultJson);
        } else {
          setResultData(null);
        }
      } catch (err) {
        console.error('Error parsing simulation result event:', err, event.data);
      }
    });
  };

  const handleStockSelect = (tickers: string[]) => {
    const form = document.getElementById('simulation-form') as HTMLFormElement;
    if (form) {
      const tickerInput = form.querySelector('#tickers') as HTMLInputElement;
      if (tickerInput) {
        tickerInput.value = tickers.join(', ');
      }
    }
  };

  // Helper to extract table data from resultData.decisions
  const getTableRows = () => {
    if (!resultData || !resultData.decisions) return [];
    return Object.entries(resultData.decisions).map(([ticker, d]) => {
      const decision = d as any;
      return {
        ticker,
        action: decision.action,
        quantity: decision.quantity,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
      };
    });
  };
  const rows = getTableRows()
    .filter(row =>
      filter === '' ||
      row.ticker.toLowerCase().includes(filter.toLowerCase()) ||
      row.action.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortKey === 'confidence') {
        return sortDir === 'asc' ? a.confidence - b.confidence : b.confidence - a.confidence;
      }
      if (sortKey === 'ticker') {
        return sortDir === 'asc' ? a.ticker.localeCompare(b.ticker) : b.ticker.localeCompare(a.ticker);
      }
      return 0;
    });

  // Autocomplete handler
  const handleTickerInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTickerSearch(value);
    setShowSuggestions(true);
    if (value.length < 2) {
      setTickerSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/search-ticker?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setTickerSuggestions(data.matches || []);
    } catch {
      setTickerSuggestions([]);
    }
  };

  const handleSuggestionClick = (symbol: string) => {
    setTickerSearch(symbol);
    setShowSuggestions(false);
    // Also update the input field in the form
    const tickerInput = document.getElementById('tickers') as HTMLInputElement;
    if (tickerInput) tickerInput.value = symbol;
  };

  return (
    <div className="space-y-8">
      <NewsAnalysis onStockSelect={handleStockSelect} />

      <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-6">Stock Market Simulator</h1>
        {loading && (
          <div className="mb-4">
            <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
              <div
                className="bg-indigo-500 h-3 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-indigo-200 text-sm">{status} {progress}%</div>
          </div>
        )}
        <form id="simulation-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="tickers" className="block text-sm font-medium text-gray-200">
              Stock Tickers or Company Name
            </label>
            <input
              type="text"
              name="tickers"
              id="tickers"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="PLTR, AAPL, MSFT or Apple, Tesla, Tencent"
              value={tickerSearch}
              onChange={handleTickerInput}
              autoComplete="off"
              required
            />
            {showSuggestions && tickerSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-gray-800 border border-gray-600 rounded w-full mt-1 max-h-48 overflow-y-auto">
                {tickerSuggestions.map((s, i) => (
                  <li
                    key={s.symbol ? `${s.symbol}-${i}` : `suggestion-${i}`}
                    className="px-3 py-2 hover:bg-indigo-600 hover:text-white cursor-pointer"
                    onClick={() => handleSuggestionClick(s.symbol)}
                  >
                    <span className="font-semibold">{s.symbol}</span> - {s.shortname} <span className="text-xs text-gray-400">({s.exchDisp}, {s.typeDisp})</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-sm text-gray-400">Type a company name or ticker. Suggestions will appear as you type.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-200">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-200">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Select AI Analysts</label>
            <div className="flex flex-wrap gap-2">
              {ANALYSTS.map(a => (
                <label key={a.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedAnalysts.includes(a.value)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedAnalysts(prev => [...prev, a.value]);
                      } else {
                        setSelectedAnalysts(prev => prev.filter(v => v !== a.value));
                      }
                    }}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                  />
                  <span className="text-gray-200 text-sm">{a.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Select LLM Provider</label>
            <select
              value={modelProvider}
              onChange={e => {
                const provider = e.target.value;
                setModelProvider(provider);
                // Set model to first available for new provider
                setModelChoice(MODELS_BY_PROVIDER[provider][0].value);
              }}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Select LLM Model</label>
            <select
              value={modelChoice}
              onChange={e => setModelChoice(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {MODELS_BY_PROVIDER[modelProvider].map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="showReasoning"
              id="showReasoning"
              value="true"
              className="h-4 w-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-gray-700"
              checked={showReasoning}
              onChange={e => setShowReasoning(e.target.checked)}
            />
            <label htmlFor="showReasoning" className="ml-2 block text-sm text-gray-200">
              Show AI Reasoning
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Running Simulation...' : 'Run Simulation'}
          </button>
        </form>
      </div>

      {resultData && (
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-gray-700 mt-6">
          <h2 className="text-xl font-semibold text-white mb-4">Simulation Results</h2>
          <SimulationResultsTable data={rows} />
          {/* Analyst Analysis Tables */}
          {resultData.analyst_signals && Object.entries(resultData.analyst_signals).map(([agent, signals]) => (
            <AnalystAnalysisTable
              key={agent}
              data={signals as Record<string, AnalystSignal>}
              analystName={agent.replace("_agent", "").replace(/_/g, " ")}
            />
          ))}
        </div>
      )}
      {(!resultData && !loading) && (
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-gray-700 mt-6">
          <h2 className="text-xl font-semibold text-white mb-4">No Simulation Results</h2>
          <p className="text-gray-300">No results were returned from the simulation. Please check your input or try again.</p>
        </div>
      )}
      {result && (
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-gray-700 mt-6">
          <h2 className="text-xl font-semibold text-white mb-4">Download Simulation Results</h2>
          <a
            href={`/api/download/${result}`}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            download
          >
            Download Excel Report
          </a>
        </div>
      )}

      {chartTickers.length > 0 && chartStart && chartEnd && (
        <div className="mt-8">
          <StockPriceChart tickers={chartTickers} start={chartStart} end={chartEnd} />
        </div>
      )}
    </div>
  );
}
