"use client";

import { useEffect, useState } from "react";
import { AISignal } from "@/lib/ai-cfo/types";
import { generateSignals } from "@/lib/intelligence/signalEngine";
import Card from "antd/es/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const businessId = "d7d02229-e428-4221-9610-9c04274d4563";

  const [signals, setSignals] = useState<AISignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSignals() {
      try {
        setLoading(true);
        const data = await generateSignals(businessId);
        setSignals(data);
      } catch (err) {
        console.error("Failed to load signals:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSignals();
  }, []);

  if (loading)
    return <p className="p-6 text-gray-600">Loading dashboard...</p>;

  const revenueSignal = signals.find((s) => s.type === "revenue");
  const expensesSignal = signals.find((s) => s.type === "expenses");
  const profitSignal = signals.find((s) => s.type === "profit");

  const chartData =
    revenueSignal?.drivers?.map((d) => ({
      name: d.name,
      delta: d.deltaPct,
    })) || [];

  const severityColor = (level?: string) => {
    if (level === "critical") return "text-red-600";
    if (level === "warning") return "text-orange-500";
    if (level === "watch") return "text-yellow-500";
    return "text-green-600";
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Torch AI CFO Dashboard</h1>

      {/* ================= TOP CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 shadow-lg rounded-xl">
          <div className="text-sm text-gray-500 font-semibold">Revenue</div>
          <div className="text-2xl font-bold">
            ${revenueSignal?.valueCurrent?.toLocaleString() || "–"}
          </div>
          <div className={`mt-1 font-medium ${severityColor(revenueSignal?.severityLevel)}`}>
            {revenueSignal?.deltaPct?.toFixed(2)}% • {revenueSignal?.headline}
          </div>
        </Card>

        <Card className="p-4 shadow-lg rounded-xl">
          <div className="text-sm text-gray-500 font-semibold">Expenses</div>
          <div className="text-2xl font-bold">
            ${expensesSignal?.valueCurrent?.toLocaleString() || "–"}
          </div>
          <div className={`mt-1 font-medium ${severityColor(expensesSignal?.severityLevel)}`}>
            {expensesSignal?.headline}
          </div>
        </Card>

        <Card className="p-4 shadow-lg rounded-xl">
          <div className="text-sm text-gray-500 font-semibold">Profit</div>
          <div className="text-2xl font-bold">
            ${profitSignal?.valueCurrent?.toLocaleString() || "–"}
          </div>
          <div className={`mt-1 font-medium ${severityColor(profitSignal?.severityLevel)}`}>
            {profitSignal?.headline}
          </div>
        </Card>
      </div>

      {/* ================= AI FEED ================= */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">AI Feed</h2>

        {signals.map((signal) => (
          <div
            key={signal.id}
            className="border-l-4 border-indigo-600 bg-white shadow-md rounded-lg p-4"
          >
            <div className="flex justify-between">
              <div className="text-sm uppercase font-semibold text-gray-500">
                {signal.type}
              </div>
              <div className={`text-sm font-bold ${severityColor(signal.severityLevel)}`}>
                {signal.severityLevel.toUpperCase()}
              </div>
            </div>

            <div className="mt-2 text-lg font-bold">
              {signal.headline}
            </div>

            <div className="text-sm text-gray-600 mt-1">
              {signal.summary}
            </div>

            {signal.drivers?.length > 0 && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                {signal.drivers.map((d) => (
                  <div
                    key={d.name}
                    className="bg-gray-50 p-2 rounded border text-sm"
                  >
                    <div className="font-medium">{d.name}</div>
                    <div
                      className={
                        d.deltaPct >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {d.deltaPct.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ================= REVENUE DRIVERS CHART ================= */}
      {chartData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">
            Revenue Drivers
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="delta" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}