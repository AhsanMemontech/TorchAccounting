"use client";

import { useState, useEffect } from "react";
import { CFOInsight } from "@/lib/ai-cfo/types";

export default function FinancialReports() {
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [insights, setInsights] = useState<CFOInsight[]>([]);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const businessId = "d7d02229-e428-4221-9610-9c04274d4563"; // replace with dynamic if needed
  
      // ✅ Call the single CFO snapshot API
      const res = await fetch(`/api/cfo/snapshot?businessId=${businessId}`);
      const data = await res.json();
  
      // data contains:
      // - current (Digits current month)
      // - previous (Digits previous month)
      // - deltas
      // - googleAnalyticsData
      // - adsData
      // - insights
  
      setLedgerData({
        current: data.current,
        previous: data.previous,
        deltas: data.deltas,
        googleAnalyticsData: data.googleAnalyticsData,
        adsData: data.adsData
      });
  
      setInsights(data.insightsWithAnswers);

      // populate initial answers
      const initialAnswers: Record<string, string> = {};
      data.insightsWithAnswers.forEach((i: any) => {
        if (i.userAnswer) initialAnswers[i.id] = i.userAnswer;
      });
      setAnswers(initialAnswers)
    } catch (err) {
      console.error("Error fetching CFO snapshot:", err);
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    fetchLedgerData();
  }, []);

  if (loading || !ledgerData) return <p>Loading financial summary...</p>;

  const { current, previous, deltas, googleAnalyticsData } = ledgerData;

  const saveAnswer = async (insightId: string, answer: string) => {
    const businessId = "d7d02229-e428-4221-9610-9c04274d4563";
    await fetch("/api/cfo/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, insightId, answer }),
    });
  };
  
  return (
    <div className="p-6 bg-white rounded shadow space-y-6">
      <h2 className="text-2xl font-bold">AI CFO Financial Snapshot</h2>

      {/* Financial Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <h3 className="text-xl font-semibold text-white">Financial Overview</h3>
          <p className="text-indigo-100 text-sm mt-1">Current vs Previous Month Comparison</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Metric</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Current Month</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Previous Month</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Δ Amount</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Δ %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                {
                  name: "Revenue",
                  current: current.totalRevenue,
                  previous: previous.totalRevenue,
                  delta: deltas.revenueDelta,
                  pct: deltas.revenuePct,
                },
                {
                  name: "COGS",
                  current: current.totalCOGS,
                  previous: previous.totalCOGS,
                  delta: deltas.cogsDelta,
                  pct: deltas.cogsPct,
                },
                {
                  name: "Expenses",
                  current: current.totalExpenses,
                  previous: previous.totalExpenses,
                  delta: deltas.expensesDelta,
                  pct: deltas.expensesPct,
                },
                {
                  name: "Profit",
                  current: current.profit,
                  previous: previous.profit,
                  delta: deltas.profitDelta,
                  pct: deltas.profitPct,
                },
              ].map((row) => (
                <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{row.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">${row.current.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-600">${row.previous.toLocaleString()}</div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right ${
                    row.delta >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    <div className="text-sm font-semibold flex items-center justify-end gap-1">
                      {row.delta >= 0 ? (
                        <span className="text-green-500">↑</span>
                      ) : (
                        <span className="text-red-500">↓</span>
                      )}
                      ${Math.abs(row.delta).toLocaleString()}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right ${
                    row.pct >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    <div className="text-sm font-semibold flex items-center justify-end gap-1">
                      {row.pct >= 0 ? (
                        <span className="text-green-500">↑</span>
                      ) : (
                        <span className="text-red-500">↓</span>
                      )}
                      {Math.abs(row.pct).toFixed(2)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {ledgerData?.googleAnalyticsData && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white"/>
              </svg>
              Google Analytics
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              {ledgerData.googleAnalyticsData.current.startDate} → {ledgerData.googleAnalyticsData.current.endDate}
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{ledgerData.googleAnalyticsData.current.sessions.toLocaleString()}</p>
                <div className={`mt-2 text-sm font-medium ${
                  ledgerData.googleAnalyticsData.delta.sessions >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {ledgerData.googleAnalyticsData.delta.sessions >= 0 ? '↑' : '↓'} {Math.abs(ledgerData.googleAnalyticsData.delta.sessions).toLocaleString()} ({ledgerData.googleAnalyticsData.delta.sessionsPct.toFixed(2)}%)
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Users</p>
                <p className="text-2xl font-bold text-gray-900">{ledgerData.googleAnalyticsData.current.users.toLocaleString()}</p>
                <div className={`mt-2 text-sm font-medium ${
                  ledgerData.googleAnalyticsData.delta.users >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {ledgerData.googleAnalyticsData.delta.users >= 0 ? '↑' : '↓'} {Math.abs(ledgerData.googleAnalyticsData.delta.users).toLocaleString()} ({ledgerData.googleAnalyticsData.delta.usersPct.toFixed(2)}%)
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Conversions</p>
                <p className="text-2xl font-bold text-gray-900">{ledgerData.googleAnalyticsData.current.conversions.toLocaleString()}</p>
                <div className={`mt-2 text-sm font-medium ${
                  ledgerData.googleAnalyticsData.delta.conversions >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {ledgerData.googleAnalyticsData.delta.conversions >= 0 ? '↑' : '↓'} {Math.abs(ledgerData.googleAnalyticsData.delta.conversions).toLocaleString()} ({ledgerData.googleAnalyticsData.delta.conversionsPct.toFixed(2)}%)
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-600 mb-1">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${ledgerData.googleAnalyticsData.current.revenue.toLocaleString()}</p>
                <div className={`mt-2 text-sm font-medium ${
                  ledgerData.googleAnalyticsData.delta.revenue >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {ledgerData.googleAnalyticsData.delta.revenue >= 0 ? '↑' : '↓'} ${Math.abs(ledgerData.googleAnalyticsData.delta.revenue).toLocaleString()} ({ledgerData.googleAnalyticsData.delta.revenuePct.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
