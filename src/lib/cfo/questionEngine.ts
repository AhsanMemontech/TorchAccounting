import { Signal } from "./signalEngine";

export type CFOQuestion = {
  id: string;
  question: string;
  owner: "business_owner" | "advisor";
  blocking: boolean;
};

export function generateQuestions(signals: Signal[]): CFOQuestion[] {
  const questions: CFOQuestion[] = [];

  if (signals.find(s => s.id === "REVENUE_DROP")) {
    questions.push({
      id: "Q_REVENUE_DROP",
      question: "Did any major customers churn or delay purchases this month?",
      owner: "business_owner",
      blocking: true
    });
  }

  if (signals.find(s => s.id === "TRAFFIC_DROP")) {
    questions.push({
      id: "Q_TRAFFIC_DROP",
      question: "Were any marketing campaigns paused or reduced?",
      owner: "business_owner",
      blocking: false
    });
  }

  return questions;
}