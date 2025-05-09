import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface StockPriceChartProps {
  ticker: string;
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

const StockPriceChart: React.FC<StockPriceChartProps> = ({ ticker, start, end }) => {
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker || !start || !end) return;
    setLoading(true);
    setError(null);
    fetch(`/api/price-history?ticker=${encodeURIComponent(ticker)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          setError(res.error);
          setData([]);
        } else {
          setData(res.prices || []);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch price data.');
        setLoading(false);
      });
  }, [ticker, start, end]);

  if (loading) return <div className="text-gray-400">Loading chart...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data.length) return <div className="text-gray-400">No price data available.</div>;

  return (
    <div className="bg-white/10 rounded-lg p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-2 text-white">{ticker} Price Chart</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="time" tick={{ fill: '#ccc', fontSize: 12 }} minTickGap={20} />
          <YAxis tick={{ fill: '#ccc', fontSize: 12 }} domain={['auto', 'auto']} />
          <Tooltip contentStyle={{ background: '#222', border: 'none', color: '#fff' }} />
          <Line type="monotone" dataKey="close" stroke="#6366f1" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockPriceChart; 