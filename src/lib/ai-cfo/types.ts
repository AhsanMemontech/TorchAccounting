// lib/ai-cfo/types.ts

export type CFOInsightType = "alert" | "positive" | "question"

export type CFOInsight = {
  id: string
  type: CFOInsightType
  title: string
  message: string
  relatedMetrics?: string[]
  severity?: "low" | "medium" | "high"
  requiresResponse: boolean,
  userAnswer?: string;
  followUpQuestions?: string[]; 

  suggestedInvestigations?: string[];
  advisorFlag?: "none" | "review_recommended" | "urgent_review";
  status?: "open" | "answered" | "resolved";
}
  
export type DigitsSnapshot = {
    revenue: number;
    revenuePct: number;
    expenses: number;
    expensesPct: number;
    profit: number;
    profitPct: number;
};
  
export type GADelta = {
    sessions: number;
    sessionsPct: number;
    users: number;
    usersPct: number;
    conversions: number;
    conversionsPct: number;
    revenue: number;
    revenuePct: number;
};
  
export type AdsDelta = {
    spend: number;
    spendPct: number;
    clicks: number;
    clicksPct: number;
    impressions: number;
    impressionsPct: number;
};  

export type AISignal = {
    id: string;                    // Unique identifier
    type: "revenue" | "expenses" | "profit" | "marketing" | "cash" | "other";
    headline: string;              // 1-line summary for feed
    summary: string;               // 1-2 lines explaining change
    drivers: DriverNode[];         // Decomposable tree of contributing factors
    severityLevel: "critical" | "warning" | "watch" | "stable";
    severityScore: number;         // Numeric score for sorting
    valueCurrent: number,
    valuePrevious: number,
    deltaPct: number,
    impactEstimate?: {
        cashImpact?: number;       // Optional, in $
        runwayImpactMonths?: number; // Optional
    };
    persistenceMonths: number;     // How many months this trend has persisted
    contradiction?: boolean;       // True if user input conflicts with system data
    audienceOverlay?: AudienceNode[]; // Optional, for traffic / behavior context
    createdAt: string;             // ISO timestamp
};

export type DriverNode = {
    name: string;
    current: number;
    previous: number;
    deltaPct: number;
    contributionToChange?: number;
    children?: DriverNode[];
};

export type AudienceNode = {
    segment: string;        // e.g., "New Visitors", "Mobile Users", "High Income Geo"
    deltaPct: number;       // Change MoM
    absoluteChange?: number;
};