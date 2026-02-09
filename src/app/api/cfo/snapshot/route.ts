// /api/cfo/snapshot.route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateAICFOMessages } from "@/lib/ai-cfo/generateInsights";
import { getMockAdsDelta } from "@/lib/data/googleAds";
import { supabase } from "@/lib/supabaseClient";
import { runCFOAgent } from "@/lib/ai/cfo/cfoAgent.think";

export async function GET(req: NextRequest) {
  try {
    const businessId = req.nextUrl.searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

    const now = new Date();
    const currentFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentLast = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevFirst = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const prevLast = new Date(now.getFullYear(), now.getMonth() - 1, 0);
    const formatDate = (d: Date) => d.toISOString();

    // --- Fetch data ---
    const [currentRes, prevRes, gaRes, adsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/financial-summary?occurred_after=${encodeURIComponent(formatDate(currentFirst))}&occurred_before=${encodeURIComponent(formatDate(currentLast))}`),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/financial-summary?occurred_after=${encodeURIComponent(formatDate(prevFirst))}&occurred_before=${encodeURIComponent(formatDate(prevLast))}`),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/google/google-analytics?businessId=${businessId}`),
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/google/google-ads?businessId=${businessId}`)
    ]);
    const [currentData, prevData, gaData, adsData] = await Promise.all([
      currentRes.json(),
      prevRes.json(),
      gaRes.json(),
      adsRes.json()
    ]);

    // --- Compute deltas ---
    const deltas = {
      revenueDelta: currentData.totalRevenue - prevData.totalRevenue,
      revenuePct: ((currentData.totalRevenue - prevData.totalRevenue) / prevData.totalRevenue) * 100,
      cogsDelta: currentData.totalCOGS - prevData.totalCOGS,
      cogsPct: ((currentData.totalCOGS - prevData.totalCOGS) / prevData.totalCOGS) * 100,
      expensesDelta: currentData.totalExpenses - prevData.totalExpenses,
      expensesPct: ((currentData.totalExpenses - prevData.totalExpenses) / prevData.totalExpenses) * 100,
      profitDelta: currentData.profit - prevData.profit,
      profitPct: ((currentData.profit - prevData.profit) / prevData.profit) * 100,
    };

    // --- Snapshot for AI ---
    const digitsSnapshot = {
      revenue: deltas.revenueDelta,
      revenuePct: deltas.revenuePct,
      expenses: deltas.expensesDelta,
      expensesPct: deltas.expensesPct,
      profit: deltas.profitDelta,
      profitPct: deltas.profitPct,
    };

    // --- Ads Delta ---
    const adsDelta = getMockAdsDelta();

    // --- Generate AI CFO insights ---
    let insights = generateAICFOMessages(digitsSnapshot, gaData.delta, adsDelta);
    
    // --- Attach saved answers ---
    const { data: answersData } = await supabase
      .from("cfo_insight_answers")
      .select("*")
      .eq("business_id", businessId);

    const insightsWithAnswers = insights.map(insight => ({
      ...insight,
      userAnswer: answersData?.find(a => a.insight_id === insight.id)?.answer || "",
    }));
    
    const priorAnswers: Record<string, string> = {};

    answersData?.forEach(a => {
      priorAnswers[a.insight_id] = a.answer;
    });

    const cfoOutput = await runCFOAgent({
      insights: insightsWithAnswers,
      priorAnswers,
    });

    return NextResponse.json({
      current: currentData,
      previous: prevData,
      deltas,
      googleAnalyticsData: gaData,
      adsData: adsDelta,
      insightsWithAnswers,
      cfoOutput
    });

  } catch (err) {
    console.error("CFO Snapshot API Error:", err);
    return NextResponse.json({ error: "Failed to fetch CFO snapshot" }, { status: 500 });
  }
}