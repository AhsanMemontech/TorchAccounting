export type Period = {
    start: string;
    end: string;
  };
  
  export type SnapshotMetrics = {
    revenue: number;
    cogs: number;
    expenses: number;
    profit: number;
  };
  
  export type MarketingMetrics = {
    traffic: number;
    users: number;
    conversions: number;
    revenue: number;
    adSpend?: number;
  };
  
  export type BusinessSnapshot = {
    period: {
      current: Period;
      previous: Period;
    };
    accounting: {
      current: SnapshotMetrics;
      previous: SnapshotMetrics;
    };
    marketing: {
      current: MarketingMetrics;
      previous: MarketingMetrics;
    };
  };
  