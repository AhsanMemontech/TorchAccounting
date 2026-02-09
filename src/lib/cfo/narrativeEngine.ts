import { Signal } from "./signalEngine";
import { CFOQuestion } from "./questionEngine";

export function buildCfoPrompt(
  signals: Signal[],
  questions: CFOQuestion[]
) {
  return `
You are an AI CFO.

Given these business signals:
${signals.map(s => `- ${s.description}`).join("\n")}

And these open questions:
${questions.map(q => `- ${q.question}`).join("\n")}

Write:
1) A concise CFO-style summary (max 5 bullets)
2) What likely caused the changes
3) What needs confirmation from the owner
4) Suggested next actions

Use plain English. Be decisive but cautious.
`;
}