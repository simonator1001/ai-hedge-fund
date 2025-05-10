import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface StockPriceChartProps {
  tickers: string[];
  start: string;
  end: string;
}

interface PriceData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const colors = ["#6366f1", "#22d3ee", "#f59e42", "#ef4444", "#10b981", "#a21caf", "#eab308", "#3b82f6"];

const StockPriceChart: React.FC<StockPriceChartProps> = ({ tickers, start, end }) => {
  const [data, setData] = useState<{ [ticker: string]: PriceData[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tickers.length || !start || !end) return;
    setLoading(true);
    setError(null);
    Promise.all(
      tickers.map(ticker =>
        fetch(`/api/price-history?ticker=${encodeURIComponent(ticker)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
          .then(res => res.json())
          .then(res => ({ ticker, data: res.prices || [], error: res.error }))
      )
    )
      .then(results => {
        const newData: { [ticker: string]: PriceData[] } = {};
        let anyData = false;
        let errorMsg = '';
        results.forEach((result, idx) => {
          if (result.error) {
            errorMsg += `${result.ticker}: ${result.error}\n`;
          } else if (result.data.length) {
            newData[result.ticker] = result.data;
            anyData = true;
          } else {
            errorMsg += `${result.ticker}: No data found\n`;
          }
        });
        setData(newData);
        setError(errorMsg ? errorMsg.trim() : null);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch price data.');
        setLoading(false);
      });
  }, [tickers, start, end]);

  if (loading) return <div className="text-gray-400">Loading chart...</div>;
  if (error && Object.keys(data).length === 0) return <div className="text-red-400 whitespace-pre-line">{error}</div>;
  if (!Object.keys(data).length) return <div className="text-gray-400">No price data found for selected tickers and date range.</div>;

  // Merge data by time for multi-ticker chart
  const mergedData: { [time: string]: any } = {};
  Object.entries(data).forEach(([ticker, prices]) => {
    prices.forEach((p) => {
      if (!mergedData[p.time]) mergedData[p.time] = { time: p.time };
      mergedData[p.time][ticker] = p.close;
      mergedData[p.time][`${ticker}_volume`] = p.volume;
    });
  });
  const chartData = Object.values(mergedData).sort((a, b) => (a.time > b.time ? 1 : -1));

  // Calculate summary stats
  let totalVolume = 0;
  let highestClose = 0;
  chartData.forEach(row => {
    tickers.forEach(ticker => {
      if (row[`${ticker}_volume`]) totalVolume += row[`${ticker}_volume`];
      if (row[ticker] && row[ticker] > highestClose) highestClose = row[ticker];
    });
  });

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Bar Chart - Interactive</h2>
          <p className="text-zinc-400 text-sm">Showing closing prices for the selected period</p>
        </div>
        <div className="flex gap-8">
          <div className="text-center">
            <div className="text-zinc-400 text-xs">Total Volume</div>
            <div className="text-2xl font-bold text-white">{totalVolume.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-zinc-400 text-xs">Highest Close</div>
            <div className="text-2xl font-bold text-white">{highestClose.toLocaleString()}</div>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="time" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
          <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
          <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', color: '#fff' }} labelStyle={{ color: '#fff' }} />
          <Legend wrapperStyle={{ color: '#fff' }} />
          {tickers.map((ticker, idx) => (
            <Bar
              key={ticker}
              dataKey={ticker}
              fill={colors[idx % colors.length]}
              name={ticker}
              isAnimationActive={false}
              barSize={8}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockPriceChart; 