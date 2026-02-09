import { GoogleGenerativeAI } from "@google/generative-ai";
import { CFO_AGENT_SYSTEM_PROMPT } from "./cfoAgent.instructions";
import { CFOAgentInput, CFOAgentOutput } from "./cfoAgent.contract";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function runCFOAgent(
  input: CFOAgentInput
): Promise<CFOAgentOutput> {

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `
${CFO_AGENT_SYSTEM_PROMPT}

--- CURRENT INSIGHTS ---
${JSON.stringify(input.insights, null, 2)}

--- PRIOR OWNER ANSWERS ---
${JSON.stringify(input.priorAnswers, null, 2)}

Analyze the business as a CFO.
Respond ONLY in valid JSON matching this schema:

{
  "executiveSummary": string,
  "keyRisks": string[],
  "keyOpportunities": string[],
  "followUpQuestions": [
    {
      "insightId": string | null,
      "question": string,
      "reason": string
    }
  ],
  "advisorNotes": string
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini JSON parse failed:", text);
    throw new Error("Invalid CFO Agent output");
  }
}
