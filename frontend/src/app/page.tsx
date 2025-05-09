'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import NewsAnalysis from './components/NewsAnalysis';

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
    { label: 'DeepSeek V2', value: 'deepseek-v2' },
    { label: 'DeepSeek MoE', value: 'deepseek-moe' },
  ],
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>(['ben_graham']);
  const [modelProvider, setModelProvider] = useState<string>('OpenAI');
  const [modelChoice, setModelChoice] = useState<string>(MODELS_BY_PROVIDER['OpenAI'][0].value);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      tickers: formData.get('tickers')?.toString().split(',').map(t => t.trim()),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      showReasoning: formData.get('showReasoning') === 'true',
      selectedAnalysts,
      modelChoice,
      modelProvider,
    };
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Simulation failed');
      }
      const result = await response.json();
      setResult(result.outputFile);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to run simulation. Please try again.');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-8">
      <NewsAnalysis onStockSelect={handleStockSelect} />

      <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-6">Stock Market Simulator</h1>
        <form id="simulation-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="tickers" className="block text-sm font-medium text-gray-200">
              Stock Tickers
            </label>
            <input
              type="text"
              name="tickers"
              id="tickers"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="PLTR, AAPL, MSFT"
              required
            />
            <p className="mt-1 text-sm text-gray-400">Separate multiple tickers with commas</p>
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

      {result && (
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Simulation Results</h2>
          <p className="text-gray-200">
            Your simulation results are ready! Download them here:
          </p>
          <a
            href={`/api/download/${result}`}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Download Excel Report
          </a>
        </div>
      )}
    </div>
  );
}
