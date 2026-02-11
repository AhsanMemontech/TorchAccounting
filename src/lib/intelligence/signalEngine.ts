// lib/intelligence/signalEngine.ts
import { AISignal, DriverNode } from "@/lib/ai-cfo/types";
import { fetchSnapshot, fetchGAData, fetchAudienceLab } from "./dataFetchers";

export async function generateSignals(businessId: string): Promise<AISignal[]> {
  // 1️⃣ Fetch all necessary data
  const snapshot = await fetchSnapshot(businessId);
  const gaData = await fetchGAData(businessId);
  const audienceData = await fetchAudienceLab(businessId);

  const signals: AISignal[] = [];

  function safeDelta(current: number, previous: number) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  function safeNumber(value?: number): number {
    if (!value || isNaN(value)) return 0;
    return value;
  }
  
  // 2️⃣ Helper: severity calculation
  function calculateSeverity({ deltaPct, persistenceMonths, cashImpact }: any) {
    let score = Math.abs(deltaPct) * 1.5; // magnitude
    if (persistenceMonths >= 3) score *= 1.5; // persistent trend
    if (cashImpact) score += cashImpact * 10; // runway sensitivity
    
    let level: "critical" | "warning" | "watch" | "stable" = "stable";
    if (score > 80) level = "critical";
    else if (score > 50) level = "warning";
    else if (score > 20) level = "watch";

    return { score, level };
  }

  // 3️⃣ Revenue Signal
  //const revenueDelta = ((snapshot.revenue - snapshot.revenuePrev) / snapshot.revenuePrev) * 100;
  const revenueDelta = safeDelta(snapshot.revenue, snapshot.revenuePrev);
  const revenueDrivers: DriverNode[] = [
    {
      name: "Traffic",
      deltaPct: safeDelta(gaData.sessions, gaData.sessionsPrev),
      current: gaData.sessions,
      previous: gaData.sessionsPrev
    },
    {
      name: "Conversion Rate",
      deltaPct: safeDelta(gaData.conversions, gaData.conversionsPrev),
      current: gaData.conversions,
      previous: gaData.conversionsPrev
    },
    {
      name: "AOV",
      deltaPct: safeDelta(snapshot.avgOrderValue, snapshot.avgOrderValuePrev),
      current: snapshot.avgOrderValue,
      previous: snapshot.avgOrderValuePrev
    },
  ];
  const revenueSeverity = calculateSeverity({
    deltaPct: revenueDelta,
    persistenceMonths: snapshot.revenuePersistence ?? 1,
    cashImpact: snapshot.runwayMonths ?? 0,
  });

  signals.push({
    id: "revenue-1",
    type: "revenue",
    headline:
    snapshot.revenuePersistence >= 3
        ? `Structural revenue ${revenueDelta < 0 ? "decline" : "growth"} ${revenueDelta.toFixed(2)}%`
        : `Revenue ${revenueDelta < 0 ? "down" : "up"} ${revenueDelta.toFixed(2)}% MoM`,
    summary: `Traffic ${revenueDrivers[0].deltaPct.toFixed(1)}%, Conversion ${revenueDrivers[1].deltaPct.toFixed(1)}%, AOV ${revenueDrivers[2].deltaPct.toFixed(1)}%`,
    drivers: revenueDrivers,
    severityLevel: revenueSeverity.level,
    severityScore: revenueSeverity.score,
    valueCurrent: snapshot.revenue,
    valuePrevious: snapshot.revenuePrev,
    deltaPct: revenueDelta,
    impactEstimate: { runwayImpactMonths: snapshot.runwayMonths },
    persistenceMonths: snapshot.revenuePersistence,
    audienceOverlay: audienceData,
    createdAt: new Date().toISOString(),
  });

  // 4️⃣ Expenses Signal
  
    const expensesCurrent = safeNumber(snapshot.expenses);
    const expensesPrev = safeNumber(snapshot.expensesPrev);

    const expensesDelta = safeDelta(expensesCurrent, expensesPrev);

    const expensesSeverity = calculateSeverity({
    deltaPct: expensesDelta,
    persistenceMonths: snapshot.expensesPersistence ?? 1,
    cashImpact: snapshot.runwayMonths ?? 0,
    });

    signals.push({
    id: "expenses-1",
    type: "expenses",
    headline: `Expenses ${expensesDelta < 0 ? "down" : "up"} ${expensesDelta.toFixed(2)}% MoM`,
    summary: `Expenses moved from ${expensesPrev.toLocaleString()} to ${expensesCurrent.toLocaleString()}`,
    drivers: [],
    severityLevel: expensesSeverity.level,
    severityScore: expensesSeverity.score,
    valueCurrent: expensesCurrent,
    valuePrevious: expensesPrev,
    deltaPct: expensesDelta,
    impactEstimate: { runwayImpactMonths: snapshot.runwayMonths },
    persistenceMonths: snapshot.expensesPersistence ?? 1,
    createdAt: new Date().toISOString(),
    });

  // 5️⃣ Profit Signal
  const profitDelta = safeDelta(snapshot.profit, snapshot.profitPrev);
  const profitCurrent = safeNumber(snapshot.profit);
  const profitPrev = safeNumber(snapshot.profitPrev);
  const profitSeverity = calculateSeverity({
    deltaPct: profitDelta,
    persistenceMonths: snapshot.profitPersistence ?? 1,
    cashImpact: snapshot.runwayMonths,
  });

  signals.push({
    id: "profit-1",
    type: "profit",
    headline: `Profit ${profitDelta < 0 ? "down" : "up"} ${profitDelta.toFixed(2)}% MoM`,
    summary: `Profit moved from ${snapshot.profitPrev.toLocaleString()} to ${snapshot.profit.toLocaleString()}`,
    drivers: [],
    severityLevel: profitSeverity.level,
    severityScore: profitSeverity.score,
    valueCurrent: profitCurrent,
    valuePrevious: profitPrev,
    deltaPct: profitDelta,
    impactEstimate: { runwayImpactMonths: snapshot.runwayMonths },
    persistenceMonths: snapshot.profitPersistence ?? 1,
    createdAt: new Date().toISOString(),
  });

  // 6️⃣ Sort by severity
  return signals.sort((a, b) => b.severityScore - a.severityScore);
}