import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Hedge Fund - Trading Platform",
  description: "Advanced AI-powered trading platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased bg-gray-50 dark:bg-gray-900">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Hedge Fund</h1>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <a href="#" className="flex items-center p-2 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="ml-3">Dashboard</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center p-2 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="ml-3">Portfolio</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center p-2 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="ml-3">Market</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center p-2 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="ml-3">Analysis</span>
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="h-full px-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder="Search stocks..."
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="text-gray-900 dark:text-white">Settings</span>
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <span className="text-gray-900 dark:text-white">Profile</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-4">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
} 