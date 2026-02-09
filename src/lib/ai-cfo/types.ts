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