import { CFOInsight } from "@/lib/ai-cfo/types";

export interface CFOAgentInput {
  insights: CFOInsight[];
  priorAnswers: Record<string, string>;
  businessContext?: {
    industry?: string;
    pricingModel?: string;
    seasonality?: string;
  };
}

export interface CFOAgentOutput {
  summary: string;

  analysis: {
    whatChanged: string[];
    whyItMatters: string[];
    likelyDrivers: string[];
    questionsForOwner: string[];
    dataGaps: string[];
  };

  advisorFlags: {
    urgent: boolean;
    reviewRecommended: boolean;
  };
}