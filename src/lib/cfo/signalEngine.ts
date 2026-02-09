export type Signal = {
    id: string;
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
    deltaPct?: number;
    related?: string[];
  };
  
  const pctChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  export function generateSignals(snapshot: any): Signal[] {
    const signals: Signal[] = [];
  
    const revDelta = pctChange(
      snapshot.accounting.current.revenue,
      snapshot.accounting.previous.revenue
    );
  
    if (revDelta < -20) {
      signals.push({
        id: "REVENUE_DROP",
        type: "revenue",
        severity: revDelta < -50 ? "high" : "medium",
        description: "Revenue dropped significantly",
        deltaPct: revDelta
      });
    }
  
    const trafficDelta = pctChange(
      snapshot.marketing.current.traffic,
      snapshot.marketing.previous.traffic
    );
  
    if (trafficDelta < -20) {
      signals.push({
        id: "TRAFFIC_DROP",
        type: "marketing",
        severity: trafficDelta < -40 ? "high" : "medium",
        description: "Website traffic dropped significantly",
        deltaPct: trafficDelta
      });
    }
  
    if (revDelta < -20 && trafficDelta < -20) {
      signals.push({
        id: "REV_TRAFFIC_CORRELATION",
        type: "correlation",
        severity: "high",
        description: "Revenue decline appears correlated with traffic decline",
        related: ["REVENUE_DROP", "TRAFFIC_DROP"]
      });
    }
  
    return signals;
  }  