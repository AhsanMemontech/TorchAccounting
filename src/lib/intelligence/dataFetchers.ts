// lib/intelligence/dataFetchers.ts
export async function fetchSnapshot(businessId: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cfo/snapshot?businessId=${businessId}`);
    if (!res.ok) throw new Error("Failed to fetch snapshot");
  
    const data = await res.json();
  
    return {
      // Current month totals
      revenue: data.current.totalRevenue,
      expenses: data.current.totalExpenses,
      profit: data.current.profit,
      avgOrderValue: data.current.avgOrderValue ?? 0,
  
      // Previous month totals
      revenuePrev: data.previous.totalRevenue,
      expensesPrev: data.previous.totalExpenses,
      profitPrev: data.previous.profit,
      avgOrderValuePrev: data.previous.avgOrderValue ?? 0,
  
      // Deltas
      revenueDelta: data.deltas.revenueDelta,
      expensesDelta: data.deltas.expensesDelta,
      profitDelta: data.deltas.profitDelta,
  
      // Optional persistence / runway info (mocked if not available)
      revenuePersistence: data.revenuePersistence ?? 1,
      expensesPersistence: data.expensesPersistence ?? 1,
      profitPersistence: data.profitPersistence ?? 1,
      runwayMonths: data.runwayMonths ?? 0,
  
      // Full raw data if needed
      raw: data
    };
  }
  
  export async function fetchGAData(businessId: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cfo/snapshot?businessId=${businessId}`);
    if (!res.ok) throw new Error("Failed to fetch GA data");
  
    const data = await res.json();
  
    const ga = data.googleAnalyticsData;
  
    return {
      sessions: ga.current.sessions,
      sessionsPrev: ga.previous?.sessions ?? ga.current.sessions,
      users: ga.current.users,
      usersPrev: ga.previous?.users ?? ga.current.users,
      conversions: ga.current.conversions,
      conversionsPrev: ga.previous?.conversions ?? ga.current.conversions,
      revenue: ga.current.revenue,
      revenuePrev: ga.previous?.revenue ?? ga.current.revenue
    };
  }
  
  export async function fetchAudienceLab(businessId: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cfo/snapshot?businessId=${businessId}`);
    if (!res.ok) throw new Error("Failed to fetch Audience Lab data");
  
    const data = await res.json();
  
    // Example mapping from report structure, create segments
    const segments: { segment: string; deltaPct: number; absoluteChange?: number }[] = [];
  
    if (data.adsData?.audienceSegments) {
      for (const seg of data.adsData.audienceSegments) {
        segments.push({
          segment: seg.name,
          deltaPct: seg.deltaPct,
          absoluteChange: seg.delta
        });
      }
    }
  
    return segments;
  }  