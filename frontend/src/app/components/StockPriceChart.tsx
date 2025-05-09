import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

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

const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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
    });
  });
  const chartData = Object.values(mergedData).sort((a, b) => (a.time > b.time ? 1 : -1));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        {tickers.map((ticker, idx) => (
          <Line
            key={ticker}
            type="monotone"
            dataKey={ticker}
            stroke={colors[idx % colors.length]}
            dot={false}
            name={ticker}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default StockPriceChart; 