export default function Home() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Market Overview */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">S&P 500</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">4,567.89</p>
            <p className="text-sm text-green-500">+1.23%</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">NASDAQ</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">14,234.56</p>
            <p className="text-sm text-green-500">+0.89%</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">DOW</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">34,567.89</p>
            <p className="text-sm text-red-500">-0.45%</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">VIX</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">15.67</p>
            <p className="text-sm text-green-500">-2.34%</p>
          </div>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Portfolio Summary</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">$1,234,567.89</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Today&apos;s Change</p>
            <p className="text-xl font-bold text-green-500">+$12,345.67 (+1.23%)</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cash Balance</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">$123,456.78</p>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Trades</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">AAPL</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500">Buy</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">100</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">$175.23</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">10:23:45</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">MSFT</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">Sell</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">50</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">$325.67</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">09:45:12</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">GOOGL</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500">Buy</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">25</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">$2,345.67</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">09:12:34</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
