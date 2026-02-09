"use client";

import { useState, useEffect } from "react";
import { CFOInsight } from "@/lib/ai-cfo/types";

export default function CFOAgentPage() {
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [insights, setInsights] = useState<CFOInsight[]>([]);
  const [cfoOutput, setCfoOutput] = useState<any>(null);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const businessId = "d7d02229-e428-4221-9610-9c04274d4563"; // replace with dynamic if needed
  
      // ✅ Call the single CFO snapshot API
      const res = await fetch(`/api/cfo/snapshot?businessId=${businessId}`);
      const data = await res.json();
      
      setLedgerData({
        current: data.current,
        previous: data.previous,
        deltas: data.deltas,
        googleAnalyticsData: data.googleAnalyticsData,
        adsData: data.adsData
      });
  
      setInsights(data.insightsWithAnswers);
      setCfoOutput(data.cfoOutput);
      
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

  if (loading || !ledgerData) return <p>Insights from connected sources...</p>;

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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl px-6 py-4 -mx-6 -mt-6 mb-6">
        <h2 className="text-2xl font-bold text-white">AI CFO Agent Insights</h2>
        <p className="text-purple-100 text-sm mt-1">Personalized financial insights and recommendations</p>
      </div>

      {/* Insights */}
      <div className="space-y-4">
        {insights.map(insight => {
          let bgClass = "bg-white border-gray-200";
          let iconColor = "text-gray-500";
          let icon = "💡";
          if (insight.type === "alert" && insight.requiresResponse) {
            bgClass = "bg-red-50 border-red-300";
            iconColor = "text-red-500";
            icon = "⚠️";

            
          }
          if (insight.type === "positive") {
            bgClass = "bg-green-50 border-green-300";
            iconColor = "text-green-500";
            icon = "✅";
          }
          if (insight.type === "question") {
            bgClass = "bg-yellow-50 border-yellow-300";
            iconColor = "text-yellow-600";
            icon = "❓";
          }

          return (
            <div key={insight.id} className={`p-5 rounded-lg border-2 shadow-sm transition-shadow hover:shadow-md ${bgClass}`}>
              {/* AI CFO Executive Summary */}
              {cfoOutput && (
                <div className="mb-8 rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    🧠 CFO Summary
                  </h3>

                  <p className="text-gray-700 leading-relaxed mb-4">
                    {cfoOutput.executiveSummary}
                  </p>

                  {cfoOutput.keyRisks?.length > 0 && (
                    <>
                      <h4 className="font-semibold text-red-700 mb-1">Key Risks</h4>
                      <ul className="list-disc ml-5 text-sm text-gray-700 mb-3">
                        {cfoOutput.keyRisks.map((risk: string, i: number) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {cfoOutput.keyOpportunities?.length > 0 && (
                    <>
                      <h4 className="font-semibold text-green-700 mb-1">
                        Opportunities
                      </h4>
                      <ul className="list-disc ml-5 text-sm text-gray-700 mb-3">
                        {cfoOutput.keyOpportunities.map((opp: string, i: number) => (
                          <li key={i}>{opp}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className={`text-2xl flex-shrink-0 ${iconColor}`}>{icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2 text-gray-900">{insight.title}</h4>
                  <p className="text-gray-700 leading-relaxed">{insight.message}</p>

                  {/* Input for unanswered questions */}
                  {insight.requiresResponse && !answers[insight.id] && (
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="Your answer..."
                        value={answers[insight.id] || ""}
                        onChange={e =>
                          setAnswers(prev => ({ ...prev, [insight.id]: e.target.value }))
                        }
                        onBlur={() => saveAnswer(insight.id, answers[insight.id])}
                        className="mt-2 w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
                      />
                    </div>
                  )}

                  {insight.suggestedInvestigations && (
                    <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                        <p className="font-semibold mb-1">Suggested investigation</p>
                        <ul className="list-disc ml-5">
                        {insight.suggestedInvestigations.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                        </ul>
                    </div>
                  )}

                  {insight.advisorFlag === "review_recommended" && (
                    <div className="mt-2 text-xs text-orange-700">
                        ⚠️ Flagged for Torch advisor review
                    </div>
                  )}

                  {insight.advisorFlag === "urgent_review" && (
                    <div className="mt-2 text-xs text-red-700 font-semibold">
                        🚨 Urgent advisor attention recommended
                    </div>
                  )}


                  {/* Show answered */}
                  {answers[insight.id] && (
                    <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Your Answer</p>
                      <p className="text-gray-800">{answers[insight.id]}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Answer Table */}
      {insights.filter(i => answers[i.id]).length > 0 && (
        <div className="mt-8">
          <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
              <h3 className="text-xl font-semibold text-white">Your Answers</h3>
              <p className="text-blue-100 text-sm mt-1">Summary of your responses to CFO questions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Insight</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Your Answer</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {insights
                    .filter(i => answers[i.id])
                    .map(i => (
                      <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{i.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">{answers[i.id]}</div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
